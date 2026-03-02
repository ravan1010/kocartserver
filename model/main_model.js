import mongoose from 'mongoose';

const mainSchema =  mongoose.Schema({
    number:{
        type: Number,
        require: true,
        },
    open:{
        type: Boolean,
        default: false,
        index: true,
    },
},{timestamps : true})

mainSchema.index({ location: "2dsphere" });


export default new mongoose.model("main", mainSchema);

