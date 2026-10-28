import mongoose from 'mongoose';
import bcrypt from "bcrypt";


const AdminSchema =  mongoose.Schema({
   
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
            type: [Number], // [longitude, latitude]
            default: [0, 0],
        },
    },
 
    lastLogin: {
        type: Date,
        default: Date.now
    },
   
    resetPasswordToken: String,
    resetPasswordExpareAt: Date,
    verificationToken: String,
    verificationTokenExpareAt: Date,

},{timestamps : true})

// AdminSchema.pre()

AdminSchema.index({ currentLocation: "2dsphere" });

export default new mongoose.model("admin", AdminSchema);

