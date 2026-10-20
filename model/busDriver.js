import mongoose from "mongoose";

const BusDriverSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    avatar: String,

    driverName: {
      type: String,
      trim: true,
      default: "",
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    driverId: {
      type: String,
      trim: true,
      default: "",
    },

    busNumber: {
      type: String,
      trim: true,
      default: "",
    },       
    
    activate: {
        type: Boolean,
        default: false
    },
      isApproved: {
      type: Boolean,
      default: false,
    },
    city: {
        from: String,
        to: String
    },
    fcmToken: String,

    isOnline: {
        type: Boolean,
        default: false
    },

   currentLocation: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    default: [0, 0],
  },
},

locationAccuracy: Number,
locationHeading: Number,
locationSpeed: Number,
locationUpdatedAt: Date,

     rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        count: {
            type: Number,
            default: 0,
            min: 0,
        },
},

});

BusDriverSchema.index({ Location: "2dsphere" });

export default new mongoose.model("BusDriver", BusDriverSchema );