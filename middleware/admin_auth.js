import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()


export const admingu = async (req, res, next) => {
    const token = req.cookies.amogu
    
    if(!token){
        return res.json({msg : "cookie not in broswer"})
    }
    try {
        const decoded = jwt.verify(token, process.env.ADMINJWTOTPKEY)
        req.admingu = decoded
        next()
    
        
    } catch (error) {
        res.json("soming wrong")
    }
}

export const adminif = async (req, res, next) => {
    const token = req.cookies.amif
    
    if(!token){
        return res.json({msg : "cookie not in broswer"})
    }
    try {
        const decoded = jwt.verify(token, process.env.ADMINJWTOTPKEY)
        req.adminif = decoded
        next()
    
        
    } catch (error) {
        res.json("soming wrong")
    }
}

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
export const admincat = async (req, res, next) => {
    const token = req.cookies.cat

    if(!token){
        return res.json({msg : "cookie not in broswer"})
    }

    try {
        
        const decoded = jwt.verify(token, process.env.ADMINJWTOTPKEY)
        req.cat = decoded
        next()
    
        
    } catch (error) {
        res.json("soming wrong")
    }
    
}



