import express from 'express';
const router = express.Router()
import {signat, authLocation, appAuth} from '../middleware/OGauth.js';
import { home, setting, address, explore, cartdata, removecart, buy, order, addtocart, calculateDeliveryFee, nearby, updateLocation, merchantProducts, clearCart, mart, getmartMerchantVariants, martmerchantProducts, serviceType, createBikeParcelOrder, distanceToParcel, getBikeParcelOrders, createPassengerAutoOrder, getpassengerAutoOrders, createGoodsAutoOrder, getGoodsAutoOrders, getMyLocation, getPassengerAutoOrderStatus, getMonthlyAutoOrders, Kosetting, kogetMyLocation } from '../controller/UI.controller.js';
// const event_post_model = require('../model/event_post_model.js')
import user_model from '../model/user_model.js';
import { appplaceCODOrder, checkout, placeCODOrder, verifyPayment } from '../controller/orderController.js';
import { AppserviceType, liveupdate, NimmagetActivePassengerAutoOrder, Nimmasetting, NimmaupdateLocation } from '../controller/user_control.js';

router.route('/liveupdate').post(liveupdate)
 
router.route('/home').get( signat, home );
router.route('/mart').get(signat, mart);
//web   
router.put("/user/location", signat, updateLocation);
//ko
router.put("/app/ko/user/location", appAuth, updateLocation);
//nimma sarige app
router.put("/app/user/location", appAuth, NimmaupdateLocation);

router.get("/merchant/:id", signat, merchantProducts);

router.get('/mart/variants/:id', signat, getmartMerchantVariants)

router.get("/mart/marchent/product", signat, martmerchantProducts);

router.route('/explore').get( signat, explore )
//web
router.route('/setting').get( signat, Kosetting )
//
router.route('/app/ko/setting').get( signat, Kosetting )

//
router.route('/app/nearby').get(appAuth, nearby)
//Nimma
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

//web
router.route("/services").get(signat, serviceType)
//app
router.route("/app/services").get(appAuth, AppserviceType)

//wweb
router.route("/client/location").get(signat, getMyLocation)
//ko
router.route("/app/ko/client/location").get(appAuth, kogetMyLocation)

//nimma
router.route("/app/client/location").get(appAuth, getMyLocation)
//web
router.route('/parcel/distance').post(signat, distanceToParcel)   
//app
router.route('/app/parcel/distance').post(appAuth, distanceToParcel)   

///web
// router.route("/auto/active").get(signat, getActivePassengerAutoOrder ); 
//Nimma
router.route("/app/auto/active").get(appAuth, NimmagetActivePassengerAutoOrder ); 


router.route("/createparcel").post(signat, createBikeParcelOrder)
router.route("/bike-parcel/orders").get(signat,  getBikeParcelOrders);

router.route("/passenger-auto/order").post(signat, createPassengerAutoOrder)
router.route("/passenger-auto/order/:orderId").get(signat, getPassengerAutoOrderStatus)
router.route("/passenger-auto/all/orders").get(signat, getpassengerAutoOrders)

//web
router.route("/goods-auto/order").post(signat, createGoodsAutoOrder)
//app
router.route("/app/goods-auto/order").post(appAuth, createGoodsAutoOrder)

//web
router.route("/goods-auto/order/:orderId").get(signat, getPassengerAutoOrderStatus)
//app
router.route("/app/goods-auto/order/:orderId").get(appAuth, getPassengerAutoOrderStatus)

router.route("/goods-auto/all/orders").get(signat, getGoodsAutoOrders)

//web
router.route("/auto/orders/monthly").get(signat, getMonthlyAutoOrders);
//app
router.route("/app/auto/orders/monthly").get(appAuth, getMonthlyAutoOrders);



  

export default router;

 
