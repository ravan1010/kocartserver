import mongoose from 'mongoose';

const adminotpSchema =  mongoose.Schema({

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

export default new mongoose.model("adminotp", adminotpSchema)