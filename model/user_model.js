import mongoose from 'mongoose';
import bcrypt from "bcrypt";


const UserSchema =  mongoose.Schema({
   
    number:{
        type: String,
        require: true,
        },
    // name : {
    //     type: String,
    // },
    // email:{
    //     type: String,
    //     require: true,
    // },

    // password:{
    //     type: String,
    //     require: true,
    // },
    googleId: String,
    name: String,
    email: String,
    avatar: String,
    fcmToken: {
        type: String,
        default: null,
    },
    city:{
        type: String,
    },
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
    addressID:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'address',
    }],
    CorT:{
        type: String
    },

    review : {
        user_id : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        comment : {
            type: String,
            default: " ",
        },
        date : {
            type : Date,
            default : Date.now
        }
    },
    role:{
        type: String,
        enum: ['admin','user'],
        default:"user",
    },
    adminID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
   
    resetPasswordToken: String,
    resetPasswordExpareAt: Date,
    verificationToken: String,
    verificationTokenExpareAt: Date,

},{timestamps : true})

// UserSchema.pre()

UserSchema.index({ location: "2dsphere" });

export default new mongoose.model("user", UserSchema);

