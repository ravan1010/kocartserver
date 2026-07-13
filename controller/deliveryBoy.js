import post_model from '../model/event_post_model.js';
import branch_model from '../model/branch_model.js';
import branch_otp_model from '../model/branch_otp_model.js';
import user_model from '../model/user_model.js';
import order_model from '../model/order_model.js';
import Parcel_model from '../model/Parcel_model.js';
import deliveryBoy_model from '../model/deliveryBoy_model.js';
import dotenv from 'dotenv'
import admin_model from '../model/admin_model.js';

dotenv.config()

export const DeliveryBoyFCMtoken = async (req, res) => {
  try {
    const id = req.deliveryBoy.id
    const { fcmToken } = req.body;
    console.log(typeof fcmToken, 'id :', id)

    if (!fcmToken) {
      return res.status(400).json({ success: false });
    }

    await deliveryBoy_model.findByIdAndUpdate(id, {
      fcmToken,
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

export const DeliveryBoyLocation = async (req, res) => {
  try {
    const id = req.deliveryBoy.id
    const { city, Number, latitude, longitude } = req.body;

    console.log(city, latitude, Number)

    if (!id) {
      return res.status(400).json({ success: false });
    }

    const deliveryBoy = await deliveryBoy_model.findByIdAndUpdate(id, {
      city,
      Number,
      currentLocation: {
        type: "Point",
        coordinates: [
          parseFloat(longitude), // ✅ lng first
          parseFloat(latitude),  // ✅ lat second
        ]
      }
    });

    res.status(200).json({ success: true, deliveryBoy })
  } catch (error) {
    res.json(error)
  }
}

export const Deliverydashboard = async (req, res, next) => {
  try {
    const id = req.deliveryBoy.id
    const deliveryBoy = await deliveryBoy_model.findById(id)

    res.status(201).json({
      isOnline: deliveryBoy.isOnline,
      id: deliveryBoy._id
    })

  } catch (error) {
    res.json(error)
  }
}

export const DeliveryBoyIsOnline = async (req, res) => {
  try {
    const id = req.deliveryBoy.id
    console.log(id, req.body)
    const admin = await deliveryBoy_model.findById(id)
    // const post = await post_model.findOne({ author: admin._id })

    admin.isOnline = !admin.isOnline;
    await admin.save();
    console.log(admin._id, admin.isOnline)

    res.json({ success: true })

  } catch (error) {
    res.json({ message: error })
  }
}

export const DeliverygetOrders = async (req, res) => {
  try {

    const id = req.deliveryBoy.id
    console.log(id)
    const admin = await deliveryBoy_model.findById(id)

    if (admin.isAvailable === false) {
      return res.json({ success: false })
    }

    const orders = await order_model
      .find({
        status: "accepted",
        deliveryBoy: null
      })
      .populate("userId", "name")
      .populate("address", "street")
      .populate("shop.admin", "companyName")

    console.log(orders)

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
};

export const DeliveryAcceptOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy.id;
    const { orderId } = req.params;

    const order = await order_model.findOneAndUpdate(
      {
        _id: orderId,
        deliveryBoy: null
      },
      {
        deliveryBoy: deliveryBoyId,
        status: "assigned"
      },
      {
        new: true
      }
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned"
      });
    }

    await deliveryBoy_model.findByIdAndUpdate(
      deliveryBoyId,
      {
        isAvailable: false
      }
    );

    res.json({
      success: true,
      message: "Order Assigned",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
};

export const DeliverygetAssignOrders = async (req, res) => {
  try {

    const id = req.deliveryBoy.id
    console.log(id)
    const admin = await deliveryBoy_model.findById(id)

    const orders = await order_model
      .find({
        status: "assigned",
        deliveryBoy: id
      })
      .populate("userId", "name")
      .populate("address")
      .populate("shop.admin", "companyName location address")
      .populate("shop.items.productId", "name variantname ")
      .populate("shop.items.productId.variants", "name price")


    res.json({
      success: true,
      orders
    });

  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
};

export const Deliverypickedup = async (req, res) => {
  try {
    const id = req.deliveryBoy.id

    console.log(id)

    const { orderId } = req.params;

    const order = await order_model.findOneAndUpdate(
      {
        _id: orderId,
        deliveryBoy: id
      },
      {
        status: "pickedup",
      },
      {
        new: true
      }
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned"
      });
    }

    for (const shop of order.shop) {
      const admin = await admin_model.findById(shop.admin);

      if (admin) {
        const platformcommision = shop.subtotal * 0.20;

        admin.platformcommision += platformcommision;
        admin.amount += shop.subtotal;
        await admin.save();
      }
    }

    res.json({
      success: true,
      message: "Order pickedup",
      order
    });


  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
};

export const DeliverygetpickedupOrders = async (req, res) => {
  try {

    const id = req.deliveryBoy.id
    console.log(id)
    const admin = await deliveryBoy_model.findById(id)

    const orders = await order_model
      .find({
        status: "pickedup",
        deliveryBoy: id
      })
      .populate("userId", "name")
      .populate("address")
      .populate("shop.items.productId", "name variantname ")
      .populate("shop.items.productId.variants", "name price");

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
};

export const DeliveryComplete = async (req, res) => {
  try {
    const id = req.deliveryBoy.id

    console.log(id, req.body)
    const admin = await deliveryBoy_model.findById(id)

    if (admin.isAvailable === true) {
      return res.json({ success: false })
    }

    const { orderId } = req.params;

    const order = await order_model.findOneAndUpdate(
      {
        _id: orderId,
        deliveryBoy: id
      },
      {
        status: "delivered",
        paymentStatus: "paid"
      },
      {
        new: true
      }
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned"
      });
    }

    await deliveryBoy_model.findByIdAndUpdate(
      id,
      {
        isAvailable: true
      }
    );

    res.json({
      success: true,
      message: "Order delivered",
      order
    });


  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
};



