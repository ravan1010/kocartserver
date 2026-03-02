import mongoose from 'mongoose';
import bcrypt from "bcrypt";

const branchSchema = mongoose.Schema({
    number: {
        type: Number,
        require: true,
    },

    companyName: {
        type: String,
        require: true,
    },
    fcmToken: {
        type: String,
        default: null,
    },
    location: {
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
    city: {
        type: String,
        require: true,
    },
    open: {
        type: Boolean,
        default: false,
        index: true,
    },
    amount: {
        type: Number,
        default: ''
    },
    availableTime: {
        start: { type: String }, // e.g. "09:00"
        end: { type: String }    // e.g. "17:00"
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isAdmin: {
        type: Boolean,
        default: true,
    },
    adminresetPasswordToken: String,
    adminresetPasswordExpareAt: Date,
    adminverificationToken: String,
    adminverificationTokenExpareAt: Date,

}, { timestamps: true })

branchSchema.index({ location: "2dsphere" });


// UserSchema.pre()

//

export default new mongoose.model("branch", branchSchema);

