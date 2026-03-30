import express, { Router } from 'express';
import { appAuth, signat } from '../middleware/OGauth.js';
import { createParcel, distance, forTo, from } from '../controller/long_controller.js';

const router = express.Router();

router.route("/routes/:from").get(forTo)
router.route("/cities").get(from)

router.route("/distance").post(distance)
router.route("/parcel/create").post(signat, createParcel)

router.route("/app/parcel/create").post(appAuth, createParcel)


export default router
