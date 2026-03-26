// models/Parcel.js
import e from "express";
import mongoose from "mongoose";

const parcelSchema = new mongoose.Schema({

  userID: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

  fromCity: String,
  fromlat: Number,
  fromlon: Number,

  toCity: String,
  tolat: Number,
  tolon: Number,

  pickupName: String,
  pickupPhone: String,
  pickupAddress: String,
  pickupLat: Number,
  pickupLng: Number,

  receiverName: String,
  receiverPhone: String,
  receiverAddress: String,
  receiverLat: Number,
  receiverLng: Number,

  price: Number,
  paymentId: String,
  paymentType: String,
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "pickedup", "delivered"],
    default: "pending"
  }
});

export default mongoose.model("Parcel", parcelSchema);