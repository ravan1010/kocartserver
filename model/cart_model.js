// models/Cart.js
import mongoose from 'mongoose';


const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1 },
  variantid: {type: mongoose.Schema.Types.ObjectId},
  name: String,          // product snapshot
  variantName: String,   // variant snapshot
  price: Number,
});

const shopId = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
  items : [ cartItemSchema ],
  subtotal : Number

},{timestamps: true})



const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shop: [shopId],
  total: Number,

});

export default new mongoose.model("Cart", cartSchema);
