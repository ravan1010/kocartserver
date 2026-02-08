import usermodel from '../model/user_model.js';
import axios from "axios";
import otpmodel from '../model/otp_model.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import express from 'express';
import addressmodel from '../model/address_model.js';
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import path from 'path';
import otpGenerate from "otp-generator";


dotenv.config();

export const signup = async (req, res) => {
  try {
    const { number, city } = req.body;

    if (!number || !city) {
      return res.json({ success: false })
    }
    console.log(number, city)
    const user = await usermodel.create({ number, city })
    console.log(user._id)
    const id = user._id

    const token = jwt.sign(
      { id, iat: Math.floor(Date.now() / 1000) - 30 },
      process.env.ADMINJWTOTPKEY,
      { expiresIn: "100d" }
    );

    res.cookie("at", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 100 * 24 * 60 * 60 * 1000
    });
    return res.json({ success: true })

  } catch (error) {
    res.json(error)
  }
}

// export const signup = async (req, res) => {
//   try {
//     const { number } = req.body;

//     // ✅ check existing user
//     const exist = await usermodel.findOne({ number });
//     if (exist) {
//       return res.json({ success: false, message: "user already exist" });
//     }

//     // 🔐 generate OTP
//     const otp = otpGenerate.generate(6, {
//       upperCaseAlphabets: false,
//       lowerCaseAlphabets: false,
//       specialChars: false,
//     });

//     // 💾 save OTP
//     await otpmodel.create({ otp, number });

//     // 📲 Send OTP via Fast2SMS
//     await axios.post(
//       "https://www.fast2sms.com/dev/bulkV2",
//       {
//         route: "otp",
//         variables_values: otp,
//         numbers: number,
//       },
//       {
//         headers: {
//           authorization: process.env.FAST2SMS_API_KEY,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // 🔑 JWT OTP token
//     const token = jwt.sign(
//       { number },
//       process.env.ADMINJWTOTPKEY,
//       { expiresIn: "8m" }
//     );

//     // 🍪 cookie
//     res
//       .cookie("amogu", token, {
//         httpOnly: true,
//         secure: true, // HTTPS only
//         sameSite: "none",
//         maxAge: 8 * 60 * 1000,
//       })
//       .status(201)
//       .json({ success: true, message: "OTP sent successfully" });

//   } catch (error) {
//     console.error("Signup error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const signupOTPverify = async (req, res, next) => { 

  const number = req.admingu;

  try {

    const { otp } = req.body;
    const findotp = await otpmodel.findOne({ otp, number });

    if (!findotp) {
      return res.status(401).json({ message: "invalid otp" });
    }

    // clear old cookie
    res.clearCookie("amogu", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

      // new admin
      const token = jwt.sign(
        { number, iat: Math.floor(Date.now() / 1000) - 30 },
        process.env.ADMINJWTOTPKEY,
        { expiresIn: "100d" }
      );

      res.cookie("at", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 100 * 24 * 60 * 60 * 1000
      });

      await findotp.deleteOne({ otp });
      return res.status(201).json({ message: "otp verified", success: true});
    
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: error.message || "Server error" });
  }
};


export const Address = async (req, res, next) => {
        
    const id = req.Atoken.id
    const { Fullname, FHBCA, ASSV, Landmark, pincode, cityTown, state} = req.body
    const user = await usermodel.findOne({_id: id})
    try {
        if(!id){
        return res.status(401).json({message:`you don't have access key`})
    }

    console.log( Fullname, mobileNo, FHBCA, ASSV, Landmark, pincode, cityTown, state)

    const address = await addressmodel.create({authorID:user._id, Fullname, mobileNo, FHBCA, ASSV, Landmark, pincode, cityTown, state})
    await address.save()

    if(address){
        user.addressID.push(address._id)
        await user.save()
        console.log(address._id,"done")
    }
    res.status(200).json({message: 'ok'})
        
    } catch (error) {
        res.json(error)
    }
} 

// const deleteaddress = async()

export const login = async (req, res, next) => {
    try {
      if(!req.body.number || !req.body.password){
        return res.json({message: "fill all form"})
    }    
            const number = req.body.number;
            const password = req.body.password;

                const user = await usermodel.findOne({ number });
                if (!user) return res.json({ message: 'Invalid ' });

                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                  return res.json({ message: "Invalid " });
                }
                // Compare password
               
                const token = jwt.sign({ number , iat: Math.floor(Date.now() / 1000) - 30 }
                        ,process.env.JWTOTPKEY , { expiresIn: '500d' });

                   res.cookie("at", token, {
                            httpOnly: true,
                            secure: true,         // true in production with HTTPS
                            sameSite: 'none',
                            maxAge: 500 * 24 * 60 * 60 * 1000
                          })

                          console.log(token)
                          
                          res.status(201).json({ 
                            message: 'Logged in successfully',
                            user: user._id,
                            token: token
                          });
    
    } catch (error) {
        res.json({message:error})
    }
}

export const logout = async (req, res) => {
  try {
    res.clearCookie("at", {
      httpOnly: true,
      secure: true,   // true if HTTPS
      sameSite: "None", // must match how it was set
    });

    res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};




                
