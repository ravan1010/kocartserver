import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()


export const signat = async (req, res, next) => {
    const token = req.cookies.at
     
    if(!token){
        return res.status(400).json({message : "cookie not in broswer"})
    }
    try {
        const decoded = jwt.verify(token, process.env.JWTOTPKEY)
        req.Atoken = decoded
        next()
        
        
    } catch (error) {
        res.status(400).json("soming wrong")
    }
}

export const deliveryBoyAuth = async (req, res, next) => {
    const token = req.cookies?.deliveryBoy;

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.deliveryBoy = user;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  }

export const authLocation = (req, res, next) => {
  const token = req.cookies.ln

   if(!token){
        return res.status(400).json({message : "cookie not in broswer"})
    }
    try {
        const decoded = jwt.verify(token, process.env.JWTOTPKEY)
        req.location = decoded
        next()
        
    } catch (error) {
        res.status(400).json({message:"soming wrong"})
    }
};

export const adu = async (req, res, next) => {
    if(req.user === true && req.user.role === "admin"){
        res.status(201).json({message:"admin"})
        next()
    }
}

//app auth

export const appAuth = (req, res, next) => {
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

