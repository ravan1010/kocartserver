import passport from "passport";
import jwt from "jsonwebtoken"
import { Router } from "express";
const router = Router()
import dotenv from "dotenv"
import { OAuth2Client } from 'google-auth-library'
import user_model from "../model/user_model.js";
import parcelANDtransport from "../model/parcelANDtransport.js";
dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


//websites

// user log
router.get("/google/client", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "client",
  })(req, res, next);
});

// save user cookie
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

// partner log
router.get("/google/parcel", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "parcel",
  })(req, res, next);
});

// save partner cookie
router.get("/parcelandtransport/cookie", (req, res) => {

  const token = req.cookies?.parcelandtransport;

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

      case "parcelandtransport":
        account = await parcelANDtransport.findOne({ googleId });

        if (!account) {
          account = await parcelANDtransport.create({
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
    try {
      console.log("STATE:", req.query.state);
      console.log("USER:", req.user);

      if (!req.user) {
        return res.status(400).json({
          success: false,
          message: "req.user is undefined",

        });
      }

      const role = req.query.state;

      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: "100d" }
      );

    if (role === "parcel") {
      res.cookie("parcelandtransport", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days
      });
      return res.redirect(
        "https://parcelandtransport.kocart.online/parcel-auth-success"
        // "https://localhost:5173/parcel-auth-success"
      );
    }  

    if (role === "auto") {
      res.cookie("parcelandtransport", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days
      });
      return res.redirect(
        // "https://parcelandtransport.kocart.online/parcel-auth-success"
        "https://localhost:5173/parcelANDtransport-auth-success"
      );
    }  

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
        // 'http://localhost:5173/client-auth-success'
      );
    }


       } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message,
      })
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



router.get("/google/auto", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "auto",
  })(req, res, next);
});


export default router