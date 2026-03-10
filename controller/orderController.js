import crypto from "crypto";
import Order from "../model/order_model.js";
import Product from "../model/event_post_model.js";
import { razorpay } from "../utils/razorpay.js";
import user_model from "../model/user_model.js";
import cart_model from "../model/cart_model.js";
import { sendPushNotification } from "../utils/firebase.js";
import branch_model from "../model/branch_model.js";

export const checkout = async (req, res) => {
  try {
    const { total } = req.body;

    // const userId = await user_model.findOne({number: number

    console.log(Math.round(total * 100))

    const totalAmount = Math.round(total * 100)



    const razorOrder = await razorpay.orders.create({
      amount: totalAmount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });


    res.status(200).json({
      razorOrderId: razorOrder.id,
      totalAmount,
      razorpayKey: process.env.RAZORPAY_KEY_ID,

    });


  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Checkout failed" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { response, items, addressId, delivery, Number, totalAmount } = req.body;
    let platform = 11;

    const id = req.Atoken.id;
    const user = await user_model.findById(id)

    const userId = user._id

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        response.razorpay_order_id + "|" + response.razorpay_payment_id
      )
      .digest("hex");

    if (sign !== response.razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment" });
    }

    const shop = items?.shop

    const order = await Order.create({
      userId,
      shop,
      address: addressId,
      number: Number,
      location: user.location,
      totalAmount,
      delivery: delivery,
      platformFee: platform,
      status: "pending",
    });

    await order.populate("shop.admin");

    order.shop.forEach(id => {
      const fcmToken = id.admin?.fcmToken;

      console.log("FCM Token:", fcmToken);
      const title = 'You got a new order!';
      const body = `Order ID: ${order._id} - Total: ₹${order.totalAmount} - Delivery: ${delivery}`;
      const url = `http://localhost:5173/admin/order`;

      sendPushNotification(fcmToken, title, body, url);

    });

// 2️⃣ Find nearby branches
const nearbyBranches = await branch_model.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: user.location.coordinates,
      },
      $maxDistance: 25000,
    },
  },
})

console.log("Nearby branches:", nearbyBranches[0].fcmToken);

// 3️⃣ Send notification to branches

  await sendPushNotification(
    nearbyBranches[0].fcmToken,
    "New Order Nearby!",
    `Order ID: `,
    "https://yourdomain.com/admin/order"
  );

    await cart_model.findOneAndDelete({ userId });

    res.status(201).json({ message: "Order placed", order, success: true });
  
  } catch (err) {
    res.status(500).json({ message: "Payment verification failed" });
    console.log(err)
  }
};
