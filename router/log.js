import passport from "passport";
import jwt from "jsonwebtoken"
import { Router } from "express";
const router = Router()
import dotenv from "dotenv"
import { OAuth2Client } from 'google-auth-library'
import admin_model from "../model/admin_model.js";
import user_model from "../model/user_model.js";
dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


//log request
router.get("/google/branch", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "branch",
  })(req, res, next);
});

router.post('/app/google/user', async (req, res) => {
  const { token } = req.body;
 
  console.log(token)

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // 1. Verify the Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 2. Search for the user in MongoDB
    let user = await user_model.findOne({ googleId });

    if (!user) {
      // 3. If user doesn't exist, create a new one
      console.log("New user detected, creating account...");
      user = await user_model.create({
        googleId,
        email,
        name,
        avatar: picture
      });
    } else {
      console.log("Existing user logged in.");
    }

    console.log(user._id)
    // 4. Send the Internal User ID back to the app
    // Note: 'user._id' is the MongoDB ObjectId
    res.json({ 
      success: true, 
      userId: user._id, 
      isNewUser: !user.createdAt 
    });


    
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid Google Token" });
  }
});

//call back 
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/register",
    session: false,
  }),
  async (req, res) => {
    const role = req.query.state;

    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "100d" }
    );

    if (role === "branch") {
      res.cookie("owner", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days
      });

      return res.redirect(
        "https://branch.kocart.online/branch-auth-success"
      );
    }

    if (role === "client") {
      res.cookie("at", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days
      });

      return res.redirect(
        "https://www.kocart.online/client-auth-success"
      );
  }

  if (role === "marchent") { 

    res.cookie("amogu", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days
    });

    return res.redirect(
      "https://www.kocart.online/marchent-auth-success"
    );
  }

  if (role === "deliveryBoy") {
    res.cookie("deliveryBoy", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days
    });
    return res.redirect(
      "https://delivery.kocart.online/deliveryBoy-auth-success"
    );
  }
 }
);

// step 3: save town branch cookie
router.get("/town/cookie",  (req, res) => {
  const token = req.cookies?.owner;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

//client log
router.get("/google/client", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "client",
  })(req, res, next);
});

// step 3: save town branch cookie
router.get("/client/cookie",  (req, res) => {
  const token = req.cookies?.at;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// marchent log
router.get("/google/marchent", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "marchent",
  })(req, res, next);
});

router.get("/marchent/cookie", async (req, res) => {
  const token = req.cookies?.amogu;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const isActive = await admin_model.findById(user.id);
     // Assuming the token contains an isActive field

     console.log("User:", user);
     console.log("isActive:", isActive.active);

    res.json({ user, isActive: isActive.active });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// delivery boy
router.get("/google/deliveryBoy", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "deliveryBoy",
  })(req, res, next);
});

router.get("/deliveryBoy/cookie",  (req, res) => {

  const token = req.cookies?.deliveryBoy;

  if (!token) {
    return res.json({ message: "No token" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch (err) {
    res.json({ message: "Invalid token" });
  }

});



export default router