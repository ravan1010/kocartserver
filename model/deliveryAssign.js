import mongoose from "mongoose";

const deliveryAssignSchema = new mongoose.Schema({
  
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: "DeliveryBoy",
        required: true
    },
    admin : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        required: true
    },
    adminOrderId : {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    BroadcastTo : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],

    status: {
        type: String,
        enum: ["broadcasted", "assigned", "expired"],
        default: 'broadcasted'
    },
},{timestamps: true})

export default new mongoose.model("DeliveryAssign", deliveryAssignSchema);