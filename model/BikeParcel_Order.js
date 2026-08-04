import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
    orderId: {
        type: String,
        unique: true
    },

    // Customer
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    // Driver
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParcelANDTransport",
        default: null
    },

    distance : Number,
    amount: Number,

    // Service
    serviceType: {
        type: String,
        enum: [
            "bike_parcel",
            "goods_auto",
            "auto_passenger"
        ],
        required: true
    },

    //---------------------------------------
    // Pickup
    //---------------------------------------

    pickup: {
        address: String,

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true
            }
        },

        name: String,
        phone: String
    },

    //---------------------------------------
    // Drop
    //---------------------------------------

    drop: {
        address: String,

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number]
            }
        },

        name: String,
        phone: String
    },

    //---------------------------------------
    // Bike Parcel
    //---------------------------------------

    parcel: {
        itemName: String,
        category: String,

        weight: Number,

        quantity: {
            type: Number,
            default: 1
        },

        fragile: {
            type: Boolean,
            default: false
        },

        instructions: String
    },

    //---------------------------------------
    // Goods Auto
    //---------------------------------------

    goods: {
        itemType: String,

        estimatedWeight: Number,

        helpersRequired: {
            type: Number,
            default: 0
        },

        loadingRequired: Boolean,

        unloadingRequired: Boolean,

        instructions: String
    },

    //---------------------------------------
    // Passenger Auto
    //---------------------------------------

    passenger: {
        name: String,
        phone: String,
        passengers: Number,

    },

    //---------------------------------------
    // Fare
    //---------------------------------------

    pricing: {
        distance: Number,
        duration: Number,

        baseFare: Number,

        surge: {
            type: Number,
            default: 0
        },

        platformFee: {
            type: Number,
            default: 0
        },

        totalFare: Number
    },

    //---------------------------------------
    // Payment
    //---------------------------------------

    payment: {
        method: {
            type: String,
            enum: [
                "cash",
                "online"
            ],
            default : "cash"
        },

        transactionId: String
    },

    //---------------------------------------
    // OTP
    //---------------------------------------

    otp: {
        pickup: Number,
        delivery: Number
    },

    //---------------------------------------
    // Order Status
    //---------------------------------------

    status: {
        type: String,
        enum: [
            "pending",
            "driver_assigned",
            "driver_arrived",
            "picked_up",
            "in_transit",
            "completed",
            "cancelled"
        ],
        default: "pending"
    },

    cancelReason: String,

    cancelledBy: {
        type: String,
        enum: [
            "customer",
            "driver",
        ]
    }

},
{
    timestamps: true
});

orderSchema.index({
    "pickup.location": "2dsphere"
});

orderSchema.index({
    "drop.location": "2dsphere"
});

export default mongoose.model("parcelSchema", orderSchema);