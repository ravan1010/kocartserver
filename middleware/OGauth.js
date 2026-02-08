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
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.json({ message: "No token provided" });

        const token = authHeader.split(" ")[1]; // remove "Bearer"
        if (!token) return res.json({ message: "Malformed token" });

        const decoded = jwt.verify(token, process.env.JWTOTPKEY);
        req.Atoken = decoded;
        next();

    } catch (error) {
        res.status(400).json(error)
        console.log('erro',error)
    }
}
