import usermodel from '../model/user_model.js';
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import axios from "axios";
import branch_model from '../model/branch_model.js';
import parcelANDtransport from '../model/parcelANDtransport.js';
import BikeParcel_Order from '../model/BikeParcel_Order.js';
import { sendPushNotification } from '../utils/firebase.js';

dotenv.config();


export const serviceType = async (req, res) => {
  try {
    const id = req.Atoken.id;

    const user = await usermodel.findById(id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate user location
 if (
  !user.location ||
  user.location.type !== "Point" ||
  !Array.isArray(user.location.coordinates) ||
  user.location.coordinates.length !== 2 ||
  (
    user.location.coordinates[0] === 0 &&
    user.location.coordinates[1] === 0
  )
) {
  return res.status(200).json({
    success: false,
    message: "Location not found",
    user: false,
  });
}

    // Find available transport services
    const serviceTypes = await parcelANDtransport.distinct(
      "serviceType",
      {
        activate: true,
        isOnline: true,
        isAvailable: true,

        currentLocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: user.location.coordinates,
            },
            $maxDistance: 5000,
          },
        },
      }
    );

    return res.status(200).json({
      success: true,

      city: user.city || "",

      serviceTypes,  
      user: true,

      update: 0,
      link: "https://www.kocart.online",
    });

  } catch (err) {
    console.error("serviceType error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createBikeParcelOrder = async (req, res) => {
  try {
    const {
      pickup,
      drop,
      parcel,
      payment,
      distance,
      amount,
    } = req.body;

    // Basic Validation
    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message: "Pickup and Drop are required.",
      });
    }

    if (
      pickup.location.coordinates.length !== 2 ||
      drop.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates.",
      });
    }

    // Generate Order ID
    const orderId =
      "BP" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    const pickupotp = Math.floor(1000 + Math.random() * 9000);
    const dropotp = Math.floor(1000 + Math.random() * 9000);

    const BikeParcel = await BikeParcel_Order.create({
      orderId,
      customer: req.Atoken.id,

      serviceType: "bike_parcel",
      distance,
      amount,

      pickup,
      drop,

      parcel,
      payment,

      otp: {
        pickup: pickupotp,
        delivery: dropotp,
      },

      status: "pending",
    });

      // ==========================
    // Find nearby bike partners (5 km)
    // ==========================

    const nearbyPartners = await parcelANDtransport.find({
      serviceType: "bike_parcel",
      isOnline: true, // optional
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: pickup.location.coordinates, // [longitude, latitude]
          },
          $maxDistance: 5000, // 5 km
        },
      },
    });

        // ==========================
    // Send notification
    // ==========================

    await Promise.all(
      nearbyPartners.map(async (partner) => {
        if (!partner.fcmToken) return;

        try {
          await sendPushNotification(
            partner.fcmToken,
            "📦 New Bike Parcel",
            `Pickup: ${distance} km | ₹${amount}`,
            "https://parcelandtransport.kocart.online/available/order"
          );
        } catch (err) {
          console.log("Notification Error:", err.message);
        }
      })
    );


    res.status(201).json({
      success: true,
      message: "Order Created Successfully",
      BikeParcel,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

export const getBikeParcelOrders = async (req, res) => {
  try {
    const orders = await BikeParcel_Order.find({
      customer: req.Atoken.id,
      serviceType: "bike_parcel",
    })
      .sort({ createdAt: -1 })
      .populate("driver", "name Number vehicalName vehicalNO")
      .lean();

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createPassengerAutoOrder = async (req, res) => {
  try {
    const {
      pickup,
      drop,
      passenger,
      payment,
      distance,
      amount,
    } = req.body;

    // Validation
    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message: "Pickup and Drop are required.",
      });
    }

    if (
      pickup.location.coordinates.length !== 2 ||
      drop.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates.",
      });
    }

    // Generate Order ID
    const orderId =
      "PA" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    const pickupOtp = Math.floor(1000 + Math.random() * 9000);
    const dropOtp = Math.floor(1000 + Math.random() * 9000);

    const order = await BikeParcel_Order.create({
      orderId,
      customer: req.Atoken.id,

      serviceType: "auto_passenger",

      pickup,
      drop,

      passenger, // optional object
      payment,

      distance,
      amount,

      otp: {
        pickup: pickupOtp,
        delivery: dropOtp,
      },

      status: "pending",
    });

    // ==========================
    // Find nearby auto partners
    // ==========================
    const nearbyPartners = await parcelANDtransport.find({
      serviceType: "auto_passenger",
      isOnline: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: pickup.location.coordinates,
          },
          $maxDistance: 5000,
        },
      },
    });

    // ==========================
    // Send notifications
    // ==========================
    await Promise.all(
      nearbyPartners.map(async (partner) => {
        if (!partner.fcmToken) return;

        try {
          await sendPushNotification(
            partner.fcmToken,
            "🚖 New Ride Request",
            `${distance} km `,
            "https://parcelandtransport.kocart.online"
          );
        } catch (err) {
          console.log("Notification Error:", err.message);
        }
      })
    );

    return res.status(201).json({
      success: true,
      message: "Ride booked successfully.",
      order,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//order status
export const getPassengerAutoOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.Atoken.id;

    const order = await BikeParcel_Order.findOne({
  _id: orderId,
  customer: userId,
})
  .populate(
    "driver",
    "name Number vehicalNO vehicalName currentLocation rating"
  )
  .populate(
    "selectDriver.driver",
    "name Number vehicalNO vehicalName currentLocation rating"
  );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Order finished
    if (
      order.status === "cancelled"
    ) {
      return res.json({
        success: true,
        order: null,
        status: order.status,
        redirect: true,
      });
    }

    if(
        order.status === "completed" 
    ) {
      return res.json({
        success: true,
        order: order,
      });
    }

    // Still searching
    if (order.status === "pending") {       

      return res.json({
        success: true,
        order: {
          _id: order._id,
          status: order.status,
          selectDriver: order.selectDriver,
        },
      });
    }

    // Driver assigned / arrived / picked up / ongoing
    if (
      [
        "driver_assigned",
        "driver_arrived",
        "picked_up",
        "ongoing",
      ].includes(order.status)
    ) {
      let driver = null;

      if (order.driver) {
        driver = {
          name: order.driver.name,
          number: order.driver.Number,
          vehicleNo: order.driver.vehicalNO,
          vehicleName: order.driver.vehicalName,
        };
      }

      return res.json({
        success: true,
        order: {
          _id: order._id,
          status: order.status,
          driver,
          driverEtaMinutes: order.driverEtaMinutes,
          driverDistanceKm: order.driverDistanceKm,
          otp: {
            pickupOtp: order.otp.pickup,
            deliveryOtp: order.otp.delivery,
          },
          goods: order.goods,
          amount: order.amount,
        },
      });
    }

    return res.json({
      success: true,
      order: null,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getpassengerAutoOrders = async (req, res) => {
  try {
    const orders = await BikeParcel_Order.find({
      customer: req.Atoken.id,
      serviceType: "auto_passenger",
    })
      .sort({ createdAt: -1 })
      .populate("driver", "name Number vehicalName vehicalNO")
      .lean();

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createGoodsAutoOrder = async (req, res) => {
    try {
        const {
            pickup,
            drop,
            goods,
            payment,
            distance,
            amount,
            type,
        } = req.body;

        console.log("GOODS AUTO BODY:", req.body);

        // Validate pickup coordinates
        if (
            !pickup?.location?.coordinates ||
            !Array.isArray(pickup.location.coordinates) ||
            pickup.location.coordinates.length !== 2
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pickup location coordinates",
            });
        }

        const coordinates = pickup.location.coordinates;

        // Make sure coordinates are numbers
        if (
            typeof coordinates[0] !== "number" ||
            typeof coordinates[1] !== "number"
        ) {
            return res.status(400).json({
                success: false,
                message: "Pickup coordinates must be numbers",
            });
        }

        const orderId =
            "GA" +
            Date.now() +
            Math.floor(Math.random() * 1000);

        const pickupOtp =
            Math.floor(1000 + Math.random() * 9000);

        const deliveryOtp =
            Math.floor(1000 + Math.random() * 9000);

        // Create order
        const order = await BikeParcel_Order.create({
            orderId,
            customer: req.Atoken.id,

            serviceType: type,

            pickup,
            drop,

            goods,
            payment,

            distance,
            amount,

            otp: {
                pickup: pickupOtp,
                delivery: deliveryOtp,
            },

            status: "pending",
        });

        console.log("ORDER CREATED:", order._id);

        // Find nearby goods auto partners
        const partners = await parcelANDtransport.find({
            serviceType: type,
            isOnline: true,

            currentLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: coordinates,
                    },
                    $maxDistance: 5000,
                },
            },
        });

        console.log(
            "NEARBY PARTNERS:",
            partners.length
        );

        // Send notification
        await Promise.all(
            partners.map(async (partner) => {
                if (!partner.fcmToken) return;

                try {
                    await sendPushNotification(
                        partner.fcmToken,
                        "🚚 New Goods Booking",
                        `${distance} km`,
                        "https://parcelandtransport.kocart.online"
                    );
                } catch (notificationError) {
                    console.error(
                        "Notification failed:",
                        partner._id,
                        notificationError.message
                    );
                }
            })
        );

        return res.status(201).json({
            success: true,
            order,
        });

    } catch (err) {
        console.error(
            "CREATE GOODS AUTO ORDER ERROR:",
            err
        );

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getGoodsAutoOrders = async (req, res) => {
  try {
    const orders = await BikeParcel_Order.find({
      customer: req.Atoken.id,
    })
      .sort({ createdAt: -1 })
      .populate("driver", "name Number vehicalName vehicalNO")
      .lean();

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//ko
export const getMyLocation = async (req, res) => {
  try {
    const userId = req.Atoken.id;

    const user = await usermodel
      .findById(userId)
      .select("location");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const coordinates = user.location?.coordinates || [0, 0];

    res.json({
      success: true,
      location: {
        longitude: coordinates[0],
        latitude: coordinates[1],
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get saved location",
    });
  }
};

export const getMonthlyAutoOrders = async (req, res) => {
  try {
    const { year, month } = req.query;

    const id = req.Atoken.id;

    const user = await usermodel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentDate = new Date();

    const selectedYear =
      Number(year) || currentDate.getFullYear();

    const selectedMonth =
      month !== undefined
        ? Number(month)
        : currentDate.getMonth() + 1;

    if (
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    const startDate = new Date(
      selectedYear,
      selectedMonth - 1,
      1
    );

    const endDate = new Date(
      selectedYear,
      selectedMonth,
      1
    );

    const goodsOrders =
      await BikeParcel_Order.find({
        customer: user._id,

        serviceType: {
          $in: [
            "goods_auto",
            "4_wheel_goods_auto",
          ],
        },

        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      })
        .sort({ createdAt: -1 })
        .lean();

    return res.json({
      success: true,

      year: selectedYear,
      month: selectedMonth,

      goodsOrders,
      

      goodsCount: goodsOrders.length,

      totalOrders: goodsOrders.length,
    });

  } catch (error) {
    console.error(
      "getMonthlyGoodsAutoOrders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly goods auto orders",
    });
  }
};

const transporter = nodemailer.createTransport({

  service: 'gmail',
  port: 587,
  starttls: {
    enable: true
  },
  secureConnection: true,
  auth: {
    user: 'ravanten3@gmail.com',
    pass: process.env.emailpass
  }
});

export const setting = async (req, res) => {
  try {
    console.log(req.Atoken);

    const id = req.Atoken?.id;

    console.log("User ID:", id);

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await usermodel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const autobooking = await BikeParcel_Order.find({
      customer: id,
    });

    // If you have an Order model:
    // const order = await Order.find({ customer: id });

    return res.status(200).json({
      success: true,
      number: user.email,
      user,

      // Change this according to your actual order model
      order: 0,

      autobooking: autobooking.length,
    });

  } catch (error) {
    console.error("SETTING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const distanceToParcel = async (req, res) => {
  try {
    const { pickuplat, pickuplng, droplat, droplng } = req.body;

    if (!pickuplat || !pickuplng || !droplat || !droplng) {
      return res.status(404).json({ massage: "fill require" })
    }

    const platform = 5;
    let deliveryFee = 18;


    const distance = await getRoadDistanceKm(
      {
        lat: pickuplat,
        lng: pickuplng,
      },
      {
        lat: droplat,
        lng: droplng,
      }
    )

    if (distance > 1) {
      const distance1to3 = Math.min(distance, 3) - 1;
      deliveryFee += Math.ceil(distance1to3) * 10;
    }

    if (distance > 3) {
      const distanceAfter3 = distance - 3;
      deliveryFee += Math.ceil(distanceAfter3) * 17;
    }

    return res.json({
      distance: Number(distance.toFixed(2)),
      amount: deliveryFee,
      platform
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

export const getBookingDriverLocation = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await BikeParcel_Order.find({
      user: userId,
      status: {
        $nin: ["cancelled", "completed"],
      },
    })
      .populate(
        "driver",
        "name Number vehicalNO vehicalName currentLocation"
      )
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(200).json({
        success: false,
        message: "No active booking found",
        bookings: [],
      });
    }

    const result = bookings.map((booking) => ({
      bookingId: booking._id,
      status: booking.status,

      driver: booking.driver
        ? {
            id: booking.driver._id,
            name: booking.driver.name,
            phoneNumber: booking.driver.Number,
            vehicalNO: booking.driver.vehicalNO,
            vehicalName: booking.driver.vehicalName,

            currentLocation:
              booking.driver.currentLocation || null,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      bookings: result,
    });
  } catch (error) {
    console.error("Get driver location error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};