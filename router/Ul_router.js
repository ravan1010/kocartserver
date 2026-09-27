import express from 'express';
const router = express.Router()
import {signat, appAuth} from '../middleware/user_auth.js';
import { setting, serviceType, createBikeParcelOrder, distanceToParcel, getBikeParcelOrders, createPassengerAutoOrder, getpassengerAutoOrders, createGoodsAutoOrder, getGoodsAutoOrders, getMyLocation, getPassengerAutoOrderStatus, getMonthlyAutoOrders, getBookingDriverLocation } from '../controller/UI_controller.js';
// const event_post_model = require('../model/event_post_model.js')
import user_model from '../model/user_model.js';
import { AppserviceType, NimmagetActivePassengerAutoOrder, NimmaupdateLocation } from '../controller/user_control.js';
 






//web
router.route('/setting').get( signat, setting )
//ko
router.route('/app/setting').get( appAuth, setting )


//web
router.route("/services").get(signat, serviceType)
//app
router.route("/app/services").get(appAuth, serviceType)

//wweb  
router.route("/client/location").get(signat, getMyLocation)
//ko
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

// track
router.get(
  "/goods-auto/booking/driver-location/:userId", signat,
  getBookingDriverLocation
);

  

export default router;

 
