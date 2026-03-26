import mongoose from 'mongoose';

const RouteDBSchema =  mongoose.Schema({

    from:{
        type: String,
        require: true
    },
    fromlat: Number,
    fromlon: Number,

    to: String,
    tolat: Number,
    tolon: Number,
    
    amount: Number,
    time: Number,
    distance: Number,
})

export default new mongoose.model("route", RouteDBSchema)