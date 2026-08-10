import express from 'express';
const router = express.Router()
import {signat, authLocation, appAuth} from '../middleware/OGauth.js';
import { home, setting, address, explore, cartdata, removecart, buy, order, addtocart, calculateDeliveryFee, nearby, updateLocation, merchantProducts, clearCart, mart, getmartMerchantVariants, martmerchantProducts, serviceType, createBikeParcelOrder, distanceToParcel, getBikeParcelOrders, createPassengerAutoOrder, getpassengerAutoOrders, createGoodsAutoOrder, getGoodsAutoOrders, getMyLocation, getActivePassengerAutoOrder, getPassengerAutoOrderStatus, getMonthlyAutoOrders } from '../controller/UI.controller.js';
// const event_post_model = require('../model/event_post_model.js')
import user_model from '../model/user_model.js';
import { appplaceCODOrder, checkout, placeCODOrder, verifyPayment } from '../controller/orderController.js';
import { liveupdate } from '../controller/user_control.js';

router.route('/liveupdate').post(liveupdate)
 
router.route('/home').get( signat, home );
router.route('/mart').get(signat, mart);
router.put("/user/location", signat, updateLocation);
router.get("/merchant/:id", signat, merchantProducts);

router.get('/mart/variants/:id', signat, getmartMerchantVariants)

router.get("/mart/marchent/product", signat, martmerchantProducts);

router.route('/explore').get( signat, explore )
//web
router.route('/setting').get( signat, setting )

//app
router.route('/app/setting').get( appAuth, setting )

//web
router.route('/address-list').get(signat, address )
//app
router.route('/app/address-list').get(appAuth, address )

// Add item to cart
router.route("/cart/add").post( signat, addtocart )
//app add item to
router.route("/app/cart/add").post( appAuth, addtocart )

//web
router.route("/cart/clear").delete(signat, clearCart)

// Get cart
router.route("/cart/get").get(signat, cartdata )
//app
router.route("/app/cart/get").get(appAuth, cartdata )

// Remove item
router.route("/remove/:itemId/:shopId").delete(signat, removecart )
//app
router.route("/app/remove/:itemId/:shopId").delete(appAuth, removecart )

//web 
router.post("/delivery-fee", signat, calculateDeliveryFee );
//app
router.post("/app/delivery-fee", appAuth, calculateDeliveryFee );

// web
router.route('/order/checkout').post(signat, checkout )
router.route('/order/verify').post(signat, verifyPayment )

//web
router.route('/order/cod').post(signat, placeCODOrder )
//app
router.route('/app/order/cod').post(appAuth, appplaceCODOrder )

// Buy (Checkout)
router.route("/buy").post(signat, buy ) 
//app
router.route("/app/buy").post(appAuth, buy )

//web
router.route("/order").get(signat, order )
//app
router.route("/app/order").get(appAuth, order )



router.route("/services").get(signat, serviceType)
router.route("/client/location").get(signat, getMyLocation)
router.route('/parcel/distance').post(signat, distanceToParcel)
router.route("/auto/active").get(signat, getActivePassengerAutoOrder );


router.route("/createparcel").post(signat, createBikeParcelOrder)
router.route("/bike-parcel/orders").get(signat,  getBikeParcelOrders);

router.route("/passenger-auto/order").post(signat, createPassengerAutoOrder)
router.route("/passenger-auto/order/:orderId").get(signat, getPassengerAutoOrderStatus)
router.route("/passenger-auto/all/orders").get(signat, getpassengerAutoOrders)

router.route("/goods-auto/order").post(signat, createGoodsAutoOrder)
router.route("/goods-auto/order/:orderId").get(signat, getPassengerAutoOrderStatus)
router.route("/goods-auto/all/orders").get(signat, getGoodsAutoOrders)

router.route("/auto/orders/monthly").get(signat, getMonthlyAutoOrders);



  

export default router;

 
