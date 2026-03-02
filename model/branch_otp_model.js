import mongoose from 'mongoose';

const branchOTPschema =  mongoose.Schema({

    otp:{
        type: Number,
        require: true
    },
    number: {
        type: Number,
        require: true,
    },
    city: {
        type: String,
    },
    createdAt :{
        type: Date,
        default: Date.now,
        expires: 60
    }

})

export default new mongoose.model("branchotp", branchOTPschema)