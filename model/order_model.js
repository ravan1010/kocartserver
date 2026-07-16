// models/Cart.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    variantid: {type: mongoose.Schema.Types.ObjectId},
    name: String,          // product snapshot
    variantName: String,   // variant snapshot
    price: Number,
}); 

const shopId = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
  items : [ orderItemSchema ],
  subtotal : Number,
},{timestamps: true})
 
const orderSchema = new mongoose.Schema({
   orderId: {
    type: String,
    unique: true,
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  shop: [shopId],
  number: { type: Number, required: true},
  address: { type: mongoose.Schema.Types.ObjectId, ref: "address", required: true },
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
  status:{
        type: String,
        enum: ['pending',
                'accepted',
                'assigned',
                'pickedup',
                'delivered',
                'cancelled'
        ],
        default:"pending",
    },
  platformFee: { type: Number, default: 6 },
  paymentMethod: { type: String, enum: ["COD", "Online"] },
  paymentStatus: { type: String, enum: ["pending", "paid"]},
  delivery: {type: Number, default: 30},
  totalAmount: { type: Number },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "DeliveryBoy",
    default: null
  }
}, { timestamps: true });

orderSchema.index({ location: "2dsphere" });


export default new mongoose.model("Order", orderSchema);
