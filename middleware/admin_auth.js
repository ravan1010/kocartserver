import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()



export const admintoa = async (req, res, next) => {
    const token = req.cookies.toa
    
    if(!token){
        return res.json({msg : "cookie not in broswer"})
    }
    try {
        const decoded = jwt.verify(token, process.env.ADMINJWTOTPKEY)
        req.admintoa = decoded
        next()
    
        
    } catch (error) {
        res.json("soming wrong")
    }
}

//admin categorys
export const appadminAuth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      message: "No token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.Atoken = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};



