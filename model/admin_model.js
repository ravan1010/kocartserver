import mongoose from 'mongoose';
import bcrypt from "bcrypt";

const adminSchema =  mongoose.Schema({
    number:{
        type: Number,
        require: true,
        },

    companyName:{
        type:String,
        require:true,
    },

    posts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts',
    }],

    category: {
        type: String,
        require: true
    },
    image:[String],

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
    city:{
        type: String,
        require: true,
    },
    address:{
        FHBCA: {
            type: String,
            require: true,
            default:" ",
        },
        ASSV: {
            type: String,
            require: true,
            default: " ",
        },
        Landmark: {
            type: String,
            require: true,
            default: " ",
        },
        pincode: {
            type: Number,
            require: true,
            default: " ",
        },
        cityTown: {
            type: String,
            require: true,
            default: " ",
        },
        state:{
            type: String,
            require: true,
            default: " ",
        }
    },
        // eventBooking: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'User',
        // },
    // availableDays: [{ 
    //     type: String, 
    //     enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] 
    // }],
    open:{
        type: Boolean,
        default: false,
        index: true,
    },
    availableTime: {
        start: { type: String }, // e.g. "09:00"
        end: { type: String }    // e.g. "17:00"
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
     isAdmin : {
        type: Boolean,
        default: true,
    },
    adminresetPasswordToken: String,
    adminresetPasswordExpareAt: Date,
    adminverificationToken: String,
    adminverificationTokenExpareAt: Date,

},{timestamps : true})

adminSchema.index({ location: "2dsphere" });


// UserSchema.pre()

 adminSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
})

//user password compare 
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

//

export default new mongoose.model("admin", adminSchema);

