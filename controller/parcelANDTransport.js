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
      "4_wheel_goods_auto",
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

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order already accepted or not found.",
      });
    }

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

    // Driver must be online and activated
    if (
      partner.isOnline !== true ||
      partner.activate !== true ||
      partner.isAvailable !== true
    ) {
      return res.json({
        success: false,
        message: "Partner is not available",
        order: null,
      });
    }

    // Get accepted order ID
    const orderId = partner.onPending?.orderId;

    if (!orderId) {
      return res.json({
        success: true,
        message: "No accepted order",
        order: null,
      });
    }

    // Get order
    const order = await BikeParcel_Order.findOne({
      _id: orderId,
      serviceType: partner.serviceType,
      status: "pending",
    });

    if (!order) {
      return res.json({
        success: true,
        message: "Order not found",
        order: null,
      });
    }

    // Check whether this driver already submitted amount
    const driverQuote = order.selectDriver?.find(
      (item) =>
        item.driver?.toString() === partner._id.toString()
    );

    // Driver already submitted amount
    if (driverQuote) {
      return res.json({
        success: true,
        type: "confirm",
        message: "Amount already submitted. Waiting for customer confirmation.",
        loading: true,
        order,
        driverId: partner._id,
        driverQuote: {
          amount: driverQuote.amount,
          etaMinutes: driverQuote.EtaMinutes,
          distanceKm: driverQuote.DistanceKm,
        },
      });
    }

    // Driver has accepted but has not submitted amount
    return res.json({
      success: true,
      type: "normal",
      message: "Order accepted. Please enter your amount.",
      loading: false,
      driverId: partner._id,
      order,
    });

  } catch (err) {
    console.error("getacceptedPendingOrders:", err);

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

//driver assign
export const assignSelectedDriver = async (req, res) => {
  try {
    const { orderId, driverId } = req.body;

    // 1. Find order
    const order = await BikeParcel_Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2. Make sure selectDriver exists
    if (!Array.isArray(order.selectDriver)) {
      return res.status(400).json({
        success: false,
        message: "No drivers have submitted quotes",
      });
    }

    // 3. Find selected driver's quote
    const selectedDriver = order.selectDriver.find(
      (item) =>
        item.driver &&
        item.driver.toString() === driverId.toString()
    );

    if (!selectedDriver) {
      return res.status(404).json({
        success: false,
        message: "Selected driver quote not found",
      });
    }

    // 4. Find selected driver
    const driver = await parcelANDtransportDB.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // 5. Copy selected driver's quote into main order
    order.driver = selectedDriver.driver;

    order.amount = selectedDriver.amount;

    order.driverEtaMinutes =
      selectedDriver.EtaMinutes;

    order.driverDistanceKm =
      selectedDriver.DistanceKm;

    // 6. Change order status
    order.status = "driver_assigned";

    // 7. Selected driver is now assigned
    driver.isAvailable = false;

    if (driver.onPending) {
      driver.onPending.Pending = false;
      driver.onPending.orderId = null;
    }

    await driver.save();

    // 8. Find all other drivers who submitted quotes
    const otherDriverIds = order.selectDriver
      .filter(
        (item) =>
          item.driver &&
          item.driver.toString() !== driverId.toString()
      )
      .map((item) => item.driver);

    // 9. Clear pending state for other drivers
    if (otherDriverIds.length > 0) {
      await parcelANDtransportDB.updateMany(
        {
          _id: { $in: otherDriverIds },
        },
        {
          $set: {
            "onPending.orderId": null,
            "onPending.Pending": false,
          },
        }
      );
    }

    // 10. Save order
    await order.save();

    return res.json({
      success: true,
      message: "Driver assigned successfully",

      orderId: order._id,

      selectedDriverId: driverId,

      driver: {
        id: order.driver,
        amount: order.amount,
        EtaMinutes: order.driverEtaMinutes,
        DistanceKm: order.driverDistanceKm,
      },
    });

  } catch (error) {
    console.error("assignSelectedDriver:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

















export const getAcceptedBikeParcelOrder = async (req, res) => {
  try {
    const partnerId = req.parcelandtransport.id;

    const partner = await parcelANDtransportDB.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const order = await BikeParcel_Order.findOne({
      driver: partner._id,
      serviceType: partner.serviceType,
      status: "driver_assigned",
    })
      .populate("customer", "name Number")
      .sort({ updatedAt: -1 });

    if (!order) {
      return res.status(200).json({
        success: true,
        order: order,
        partner: partner._id,
        id: req.parcelandtransport.id,
        p: partner,

      });
    }

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("GET CURRENT ORDER ERROR:", err);

    return res.status(500).json({
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

    const partner = await parcelANDtransportDB.findById(
      req.parcelandtransport.id
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found.",
      });
    }

    // Find order first
    const order = await BikeParcel_Order.findOne({
      _id: orderId,
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order not found or cannot be reassigned.",
      });
    }

    // Remove this partner from selectDriver
    const exists = order.selectDriver?.some(
  (driver) =>
    String(driver.driver) === String(partner._id)
);

if (exists) {
  order.selectDriver = order.selectDriver.filter(
    (driver) =>
      String(driver.driver) !== String(partner._id)
  );
}

    await order.save();

    // Make partner available + clear pending order
    await parcelANDtransportDB.findByIdAndUpdate(
      partner._id,
      {
        $set: {
          "onPending.orderId": null,
          "onPending.Pending": false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Order reassigned successfully.",
      order,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getArrivedOrder = async (req, res) => {
  try {

    const partnerId = req.parcelandtransport.id;

    const partner = await parcelANDtransportDB.findById(partnerId)

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
    const partnerId = req.parcelandtransport.id;

    const partner = await parcelANDtransportDB.findById(partnerId)

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
    order.deliveredAt = new Date(); // Optional
    await order.save();

    let commissionRate = 0.05;
    const platformCommission = order.amount * commissionRate;
    
    // Make partner available again
    await parcelANDtransportDB.findByIdAndUpdate(
  req.parcelandtransport.id,
  {
    $set: {
      isAvailable: true,
    },
    $inc: {
      kocartAmount: platformCommission,
    },
  },
  { new: true }
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



//user side
export const cancelParcelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await BikeParcel_Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Don't allow cancellation after completion/cancellation
    if (
      order.status === "completed" ||
      order.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    /*
     * Get all drivers who were selected/offered this order
     */
    const driverIds = (order.selectDriver || [])
      .map((item) => item.driver)
      .filter(Boolean);

    /*
     * Reset onPending for all those drivers
     */
    if (driverIds.length > 0) {
      await parcelANDtransportDB.updateMany(
        {
          _id: { $in: driverIds },
        },
        {
          $set: {
            "onPending.orderId": null,
            "onPending.Pending": false,
          },
        }
      );
    }

    /*
     * Update order status
     */
    order.status = "cancelled";
    order.driver = null;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};