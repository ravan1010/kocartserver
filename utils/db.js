import mongoose from 'mongoose'
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.MONGODB_URL ;

const dbconnection = async () => {

mongoose.connect('mongodb://localhost:27017/food')
.then(() => console.log("✅ MongoDB connected")) 
.catch((err) => console.error("❌ MongoDB error:", err));

 
}              
 
export default dbconnection;
