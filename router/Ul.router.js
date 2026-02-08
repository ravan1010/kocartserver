import express from 'express';
const router = express.Router()
import {signat, authLocation, appAuth} from '../middleware/OGauth.js';
import { home, setting, address, explore, cartdata, removecart, buy, order, addtocart, calculateDeliveryFee } from '../controller/UI.controller.js';
// const event_post_model = require('../model/event_post_model.js')
import user_model from '../model/user_model.js';
import { checkout, verifyPayment } from '../controller/orderController.js';



router.route('/home').get( signat, home )

router.route('/explore').get(signat, explore)

router.route('/setting').get(signat, setting)
//web
router.route('/address-list').get(signat, address)
//app
router.route('/app/address-list').get(appAuth, address)


// Add item to cart
router.route("/cart/add").post( signat, addtocart)
//app add item to
router.route("/app/cart/add").post( appAuth, addtocart)

// Get cart
router.route("/cart/get").get(signat, cartdata)
//app
router.route("/app/cart/get").get(appAuth, cartdata)

// Remove item
router.route("/remove/:id").delete(signat, removecart)
//app
router.route("/app/remove/:id").delete(appAuth, removecart)

router.post("/delivery-fee", signat, calculateDeliveryFee);
router.route('/order/checkout').post(signat, checkout)
router.route('/order/verify').post(signat, verifyPayment)
// Buy (Checkout)
router.route("/buy").post(signat, buy) 
//app
router.route("/app/buy").post(appAuth, buy)

//web
router.route("/order").get(signat, order)
//app
router.route("/app/order").get(appAuth, order)


export default router;

 