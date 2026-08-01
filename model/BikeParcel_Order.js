// models/Parcel.js
import mongoose from "mongoose";

const bike_parcelSchema = new mongoose.Schema({

  customerID: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  driverID: { type: mongoose.Schema.Types.ObjectId, ref: "ParcelANDTransport", default: null},

  pickup: {
    address: String,
    latitude: Number,
    longitude: Number,
    contactName: String,
    contactPhone: String,
  },

  drop: {
    address: String,
    latitude: Number,
    longitude: Number,
    contactName: String,
    contactPhone: String,
  },

  parcel: {
    itemName: String,
    description: String,

    weight: Number, // kg

    length: Number,
    width: Number,
    height: Number,

    quantity: {
      type: Number,
      default: 1,
    },

    fragile: {
      type: Boolean,
      default: false,
    },

    cashOnDelivery: {
      type: Boolean,
      default: false,
    },

    codAmount: {
      type: Number,
      default: 0,
    },
  },

  distance: {
    type: Number,
    default: 0,
  },

  estimatedTime: {
    type: Number,
    default: 0,
  },

  fare: {
    type: Number,
    required: true,
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "ONLINE"],
    default: "ONLINE",
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },

  otp: Number,

  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "arrived_pickup",
      "picked_up",
      "in_transit",
      "completed",
      "cancelled",
    ],
    default: "pending",
  },

  cancelReason: String,
 
});

export default mongoose.model("BIKEParcel", bike_parcelSchema);

