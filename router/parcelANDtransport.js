import express from 'express';
import { parcelANDtransportAuth } from '../middleware/OGauth.js';
import { acceptBikeParcelOrder, 
         driverArrivedUpdate, 
         getAcceptedBikeParcelOrder, 
         getacceptedPendingOrders, 
         getArrivedOrder, 
         getNearbyPendingOrders, 
         getPickedUpOrder, 
         parcelandtransportFCMtoken, 
         parcelBoyIsOnline, 
         parceldashboard, 
         ReassignParcelOrder, 
         submitDriverAmount, 
         updateBikeParcelDriverLocation, 
         updatePartnerDetails, 
         verifyDeliveryOtp, 
         verifyPickupOtp} from '../controller/parcelANDTransport.js';

const router = express.Router();

router.route('/parcelandtransport/fcmToken').post(parcelANDtransportAuth,parcelandtransportFCMtoken )

router.route('/parcelandtransport/details').put(parcelANDtransportAuth, updatePartnerDetails )

router.route('/parcel/dashboard').get(parcelANDtransportAuth, parceldashboard)
router.route('/parcel/onANDoff').post(parcelANDtransportAuth, parcelBoyIsOnline)

router.route("/update/location").put(parcelANDtransportAuth, updateBikeParcelDriverLocation );

router.route("/partner/orders/nearby/:serviceType").get(parcelANDtransportAuth, getNearbyPendingOrders);
router.route("/partner/orders/accept/:orderId").put(parcelANDtransportAuth, acceptBikeParcelOrder)

router.route("/parter/accepted/order").get(parcelANDtransportAuth, getacceptedPendingOrders)
router.route("/parter/accepted/order/amount/:orderId").post(parcelANDtransportAuth, submitDriverAmount)

router.route("/partner/orders/current").get(parcelANDtransportAuth, getAcceptedBikeParcelOrder);
router.route("/partner/orders/driverArrived/:orderId").put(parcelANDtransportAuth, driverArrivedUpdate);
router.route("/partner/orders/Reassign/:orderId").put(parcelANDtransportAuth, ReassignParcelOrder);


router.route("/partner/orders/Arrived").get(parcelANDtransportAuth, getArrivedOrder );
router.route("/partner/orders/verify-pickup/:orderId").put(parcelANDtransportAuth, verifyPickupOtp);

router.route("/partner/orders/picked-up").get(parcelANDtransportAuth, getPickedUpOrder);
router.route("/partner/orders/verify-delivery/:orderId").put(parcelANDtransportAuth, verifyDeliveryOtp);


router.get('/parcelandtransport/token', parcelANDtransportAuth, async (req, res) => {
    res.json({ user: req.parcelandtransport }); 
});

export default router;

