
import express from 'express';


import { signat } from '../middleware/OGauth.js';
const router = express.Router();
import { admingu, adminif, admintoa } from '../middleware/admin_auth.js';
import { AdminFCMtoken, Adminid, admininfo, bookedlisttoadmin, dashboard, EVENTCreate, EVENTDelete, EVENTUpdate, getAdminOrders, getSinglePost, open, openORclose, Toadmin, updateOrder } from '../controller/admin_controller.js';

///admin

router.route('/admin/info').post(signat, admingu, admininfo)

router.route('/adminid').get(admingu, Adminid);

router.route('/marchent/fcmToken').post(admingu, AdminFCMtoken)

//product  
router.route('/admin/post').post(admingu, EVENTCreate  )
router.route("/admin/post/:id").put(admingu, EVENTUpdate);
router.route("/admin/post/:id").get(admingu, getSinglePost);

router.route('/admin/post/open/:id').post(admingu, open)


router.route('/admin/dashboard').get(admingu, dashboard )
router.route('/admin/door').post(admingu, openORclose)
router.route('/admin/:id').delete(admingu, EVENTDelete)


router.route('/toadmin').get(admingu, Toadmin)
router.route('/bookedlist').get(admingu, bookedlisttoadmin)


router.route('/admin/Orders').get(admingu, getAdminOrders)
router.route('/admin/order/update/:orderId/:orderstatus').put(admingu, updateOrder)


//admin auth route for frontend
router.get('/adminotp', admingu, (req, res) => {
    res.json({user: req.admingu})
});

router.get('/admininfo', adminif, (req, res) => {
    res.json({user: req.adminif})
});

router.get('/adminmain', admintoa, (req, res) => {
    res.json({user: req.admintoa})

});


export default router;
