import mongoose from 'mongoose';

const UserAddress =  mongoose.Schema({
   
    authorID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true,
        },
    
        Fullname:{
            type: String,
            require: true,
            default: " ",
        },
        mobileNo :{
            type: String,
            require: true,
            default: " ",
        },
        //FHBCA means F-Flat, H-house.no, B-building, A-Apartment
        FHBCA: { 
            type: String,
            require: true,
            default:" ",
        },
        //ASSV means A-area, S-street, S-sector, V-village
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
    ,

},{timestamps : true})

export default new mongoose.model("address", UserAddress);

