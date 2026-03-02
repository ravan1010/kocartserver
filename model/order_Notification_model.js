// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    title: String,
    message: String,
    total: Number,
    isRead: {
      type: Boolean,
      default: false,
    },
    sentVia: {
      type: String,
      enum: ["socket", "fcm"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
