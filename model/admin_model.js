
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new mongoose.Schema(
  {
    googleId: String,
    name: String,
    email: String,
    avatar: String,

    fcmToken: {
      type: String,
      default: null,
    },

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },

    resetPasswordToken: String,
    resetPasswordExpareAt: Date,
    verificationToken: String,
    verificationTokenExpareAt: Date,
  },
  { timestamps: true }
);

AdminSchema.index({ currentLocation: "2dsphere" });

const Admin =
  mongoose.models.admin ||
  mongoose.model("admin", AdminSchema);

export default Admin;
