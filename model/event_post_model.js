import mongoose from 'mongoose';
// const image_model = require('./image_model');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  finalprice: { type: Number },
});

const productSchema = new mongoose.Schema({

    author : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    name:{
        type:String,
        default:"event",
    },
    category: {
        type: String,
    },
    description:{
        type:String,
    },
    cityTown:{
        type:String,
    },
    Landmark:{
        type:String,
    },
    status:{
        type: String,
        require: true,
        enum: ['normal','home','ads'],
        default:"normal",
    },
    active:{
        type: Boolean,
        default: false,
        index: true,
    },
    image:[String],
    open:{
        type: Boolean,
        default: false,
        index: true,
    },
    variantname:String,
    variants: [variantSchema],
    companyName:{
        type: String,
    },
    rate:{
        type:Number,
    },

},{timestamps: true})


export default new mongoose.model("Product", productSchema);

