
import express from 'express';


import { signat } from '../middleware/OGauth.js';
const router = express.Router();
import { admincat, admingu, adminif, admintoa } from '../middleware/admin_auth.js';
import { Adminid, admininfo, adminsignup, adminsignupOTPverify, bookedlisttoadmin, dashboard, EVENTCreate, EVENTDelete, EVENTUpdate, getdaytime, getSinglePost, open, openORclose, setdaytime, Toadmin } from '../controller/admin_controller.js';

///admin

router.route('/admin').post(signat, adminsignup)
router.route('/admin/otp').post(signat, admingu, adminsignupOTPverify)
router.route('/admin/info').post(signat, adminif, admininfo)

router.route('/adminid').get(admintoa, Adminid);
router.route('/:id/availability').put(setdaytime);
router.route('/:id/availability').get(getdaytime);

//product 
router.route('/admin/post').post(admintoa, EVENTCreate  )
router.route("/admin/post/:id").put(admintoa, EVENTUpdate);
router.route("/admin/post/:id").get(admintoa, getSinglePost);

router.route('/admin/post/open/:id').post(admintoa, open)


router.route('/admin/dashboard').get(admintoa, dashboard )
router.route('/admin/door').post(admintoa, openORclose)
router.route('/admin/:id').delete(admintoa, EVENTDelete)


router.route('/toadmin').get(admintoa, Toadmin)
router.route('/bookedlist').get(admintoa, bookedlisttoadmin)

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
