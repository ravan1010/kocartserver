import adminmodel from '../model/admin_model.js';
import adminotpmodel from '../model/admin_otp.js';
import otpGenerate from "otp-generator";
import jwt from 'jsonwebtoken'
import nodemailer from "nodemailer";
import post from '../model/event_post_model.js';
import user from '../model/user_model.js';
import order from '../model/order_model.js'
import dotenv from 'dotenv'
import post_model from '../model/event_post_model.js';

dotenv.config()


const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    starttls: {
        enable: true
    },
    secureConnection: true,
    auth: {
      user: process.env.emailid,
      pass: process.env.emailpass
    }
  });

export const ownersignup = async (req, res, next) => {

    const {number} = req.body;
    try { 

      // if(){
      //   return res.status(404).json('invalid name')
      // }
      
    const otp = otpGenerate.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false })

    const otpnumber = await adminotpmodel.create({ otp: otp})
    await otpnumber.save()

    const mailOptions = {
      from: process.env.emailid,
      to: process.env.Tomail,
      subject: "Evo10 OTP Confirmation",
      text: `Your Evo10 OTP is here ${otp} to this number ${number} verify it` ,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });


          res.status(201).json({message: "otp sent"})
        
    } catch(error) {
      res.status(401).json({error:error.message})
    }

}

export const ownersignupOTPverify = async (req, res, next) => { 
          const {otp} = req.body

          const findotp = await adminotpmodel.findOne({ otp })

          try {
          if(!findotp){return res.json({message:'no'})}

          const adminNumber = 'foundersuhascofoundersuhas'
          const token = jwt.sign({ adminNumber , iat: Math.floor(Date.now() / 1000) - 30 }
                 ,process.env.ADMINJWTOTPKEY , { expiresIn: '400d' });

          res.cookie('owner', token, {
              httpOnly: true,
              secure: true, // true in production
              sameSite: 'none',
              maxAge: 400 * 24 * 60 * 60 * 1000
            })
            return res.json({message: 'verified'})
          } catch (error) {
            console.log(error)
            res.status(400).json(error)
          }

       

}  

//post get, add, remove, home

export const getpostdata = async (req, res, next) => {
  
  const postdata = await post.find()
  res.json(postdata);

}

export const postTohomepage = async (req, res) => {

  try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await post.findById(id);  // ✅ use model here
    if (!postDoc) {
      return res.json({ message: "product not found" });
    }

    postDoc.status = "home" // ✅ update array
    await postDoc.save();

    res.json({ message: "product add to home page" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
};

export const removepostinhomepage = async (req, res) => {

  try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await post.findById(id);  // ✅ use model here
    if (!postDoc) {
      return res.json({ message: "product not found" });
    }

    postDoc.status = "normal" // ✅ update array
    await postDoc.save();

    res.json({ message: "product remove in home page" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

//home page posts

export const gethomepostdata = async (req, res, next) => {
  
  const homepostdata = await post.find({status: 'home'})
  res.json(homepostdata);

}

//order status

export const getorderdata = async (req, res, next) => {
  
const orderdata = await order.find()
  .sort({ createdAt: -1 }) // newest first
  .populate([
    {
      path: "items.productId",   // populate product inside items
    },
    {
      path: "address",           // populate address field
    }
  ]);
  res.json(orderdata);

} 

export const orderpending = async(req, res) => {
  const orderpend = await order.find({status: 'Pending'})
    .populate([
      {
        path: "items.productId",   // populate product inside items
      },
      {
        path: "address",           // populate address field
      }
    ]);
  res.json(orderpend)
}

export const orderProcess = async(req, res) => {
   try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await order.findById(id);  // ✅ use model here

    if (!postDoc) {
      return res.json({ message: "product not found" });
    }



    postDoc.status = "Process" // ✅ update array
    await postDoc.save();

    res.json({ message: "order on Process" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

export const ordercancel = async(req, res) => {
   try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await order.findById(id);  // ✅ use model here
    if (!postDoc) {
      return res.json({ message: "product not found" });
    }

    postDoc.status = "cancel" // ✅ update array
    await postDoc.save();

    res.json({ message: "order cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

export const afterorderprocess = async(req, res) => {
  const orderPro = await order.find({status: 'Process'})
    .populate([
      {
        path: "items.productId",   // populate product inside items
      },
      {
        path: "address",           // populate address field
      }
    ]);
  res.json(orderPro)
}

export const Tocomplete = async(req, res) =>{
  try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await order.findById(id);  // ✅ use model here

    if (!postDoc) {
      return res.json({ message: "product not found" });
    }



    postDoc.status = "complete" // ✅ update array
    await postDoc.save();

    res.json({ message: "order complete" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

export const getordercancel = async(req, res) => {
  const ordercan = await order.find({status: 'cancel'})
    .sort({ createdAt: -1 }) // newest first
    .populate([
      {
        path: "items.productId",   // populate product inside items
      },
      {
        path: "address",           // populate address field
      }
    ]);
  res.json(ordercan)
}

export const ordercomplete = async(req, res) => {
  const ordercom = await order.find({status: 'complete'})
    .sort({ createdAt: -1 }) // newest first
    .populate([
      {
        path: "items.productId",   // populate product inside items
      },
      {
        path: "address",           // populate address field
      }
    ]);
  res.json(ordercom)
}

export const getuserdata = async (req, res, next) => {
  
  const userdata = await user.find()
  res.json(userdata);

}


export const postActive = async(req, res) => {
     try {
    const { productId, active } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    const product = await post_model.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.active = !product.active;
    await product.save();

    return res.status(200).json({
      message: "Product status updated",
      active: product.active,
    });

  } catch (error) {
    console.error("Toggle active error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};