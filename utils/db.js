import mongoose from 'mongoose'
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.MONGODB_URL ;

const dbconnection = async () => {

mongoose.connect(URL)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

 
}              
 
export default dbconnection;
