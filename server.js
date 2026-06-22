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
import path from 'path'; 

import { fileURLToPath } from "url";

import "./config/passport.js";


const port = 5001;
const app = express()



app.use(express.urlencoded({extended:true, limit: '200mb'}))
app.use(express.json({ limit: '200mb' }))
app.use(cookieParser())


app.use(cors({
  origin: [
      "http://localhost:5173",
      "https://www.kocart.online"

    ], // reflects request origin automatically
  credentials: true
}));


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
  
