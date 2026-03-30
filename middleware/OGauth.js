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
  try {

    const authHeader = req.headers.at;
    const authHeader2 = req.headers.authorization;
    const authHeader3 = req.headers.user_id;
    const authHeader4 = req.headers['user_id'];
    const authHeader5 = req.headers['authorization'];
    const authHeader6 = req.headers['at'];
    const authHeader7 = req.cookies;
    const authHeader8 = req.headers;

    console.log("Auth Headers:", {
      'at': authHeader,
      'authorization': authHeader2,
      'user_id': authHeader3,
      '[user_id]': authHeader4,
      '[authorization]': authHeader5,
      '[at]': authHeader6,
      'cookies': authHeader7,
      'allHeaders': authHeader8
    });

    if (!authHeader) {
      return res.json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        success: false,
        message: "Malformed token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWTOTPKEY);

    req.user = decoded;

    next();

  } catch (error) {

    console.log("Auth Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });

  }
};
