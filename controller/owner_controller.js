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
import branch_model from '../model/branch_model.js';
import branch_otp_model from '../model/branch_otp_model.js';
import user_model from '../model/user_model.js';
import order_model from '../model/order_model.js';

dotenv.config()


export const ownersignup = async (req, res, next) => {

    const {number} = req.body;
    try { 

      const branch = await branch_model.findOne({number: number})

      if(branch) return res.json({message: 'already exist'})
      
    const otp = otpGenerate.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false })

    const otpnumber = await branch_otp_model.create({ otp: otp, number: number})
    await otpnumber.save()


    res.status(201).json({message: "otp sent"})
        
    } catch(error) {
      res.status(401).json({error:error.message})
    }

}

export const ownersignupOTPverify = async (req, res, next) => { 
          const {otp} = req.body

          const findotp = await branch_otp_model.findOne({ otp })

          try {
          if(!findotp){return res.json({message:'no'})}

          const branch = await branch_model.create({number : findotp.number})

          await branch_otp_model.findByIdAndDelete(findotp._id);

          const id = branch._id
          const token = jwt.sign({ id , iat: Math.floor(Date.now() / 1000) - 30 }
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

export const branchFCMtoken = async (req, res) => {
  try {
    const id = req.owner.id
      const { fcmToken } = req.body;
      console.log(typeof fcmToken,'id :',id)

    if (!fcmToken) {
    return res.status(400).json({ success: false });
  }

  await branch_model.findByIdAndUpdate(id, {
    fcmToken,
  });

  } catch (error) {
    res.status(500).json(error)
  }
}

export const branchLocation = async (req, res) => {
  try {
      const id = req.owner.id
      const { city, latitude, longitude } = req.body;

      console.log(city, latitude)

    if (!id) {
    return res.status(400).json({ success: false });
  }

  const branch = await branch_model.findByIdAndUpdate(id, {
    city,
    location: {
        type: "Point",
        coordinates: [
          parseFloat(longitude), // ✅ lng first
          parseFloat(latitude),  // ✅ lat second
        ]
      }
  });

  res.status(200).json({success: true, branch})
  } catch (error) {
    res.json(error)
  }
}

//dashboard

export const Branch_dashboard = async (req, res, next) => {
  try {
    const id = req.owner.id
    const branch = await branch_model.findById(id)

    res.status(201).json({
      openORclose: branch.open,
    })

  } catch (error) {
    res.json(error)
  }
}

export const Branch_openORclose = async (req, res) => {
  try {
    const id = req.owner.id
    const branch = await branch_model.findById(id)
     if (!branch) {
    return res.status(404).json({ success: false, message: "Branch not found" });
  }
    console.log(branch)
    // const post = await post_model.findOne({ author: admin._id })

    branch.open = !branch.open;
    await branch.save();
    console.log(branch._id)
    
    res.json({ success: true })

  } catch (error) {
    res.json({ message: error })
  }
}


//otp to branch

export const otpTObranch = async (req, res) => {
  try {
    const id = req.owner.id;

    const branch = await branch_model.findById(id)
    if(!branch) return res.status(400).json({success: false})

const city = branch.city
    const branchOTP = await adminotpmodel.find({ city: city });


    console.log(branchOTP)

    res.json(branchOTP)
  } catch (error) {
    res.json(error)
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

      const id = req.owner.id
      console.log(id)
      const branch = await branch_model.findById(id)
      console.log(branch.location.coordinates)
      if(!branch) return res.status(400).json({success: false})

   const order = await order_model.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: branch.location.coordinates, // ✅ use branch's coordinates
          },
          $maxDistance: 25000, // 25km in meters
        },
      },
    }).populate("userId", "number location") // ✅ populate user details
      .populate("shop.admin", "number location companyName")
      .populate("shop.items.productId")
      .sort({ createdAt: -1 }) // newest first
      .exec();

    console.log(order)

  
  res.json(order);

} 

export const orderpending = async(req, res) => {

  try {
      const id = req.owner.id
      console.log(id)
      const branch = await branch_model.findById(id)
      if(!branch) return res.status(400).json({success: false})

        console.log("Finding pending orders near branch at coordinates:", branch.location.coordinates);

   const order = await order_model.find({
    status: 'pending',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: branch.location.coordinates, // ✅ use branch's coordinates
          },
          $maxDistance: 25000, // 25km in meters
        },
      },
    }).populate("userId", "number location") // ✅ populate user details
      .populate("shop.admin", "number location companyName")
      .populate("shop.items.productId")
      .sort({ createdAt: -1 }) // newest first

    console.log(order)

  
  res.json(order);
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
   
  }

export const orderProcess = async(req, res) => {
   try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await order_model.findById(id);  // ✅ use model here

    console.log("Found order document:", postDoc);

    if (!postDoc) {
      return res.json({ message: "product not found" });
    }

    postDoc.status = "process" // ✅ update array
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

  try {
      const id = req.owner.id
      console.log(id)
      const branch = await branch_model.findById(id)
      if(!branch) return res.status(400).json({success: false})

        console.log("Finding pending orders near branch at coordinates:", branch.location.coordinates);

   const order = await order_model.find({
    status: 'process',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: branch.location.coordinates, // ✅ use branch's coordinates
          },
          $maxDistance: 25000, // 25km in meters
        },
      },
    }).populate("userId", "number location") // ✅ populate user details
      .populate("shop.admin", "number location companyName")
      .populate("shop.items.productId")
      .sort({ createdAt: -1 }) // newest first

    console.log(order)

  
  res.json(order);
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

export const Tocomplete = async(req, res) =>{
  try {
    const { id } = req.body;
    console.log("post", id);

    const postDoc = await order_model.findById(id);  // ✅ use model here

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

  try {
      const id = req.owner.id
      console.log(id)
      const branch = await branch_model.findById(id)
      if(!branch) return res.status(400).json({success: false})

        console.log("Finding pending orders near branch at coordinates:", branch.location.coordinates);

   const order = await order_model.find({
    status: 'complete',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: branch.location.coordinates, // ✅ use branch's coordinates
          },
          $maxDistance: 25000, // 25km in meters
        },
      },
    }).populate("userId", "number location") // ✅ populate user details
      .populate("shop.admin", "number location companyName")
      .populate("shop.items.productId")
      .sort({ createdAt: -1 }) // newest first

    console.log(order)

  
  res.json(order);
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
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



