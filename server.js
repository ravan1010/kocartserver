import express from 'express';
import dbconnection from './utils/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import admin_router from './router/admin_router.js';
import OG_router from './router/OG_router.js';
import getpost from './router/Ul.router.js';
import owner from './router/owner_router.js';
import path from 'path';

import { fileURLToPath } from "url";

const port = 5001;
const app = express()

app.use(express.urlencoded({extended:true, limit: '200mb'}))
app.use(express.json({ limit: '200mb' }))
app.use(cookieParser())


app.use(cors({
  origin: true, // reflects request origin automatically
  credentials: true
}));


app.get('/i', (req, res) => {
  res.send('connected')
})

app.use('/api', admin_router)
app.use('/api', OG_router)
app.use('/api', getpost)
app.use('/api', owner)


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
  
