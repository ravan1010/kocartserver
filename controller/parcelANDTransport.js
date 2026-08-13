import parcelANDtransportDB from "../model/parcelANDtransport.js";
import BikeParcel_Order from "../model/BikeParcel_Order.js";

import axios from "axios";
import dotenv from 'dotenv'

dotenv.config();


const getDriverETA = async (driverLocation, pickupLocation) => {
  try {
    const apiKey = process.env.GEOAPIFY_KEY;

    const driverLng = driverLocation.coordinates[0];
    const driverLat = driverLocation.coordinates[1];

    const pickupLng = pickupLocation.coordinates[0];
    const pickupLat = pickupLocation.coordinates[1];

    const res = await axios.get(
      "https://api.geoapify.com/v1/routing",
      {
        params: {
          waypoints: `${driverLat},${driverLng}|${pickupLat},${pickupLng}`,
          mode: "drive",
          apiKey,
        },
      }
    );

    const feature = res.data.features?.[0];

    if (!feature) {
      return null;
    }

    const seconds = feature.properties.time;
    const distanceMeters = feature.properties.distance;

    return {
      distanceKm: Number((distanceMeters / 1000).toFixed(2)),
      etaMinutes: Math.max(1, Math.ceil(seconds / 60)),
    };
  } catch (error) {
    console.error("Driver ETA error:", error.message);
    return null;
  }
};



export const updateBikeParcelDriverLocation = async (req, res) => {
  try {
    const driverId = req.parcelandtransport.id;
    const { latitude, longitude } = req.body;

    // Validate location
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required.",
      });
    }

    // 1. Update driver's current location
    await parcelANDtransportDB.findByIdAndUpdate(
      driverId,
      {
        $set: {
          currentLocation: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      }
    );

    // 2. Find active order
    const order = await BikeParcel_Order.findOne({
      driver: driverId,
      status: "driver_assigned",
    });

    // No active order
    if (!order) {
      return res.status(200).json({
        success: true,
        message: "Location updated.",
      });
    }

    // 3. Create current driver location
    const driverLocation = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    // 4. Calculate ETA and distance to pickup
    const eta = await getDriverETA(
      driverLocation,
      order.pickup.location
    );

    // 5. Save ETA and distance
    order.driverEtaMinutes = eta?.etaMinutes ?? null;
    order.driverDistanceKm = eta?.distanceKm ?? null;

     // Optional: save driver location inside order

    await order.save();

    // 6. Response
    return res.status(200).json({
      success: true,
      driverLocation,
      driverEtaMinutes: order.driverEtaMinutes,
      driverDistanceKm: order.driverDistanceKm,
    });

  } catch (err) {
    console.error(
      "updateBikeParcelDriverLocation:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const parcelandtransportFCMtoken = async (req, res) => {
  try {
    const number = req.parcelandtransport.id
    const { fcmToken } = req.body;
    console.log('number :', number)

    if (!fcmToken) {
      return res.status(400).json({ success: false });

    }

    await parcelANDtransportDB.updateMany({ _id: number }, {
      fcmToken: fcmToken
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

export const updatePartnerDetails = async (req, res) => {
  try {
    const {
      vehicalNO,
      vehicalName,
      serviceType,
      latitude,
      longitude,
      phoneNumber,
      city,
    } = req.body;

    const partnerId = req.parcelandtransport.id; // From JWT middleware

    const updatedPartner = await parcelANDtransportDB.findByIdAndUpdate(
      partnerId,
      {
          Number: phoneNumber,
        city,
        vehicalNO,
        vehicalName,
        serviceType,
        currentLocation: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)], // MongoDB uses [lng, lat]
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPartner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      partner: updatedPartner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const parceldashboard = async (req, res, next) => {
  try {
    const id = req.parcelandtransport.id
    const parcel = await parcelANDtransportDB.findById(id)

    res.status(201).json({
      isOnline: parcel.isOnline,
      id: parcel._id,
      kocartAmount: parcel.kocartAmount,
      activate: parcel.activate,
      serviceType: parcel.serviceType,
    })

  } catch (error) {
    res.json(error)
  }
}

export const parcelBoyIsOnline = async (req, res) => {
  try {
    const id = req.parcelandtransport.id
    console.log(id, req.body)
    const admin = await parcelANDtransportDB.findById(id)
    // const post = await post_model.findOne({ author: admin._id })

    admin.isOnline = !admin.isOnline;
    await admin.save();
    console.log(admin._id, admin.isOnline)

    res.json({ success: true })

  } catch (error) {
    res.json({ message: error })
  }
}



////availble orders 
export const getNearbyPendingOrders = async (req, res) => {
  try {
    const { serviceType } = req.params;

    const allowedServiceTypes = [
      "bike_parcel",
      "auto_passenger",
      "goods_auto",
    ];

    if (!allowedServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type",
      });
    }

    const partner = await parcelANDtransportDB.findById(
      req.parcelandtransport.id
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (
      partner.isAvailable === false ||
      partner.isOnline === false ||
      partner.activate === false 
    ) {
      return res.json({
        success: false,
        message: "Partner is not available",
        orders: [],
      });
    }

if (partner.onPending?.Pending === true) {
  return res.json({
    success: false,
    message: "Partner is on another order",
    orders: [],
  });
}

    const orders = await BikeParcel_Order.find({
      status: "pending",
      serviceType,
      "pickup.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: partner.currentLocation.coordinates,
          },
          $maxDistance: 5000,
        },
      },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      serviceType,
      count: orders.length,
      orders,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//accespt order to auto driver
export const acceptBikeParcelOrder = async (req, res) => {3
  try {
    const { orderId } = req.params;
    const partnerId = req.parcelandtransport.id;

    // 1. Accept order
    const order = await BikeParcel_Order.findById(orderId);

    // if (!order) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Order already accepted or not found.",
    //   });
    // }

    // 2. Get driver current location
    const driver = await parcelANDtransportDB.findById(partnerId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    // 5. Make partner unavailable
    await parcelANDtransportDB.findByIdAndUpdate(
      partnerId,
      {
        $set: {
          onPending:
          {
            orderId: orderId,
            Pending: true,
          }
        },
      }
    );

    // 6. Response
    return res.status(200).json({
      success: true,
      message: "Order accepted successfully.",
      order,
    });

  } catch (err) {
    console.error("acceptBikeParcelOrder:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//get accepted order to auto driver
export const getacceptedPendingOrders = async (req, res) => {
  try {
  
    const partner = await parcelANDtransportDB.findById(
      req.parcelandtransport.id
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (
      partner.isAvailable === false ||
      partner.isOnline === false ||
      partner.activate === false 
    ) {
      return res.json({
        success: false,
        message: "Partner is not available",
        orders: [],
      });
    }

     const orderId = partner.onPending?.orderId;

    if (!orderId) {
      return res.status(404).json({
        success: false,
        message: "No accepted order",
        order: [],
      });
    }

    const orders = await BikeParcel_Order.find({
      _id: orderId,
      status: "pending",
      serviceType: partner.serviceType,
      "pickup.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: partner.currentLocation.coordinates,
          },
          $maxDistance: 5000,
        },
      },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      serviceType,
      count: orders.length,
      orders,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//save amount and distance
export const submitDriverAmount = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const partnerId = req.parcelandtransport.id;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const driver = await parcelANDtransportDB.findById(partnerId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const order = await BikeParcel_Order.findOne({
      _id: orderId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Accepted order not found",
      });
    }

    // Calculate driver → pickup ETA
    const eta = await getDriverETA(
      driver.currentLocation,
      order.pickup.location
    );

    if (!eta) {
      return res.status(500).json({
        success: false,
        message: "Unable to calculate driver ETA",
      });
    }

    // Add driver's quote
    const existingDriverIndex = order.selectDriver.findIndex(
      (item) => item.driver.toString() === partnerId.toString()
    );

    if (existingDriverIndex >= 0) {
      order.selectDriver[existingDriverIndex].amount = Number(amount);
      order.selectDriver[existingDriverIndex].EtaMinutes =
        eta.etaMinutes;
      order.selectDriver[existingDriverIndex].DistanceKm =
        eta.distanceKm;
    } else {
      order.selectDriver.push({
        driver: partnerId,
        amount: Number(amount),
        EtaMinutes: eta.etaMinutes,
        DistanceKm: eta.distanceKm,
      });
    }

    // Also save current driver's ETA
    order.driverEtaMinutes = eta.etaMinutes;
    order.driverDistanceKm = eta.distanceKm;

    await order.save();
    return res.json({
      success: true,
      message: "Amount submitted successfully",
      order,
      eta,
    });

  } catch (err) {
    console.error("submitDriverAmount:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

















export const getAcceptedBikeParcelOrder = async (req, res) => {
  try {
    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)
    const order = await BikeParcel_Order.findOne({
      serviceType: partner.serviceType,
      status: {
        $in: [
          "driver_assigned",
        ],
      },
    })
      .populate("customer", "name Number")
      .sort({ updatedAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No active order found.",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};











export const driverArrivedUpdate = async (req, res) => {
  try {
    const { orderId } = req.params;
    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)

    const order = await BikeParcel_Order.findOneAndUpdate(
      {
        _id: orderId,
        driver: partner._id,
        serviceType: partner.serviceType,
        status: "driver_assigned",
      },
      {
        $set: {
          status: "driver_arrived",
        },
      },
      {
        new: true,
      }
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order already accepted or not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order accepted successfully.",
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }

}

export const ReassignParcelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)

    const order = await BikeParcel_Order.findOneAndUpdate(
      {
        _id: orderId,
        driver: partner._id,
        serviceType: partner.serviceType,
        status: "driver_assigned",
      },
      {
        $set: {
          status: "pending",
          driver: null,
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order not found or cannot be cancelled.",
      });
    }

    // Make partner available again
    await parcelANDtransportDB.findByIdAndUpdate(
      req.parcelandtransport.id,
      {
        $set: {
         isAvailable : true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getArrivedOrder = async (req, res) => {
  try {
    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)

    const order = await BikeParcel_Order.findOne({
      driver: partner._id,
      serviceType: partner.serviceType,
      status: {
        $in: [
          "driver_arrived",
        ],
      },
    })
      .populate("customer", "name Number")
      .sort({ updatedAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No active order found.",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyPickupOtp = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)

    const order = await BikeParcel_Order.findOne({
      _id: orderId,
      driver: partner._id,
      serviceType: partner.serviceType,
      status: "driver_arrived",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you.",
      });
    }

    if (Number(otp) !== order.otp.pickup) {
      return res.status(400).json({
        success: false,
        message: "Invalid Pickup OTP.",
      });
    }

    order.status = "picked_up";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Pickup verified successfully.",
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getPickedUpOrder = async (req, res) => {
  try {

    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)

    const order = await BikeParcel_Order.findOne({
      driver: partner._id,
      serviceType: partner.serviceType,
      status: "picked_up",
    })
      .populate("customer", "name Number")
      .sort({ updatedAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No picked up order found.",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id)

    const order = await BikeParcel_Order.findOne({
      _id: orderId,
      driver: partner._id,
      serviceType: partner.serviceType,
      status: "picked_up",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you.",
      });
    }

    if (Number(otp) !== order.otp.delivery) {
      return res.status(400).json({
        success: false,
        message: "Invalid Delivery OTP.",
      });
    }

    // Update order
    order.status = "completed";
    order.kocartAmount += 5;
    order.deliveredAt = new Date(); // Optional
    await order.save();

    // Make partner available again
    await parcelANDtransportDB.findByIdAndUpdate(
      req.parcelandtransport.id,
      {
        $set: {
          isAvailable: true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Order delivered successfully.",
      order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

