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
  items : [orderItemSchema]

},{timestamps: true})
 
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shop: [shopId],
  number: { type: Number, required: true},
  address: { type: mongoose.Schema.Types.ObjectId, ref: "address", required: true },
  latitude: Number,
  longitude: Number,
  status:{
        type: String,
        enum: ['pending','cancel','','complete'],
        default:"pending",
    },
  platformFee: { type: Number, default: 20 },
  delivery: {type: Number, default: 30},
  totalAmount: { type: Number },
}, { timestamps: true });

export default new mongoose.model("Order", orderSchema);
