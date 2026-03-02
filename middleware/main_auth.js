import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()

export const maintoken = async (req, res, next) => {
    const token = req.cookies.main
    
    if(!token){
        return res.status(400).json({message : "cookie not in broswer"})
    }

    try {

        const decoded = jwt.verify(token, process.env.ADMINJWTOTPKEY)
        req.main = decoded
        next()
        

    } catch (error) {
        res.status(400).json("soming wrong")
    }
}

