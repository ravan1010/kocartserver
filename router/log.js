import passport from "passport";
import jwt from "jsonwebtoken"
import { Router } from "express";
const router = Router()
import dotenv from "dotenv"
import { OAuth2Client } from 'google-auth-library'
import admin_model from "../model/admin_model.js";
import user_model from "../model/user_model.js";
import deliveryBoy_model from "../model/deliveryBoy_model.js";
dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


//log request
router.get("/google/branch", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "branch",
  })(req, res, next);
});

router.post("/app/google/user", async (req, res) => {
  const { token, state } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const avatar = payload.picture;

    let account;

    switch (state) {
      case "client":
        account = await user_model.findOne({ googleId });

        if (!account) {
          account = await user_model.create({
            googleId,
            email,
            name,
            avatar,
          });
        }
        break;

      case "marchent":
        account = await admin_model.findOne({ googleId });

        if (!account) {
          account = await admin_model.create({
            googleId,
            email,
            name,
            avatar,
          });
        }
        break;

      case "deliveryBoy":
        account = await deliveryBoy_model.findOne({ googleId });

        if (!account) {
          account = await deliveryBoy_model.create({
            googleId,
            email,
            name,
            avatar,
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid state",
        });
    }

    const jwtToken = jwt.sign(
      {
        id: account._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "100d",
      }
    );

    res.json({
      success: true,
      token: jwtToken,
      userId: account._id,
      role: state,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({
      success: false,
      error: "Invalid Google token",
    });
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
        // domain: ".kocart.online",
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
        // "https://localhost:5173/marchent-auth-success"
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
router.get("/town/cookie", (req, res) => {
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
router.get("/client/cookie", (req, res) => {
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

router.get("/deliveryBoy/cookie", (req, res) => {

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