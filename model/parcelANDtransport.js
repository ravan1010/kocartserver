import mongoose from "mongoose";

const ParceldeliveryANDtransportPartnerSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    avatar: String,
    Number: {
        type: Number,
    },
    vehicalNO: String,        
    vehicalName: String,
    
    serviceType: {
        type: String,
        enum: [
            "bike_parcel",
            "goods_auto",
            "auto_passenger",
        ],
        default: "bike_parcel"
    },
    activate: {
        type: Boolean,
        default: false
    },
    kocartAmount: {
        type: Number,
        default: 0
    },
    settlementAmount: {
        type: Number,
        default: 0
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

ParceldeliveryANDtransportPartnerSchema.index({ currentLocation: "2dsphere" });

// deliveryBoySchema.index({
//   currentLocation: "2dsphere"
// });

export default new mongoose.model("ParcelANDTransport", ParceldeliveryANDtransportPartnerSchema);