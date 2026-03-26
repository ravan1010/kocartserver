import express, { Router } from 'express';
import { signat } from '../middleware/OGauth.js';
import { createParcel, distance, forTo, from } from '../controller/long_controller.js';

const router = express.Router();

router.route("/routes/:from").get(signat, forTo)
router.route("/cities").get(signat, from)

router.route("/distance").post(signat, distance)
router.route("/parcel/create").post(signat, createParcel)


export default router
