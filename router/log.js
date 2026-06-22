import passport from "passport";
import jwt from "jsonwebtoken"
import { Router } from "express";
const router = Router()
import dotenv from "dotenv"
import { OAuth2Client } from 'google-auth-library'
import admin_model from "../model/admin_model.js";
dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


//log request
router.get("/google/branch", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "branch",
  })(req, res, next);
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
      });

      return res.redirect(
        "http://localhost:5173/branch-auth-success"
      );
    }

    if (role === "client") {
    res.cookie("at", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.redirect(
      "http://localhost:5173/client-auth-success"
    );
  }

  if (role === "marchent") { 

    res.cookie("amogu", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.redirect(
      "http://localhost:5173/marchent-auth-success"
    );
  }

  if (role === "deliveryBoy") {
    res.cookie("deliveryBoy", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    return res.redirect(
      "http://localhost:5173/deliveryBoy-auth-success"
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
    return res.status(401).json({ message: "No token" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }

});



export default router