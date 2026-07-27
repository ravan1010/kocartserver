import express from 'express';
import {  getpostdata, 
    postTohomepage, 
    removepostinhomepage,
     getorderdata, 
      orderProcess, 
      ordercancel, 
      getordercancel, 
      afterorderprocess,
       Tocomplete,
        ordercomplete, 
        postActive,
         branchFCMtoken,
          branchLocation,
            Branch_dashboard,
             Branch_openORclose,
              parcelFromData, parcelToData, marchentActivate, 
              getOrderTobranch,
              getMarchentData,
              postsData,
              copyProductToMerchant,
              MerchantpaymentSettlement,
              getDeliveryData,
              deliveryboykocartSettlement,
              deliveryboypaymentSettlement} from '../controller/owner_controller.js';
import { ownertoken } from '../middleware/owner.js';
import { appdeliveryBoyAuth, deliveryBoyAuth } from '../middleware/OGauth.js';
import { DeliveryAcceptOrder, DeliveryBoyFCMtoken, 
         DeliveryBoyIsOnline,
         DeliveryBoyLocation, 
         DeliveryComplete, 
         Deliverydashboard, 
         DeliverygetAssignOrders, 
         DeliverygetOrders, 
         DeliverygetpickedupOrders, 
         Deliverypickedup} from '../controller/deliveryBoy.js';

const router = express.Router()

router.route('/owner/fcmToken').post(ownertoken, branchFCMtoken)
router.route('/owner/location').post(ownertoken, branchLocation)

router.route('/owner/posts').get(ownertoken, postsData)
router.route('/owner/post/copy').post(ownertoken, copyProductToMerchant)

router.route('/owner/dashboard').get(ownertoken, Branch_dashboard)
router.route('/owner/openORclose').post(ownertoken, Branch_openORclose)


router.route('/owner/marchentActivate').get(ownertoken, marchentActivate)

router.route('/owner/getpostdata').get(ownertoken, getpostdata)
router.route('/owner/active').post(ownertoken, postActive)
router.route('/owner/postTohomepage').post(ownertoken, postTohomepage)
router.route('/owner/removepostinhomepage').post(ownertoken, removepostinhomepage)


//order status
router.route('/owner/getorderdata').get(ownertoken, getorderdata)

router.route('/owner/orders').get(ownertoken, getOrderTobranch) 

router.route('/owner/orderProcess').post(ownertoken, orderProcess)
router.route('/owner/ordercancel').post(ownertoken, ordercancel)

router.route('/owner/getordercancel').get(ownertoken, getordercancel)

router.route('/owner/afterorderprocess').get(ownertoken, afterorderprocess)
router.route('/owner/Tocomplete').post(ownertoken, Tocomplete)

router.route('/owner/ordercomplete').get(ownertoken, ordercomplete)

router.route('/parcelfromData').get(ownertoken, parcelFromData)
router.route('/parceltoData').get(ownertoken, parcelToData)

router.route('/owner/getmarchemtData').get(ownertoken, getMarchentData)
router.route('/owner/zero').post(ownertoken, MerchantpaymentSettlement)

router.route('/owner/getdeliveryData').get(ownertoken, getDeliveryData)
router.route('/owner/kocartamount').post(ownertoken, deliveryboykocartSettlement)
router.route('/owner/deliverypayment').post(ownertoken, deliveryboypaymentSettlement)

// router.route('/owner/image').post(ownertoken, imageCreate)
// router.route('/owner/delete/:id').delete(ownertoken, imagedelete)

 // delivery boy

//web
router.route('/delivery-boy/fcmToken').post(deliveryBoyAuth, DeliveryBoyFCMtoken)
router.route('/delivery-boy/location').post(deliveryBoyAuth, DeliveryBoyLocation)
router.route('/delivery/dashboard').get(deliveryBoyAuth, Deliverydashboard)
router.route('/delivery/onAndOff').post(deliveryBoyAuth, DeliveryBoyIsOnline)

router.route("/delivery/orders").get(deliveryBoyAuth, DeliverygetOrders);
router.route("/delivery/accept/:orderId").put(deliveryBoyAuth, DeliveryAcceptOrder)
router.route("/delivery/assigned").get(deliveryBoyAuth, DeliverygetAssignOrders)
router.route("/delivery/pickedup/:orderId").put(deliveryBoyAuth, Deliverypickedup)
router.route("/delivery/getpickedupOrder").get(deliveryBoyAuth, DeliverygetpickedupOrders)
router.route("/delivery/complete/:orderId").put(deliveryBoyAuth, DeliveryComplete)

//app
router.route('/app/delivery-boy/fcmToken').post(appdeliveryBoyAuth, DeliveryBoyFCMtoken)
router.route('/app/delivery-boy/location').post(appdeliveryBoyAuth, DeliveryBoyLocation)
router.route('/app/delivery/dashboard').get(appdeliveryBoyAuth, Deliverydashboard)
router.route('/app/delivery/onAndOff').post(appdeliveryBoyAuth, DeliveryBoyIsOnline)

router.route("/app/delivery/orders").get(appdeliveryBoyAuth, DeliverygetOrders);
router.route("/app/delivery/accept/:orderId").put(appdeliveryBoyAuth, DeliveryAcceptOrder)
router.route("/app/delivery/assigned").get(appdeliveryBoyAuth, DeliverygetAssignOrders)
router.route("/app/delivery/pickedup/:orderId").put(appdeliveryBoyAuth, Deliverypickedup)
router.route("/app/delivery/getpickedupOrder").get(appdeliveryBoyAuth, DeliverygetpickedupOrders)
router.route("/app/delivery/complete/:orderId").put(appdeliveryBoyAuth, DeliveryComplete)
 
router.get('/owner/token', ownertoken, (req, res) => {
    res.json({owner: req.owner})
});

export default router;
