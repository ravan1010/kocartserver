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
    city:{
        type: String,
        require: true,
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


 UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
})

//user password compare 
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



export default new mongoose.model("user", UserSchema);

