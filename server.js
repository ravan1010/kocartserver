 import express from 'express';
import dbconnection from './utils/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from "passport";

import admin_router from './router/admin_router.js';
import OG_router from './router/OG_router.js';
import getpost from './router/Ul.router.js';
import owner from './router/owner_router.js';
import long from './router/long_route.js'
import log from './router/log.js'
import parcel from './router/parcelANDtransport.js'
import path from 'path'; 

import { fileURLToPath } from "url";

import "./config/passport.js";


const port = 5001;
const app = express()



app.use(express.urlencoded({extended:true, limit: '200mb'}))
app.use(express.json({ limit: '200mb' }))
app.use(cookieParser())

const allowedOrigins = [
  "http://localhost:5173",
  "https://www.kocart.online",
  "https://kocart.online",
  "https://delivery.kocart.online",
  "https://branch.kocart.online",
  "https://parcelandtransport.kocart.online",
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("CORS Origin:", origin);

      // React Native/mobile requests may have no Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);


app.get('/i', (req, res) => { 
  res.send('connected')
}) 

app.use(passport.initialize());

app.use('/auth', log)
app.use('/api', admin_router)
app.use('/api', OG_router)
app.use('/api', getpost)
app.use('/api', owner)
app.use('/api', long) 
app.use('/api', parcel)


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, "../frontend/dist")))
app.get("/slug", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
}) 

 
dbconnection().then(() => {
      app.listen(port, () => {
            console.log(`server run at ${port} `)
        })
}) 
  
