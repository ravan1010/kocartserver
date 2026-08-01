import mongoose from "mongoose";

const Parcel_delivery_AND_transport_PartnerSchema = new mongoose.Schema({
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
        required: true,
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

Parcel_delivery_AND_transport_PartnerSchema.index({ currentLocation: "2dsphere" });

// deliveryBoySchema.index({
//   currentLocation: "2dsphere"
// });

export default new mongoose.model("ParcelANDTransport", Parcel_delivery_AND_transport_PartnerSchema);