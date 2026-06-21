import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  avatar: String,
  Number: {
    type: Number,
  },
  activate: {
    type: Boolean,
    default: false
  },
  city: String,
  fcmToken: String,

  isOnline: {
    type: Boolean,
    default: false
  },

  isAvailable: {
    type: Boolean,
    default: true
  },

  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
});

deliveryBoySchema.index({
  currentLocation: "2dsphere"
});

export default new mongoose.model("DeliveryBoy", deliveryBoySchema);