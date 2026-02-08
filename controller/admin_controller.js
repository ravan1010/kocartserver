import adminmodel from '../model/admin_model.js';
import adminotpmodel from '../model/admin_otp.js';
import post_model from '../model/event_post_model.js';
import bookmodel from '../model/cart_model.js';
import otpGenerate from 'otp-generator';
import jwt from 'jsonwebtoken';
import usermodel from '../model/user_model.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'
import order_model from '../model/order_model.js';


dotenv.config();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  starttls: {
    enable: true
  },
  secureConnection: true,
  auth: {
    user: 'ravanravana177@gmail.com',
    pass: 'mgcz zlxp iviv uaec'
  }
});

export const adminsignup = async (req, res, next) => {

  try {

    const { number } = req.body;
    const exist = await adminmodel.findOne({ number: number })

    const otp = otpGenerate.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false })

    const otpnumber = await adminotpmodel.create({ otp: otp })
    await otpnumber.save()

    const mailOptions = {
      from: 'ravanravana177@gmail.com',
      to: 'suhasnayaj@gmail.com' ,
      subject: "Food OTP Confirmation",
      html: `<h4>Your Food del OTP <h4> 
              <h1><strong>${otp} </strong></h1>
              <h4> verify </h4>
              <p>partner number = ${number} </p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    const adminNumber = number
    const token = jwt.sign({ adminNumber, iat: Math.floor(Date.now() / 1000) - 30 }
      , process.env.ADMINJWTOTPKEY, { expiresIn: '8m' });


    res.cookie("amogu", token, {
      httpOnly: true,
      secure: true,         // true in production with HTTPS
      sameSite: 'none',
      maxAge: 8 * 60 * 1000
    }).status(201).json({ success: true, message: "otp sent" })

  } catch (error) {
    res.status(401).json({ error: error.message })
  }

}

export const adminsignupOTPverify = async (req, res, next) => {
  const number = req.admingu;
  console.log(number);

  try {
    const numExistinAdmin = await adminmodel.findOne({ number: number.adminNumber });
    console.log(numExistinAdmin);

    const { otp } = req.body;
    const findotp = await adminotpmodel.findOne({ otp });
    console.log(findotp);

    if (!findotp) {
      return res.status(401).json({ message: "invalid otp" });
    }

    // clear old cookie
    res.clearCookie("amogu", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    if (numExistinAdmin) {
      // admin already exists
      const token = jwt.sign(
        { adminNumber: number.adminNumber, iat: Math.floor(Date.now() / 1000) - 30 },
        process.env.ADMINJWTOTPKEY,
        { expiresIn: "40d" }
      );

      res.cookie("toa", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 1000 * 1000,
      });

      await findotp.deleteOne({ otp });
      return res.status(201).json({ message: "main", category: numExistinAdmin.category });
    } else {
      // new admin
      const token = jwt.sign(
        { adminNumber: number.adminNumber, iat: Math.floor(Date.now() / 1000) - 30 },
        process.env.ADMINJWTOTPKEY,
        { expiresIn: "5m" }
      );

      res.cookie("amif", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 5 * 60 * 1000,
      });

      await findotp.deleteOne({ otp });
      return res.status(201).json({ message: "otp verified", success: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: error.message || "Server error" });
  }
};

export const admininfo = async (req, res, next) => {


  try {
    const number = req.adminif.adminNumber
    const { companyName,
      category,
      FHBCA,
      ASSV,
      Landmark,
      pincode,
      cityTown,
      state,
      latitude,
      longitude,
      city
    } = req.body;

    console.log(latitude, longitude)
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required"
      });
    }
    console.log('near')
    const admininfo = await adminmodel.create({
      number: number,
      companyName: companyName,
      category: category,
      city: city,
      address: {
        FHBCA: FHBCA,
        ASSV: ASSV,
        Landmark: Landmark,
        pincode: pincode,
        cityTown: cityTown,
        state: state,
      },
      location: {
        type: "Point",
        coordinates: [
          parseFloat(longitude), // ✅ lng first
          parseFloat(latitude),  // ✅ lat second
        ]
      }
    })

    console.log(admininfo)

    res.clearCookie("amif", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    const adminNumber = number
    const token = jwt.sign({ adminNumber, iat: Math.floor(Date.now() / 1000) - 30 }
      , process.env.ADMINJWTOTPKEY, { expiresIn: '40d' });

    res.cookie('toa', token, {
      httpOnly: true,
      secure: true, // true in production
      sameSite: 'none',
      maxAge: 60 * 60 * 1000 * 1000
    });

    return res.status(201).json({ message: "ok", success: true })

  } catch (error) {
    res.json(error)
  }

}

export const Adminid = async (req, res) => {

  const id = req.admintoa.adminNumber
  const author = await adminmodel.findOne({ number: id })

  res.json({ id: author._id })
}

export const setdaytime = async (req, res) => {
  try {
    const { availableDays, availableTime } = req.body;

    const updatedAdmin = await adminmodel.findByIdAndUpdate(
      req.params.id,
      { availableDays, availableTime },
      { new: true }
    );

    res.json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getdaytime = async (req, res) => {
  try {
    const admin = await adminmodel.findById(req.params.id).select("availableDays availableTime");
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const availabletopost = async (req, res) => {
  try {
    const admin = await adminmodel.findById(req.params.id).select("availableDays availableTime");
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



//posts
export const EVENTCreate = async (req, res, next) => {

  try {

    const number = req.admintoa.adminNumber
    const adminuser = await adminmodel.findOne({ number })

    console.log('Eventcategory')
    const { name,
      description,
      image,
      variants,
      variantname
    } = req.body

    const cityTown = adminuser.city
    const companyName = adminuser.companyName

    console.log(cityTown)

    if (!image) {
      return res.status(404).json({ message: "select images" })
    }


    const postData = await post_model.create({
      author: adminuser._id,
      name: name,
      description: description,
      image: image,
      category: adminuser.category,
      cityTown: cityTown,
      companyName: companyName,
      variantname: variantname,
      variants: variants,
      open: adminuser.open
    })
    await postData.save()

    if (postData) {
      adminuser.posts.push(postData._id);
      await adminuser.save();
    }

    res.status(201).json({ message: `post created`, id: `${postData._id}`, success: true })

  } catch (error) {
    res.json(error)
  }

}



export const dashboard = async (req, res, next) => {
  try {
    const id = req.admintoa.adminNumber
    const author = await adminmodel.findOne({ number: id })
    const post = await post_model.find({ author: author._id })
    res.status(201).json({
      post: post,
      productlist: post.length,
      openORclose: author.open
    })

  } catch (error) {
    res.json(error)
  }
}

export const EVENTDelete = async (req, res, next) => {

  const number = req.admintoa.adminNumber
  const adminuser = await adminmodel.findOne({ number })
  const id = req.params.id
  try {
    const product = await post_model.findById(id);
    console.log(product)
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    if (adminuser) {
      adminuser.posts.pull(id);
      await adminuser.save();
    }

    const deletedProduct = await post_model.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message })
  }

}

///getallAdminpost for dashboard

export const getallAdminpost = async (req, res, next) => {
  console.log("suhas")

  try {
    const id = req.admintoa.adminNumber

    const author = await adminmodel.findOne({ number: id })

    const post = await post_model.find({ author: author._id })
    res.json(post)

  } catch (error) {
    res.json({ error: error.message })
  }
}

export const Toadmin = async (req, res, next) => {


  try {
    const number = req.admintoa.adminNumber
    const admin = await adminmodel.findOne({ number: number })

    if (!admin) {
      return res.json({ success: false })
    }

    res.json({ success: true })


  } catch (error) {
    res.json(error)
  }
}

export const bookedlisttoadmin = async (req, res) => {
  const number = req.admintoa.adminNumber

  try {

    const admin = await adminmodel.findOne({ number: number })
    const adminpost = admin.posts

    const bookedlist = await order_model.find({ items: adminpost })
    const postlist = await post_model.find({ _id: adminpost })

    res.json({ bookedlist: bookedlist, postlist: postlist })

  } catch (error) {
    res.json(error)
  }
}

export const openORclose = async (req, res) => {
  try {
    const number = req.admintoa.adminNumber
    console.log(number, req.body)
    const admin = await adminmodel.findOne({ number: number })
    // const post = await post_model.findOne({ author: admin._id })

    admin.open = !admin.open;
    await admin.save();
    console.log(admin._id)

    if (admin.open === false) {

      await post_model.updateMany(
        { author: admin._id },
        { active: admin.open }
      );
    }

    res.json({ success: true })

  } catch (error) {
    res.json({ message: error })
  }
}

export const open = async (req, res) => {
  try {
    const { id } = req.params;
    const { open } = req.body;
    const number = req.admintoa.adminNumber


    const admin = await adminmodel.findOne({ number: number })
    // const post = await post_model.findOne({ author: admin._id })

    if (admin.open === false) {
      return res.status(400).json({message: 'store door off'})
    }

    const post = await post_model.findById(id);
    console.log(id, open, post)

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.active = open;
    await post.save();

    res.status(200).json({
      success: true,
      open: post.open,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const EVENTUpdate = async (req, res, next) => {
  try {
    const adminNumber = req.admintoa.adminNumber;
    const adminuser = await adminmodel.findOne({ number: adminNumber });
    console.log('update')

    if (!adminuser) {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    const { id } = req.params; // event/post id

    const {
      name,
      description,
      image,
      variants,
      variantname,
      open,
    } = req.body;

    // find post
    const post = await post_model.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // 🔐 ownership check
    if (post.author.toString() !== adminuser._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // 🧠 update only provided fields
    if (name !== undefined) post.name = name;
    if (description !== undefined) post.description = description;
    if (image !== undefined) post.image = image;
    if (variants !== undefined) post.variants = variants;
    if (variantname !== undefined) post.variantname = variantname;
    if (open !== undefined) post.open = open;

    // optional sync from admin profile
    post.cityTown = adminuser.city;
    post.companyName = adminuser.companyName;
    post.category = adminuser.category;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      id: post._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getSinglePost = async (req, res) => {
  try {
    const adminNumber = req.admintoa.adminNumber;

    const adminuser = await adminmodel.findOne({ number: adminNumber });
    if (!adminuser) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const { id } = req.params;

    const post = await post_model.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔐 Ensure admin owns this post
    if (post.author.toString() !== adminuser._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

