import crypto from "crypto";
import Order from "../model/order_model.js";
import Product from "../model/event_post_model.js";
import { razorpay } from "../utils/razorpay.js";
import user_model from "../model/user_model.js";
import cart_model from "../model/cart_model.js";

export const checkout = async (req, res) => {
  try {
    const { totalAmount } = req.body;

    // const userId = await user_model.findOne({number: number

    console.log(totalAmount)

    const razorOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });


    res.status(200).json({
      razorOrderId: razorOrder.id,
      totalAmount,
      
    });

    
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Checkout failed" });
  }
};



export const verifyPayment = async (req, res) => {
  try {
    const { response, items, addressId, delivery, Number, totalAmount } = req.body;
    let platform = 21;

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
    
    
    const shop = 
      { admin: items[0].adminid, // ensure this exists OR derive from product
        items: items,
      }
    ;


    const order = await Order.create({
      userId,
      shop,
      address: addressId,
      number: Number,
      totalAmount,
      delivery: delivery,
      platformFee: platform,
      status: "pending",
    });


    await cart_model.findOneAndDelete({ userId });

    // 🔔 Notify admin/merchant
    // req.io.to(order.items[0].adminid.toString()).emit("new-order", {
    //   orderId: order._id,
    //   totalAmount: order.totalAmount,
    // });

    res.status(201).json({ message: "Order placed", order, success: true });
  } catch (err) {
    res.status(500).json({ message: "Payment verification failed" });
    console.log(err)
  }
};
