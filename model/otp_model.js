import mongoose from 'mongoose';

const otpSchema =  mongoose.Schema({

    number:{
            type: Number,
            require: true
        },
    otp:{
        type: Number,
        require: true
    },
    createdAt :{
        type: Date,
        default: Date.now,
        expires: 60
    }

})

export default new mongoose.model("otp", otpSchema)