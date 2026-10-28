import passport from "passport";
import Google from 'passport-google-oauth20'
const GoogleStrategy = Google.Strategy;
import BranchData from '../model/branch_model.js'
import user_model from "../model/user_model.js";
import dotenv from 'dotenv'
import parcelANDtransport from "../model/parcelANDtransport.js";
import busDriver from "../model/busDriver.js";
import admin_model from "../model/admin_model.js";
dotenv.config()
 
passport.use( 
  new GoogleStrategy(
    {      
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
      callbackURL: `https://serverside.kocart.online/auth/google/callback` || process.env.GOOGLE_CALLBACK_URL ,
      passReqToCallback: true, // Important
    },
    async (req, accessToken, refreshToken, profile, done) => {
     
      try {

        const role = req.query.state; // user or vendor

        let account;

        if (role === "branch") {
          account = await BranchData.findOne({
            googleId: profile.id,
          });

          if (!account) {
            account = await BranchData.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
            });
          }
        }
  
          
        if (role === "client") {
          account = await user_model.findOne({
            googleId: profile.id,
          }); 

          if (!account) {
            account = await user_model.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
            });
          }
        }

        if (role === "admin") {
          account = await admin_model.findOne({
            googleId: profile.id,
          }); 

          if (!account) {
            account = await admin_model.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
            });
          }
        }

        if (role === "BusDriver") {
          account = await busDriver.findOne({
            googleId: profile.id,
          }); 

          if (!account) {
            account = await busDriver.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
            });
          }
        }
      
        return done(null, account);

      } catch (error) {
          return done(error, null);
      }
    }
  
  )
);  