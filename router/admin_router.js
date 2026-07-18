
import express from 'express';


import { signat } from '../middleware/OGauth.js';
const router = express.Router();
import { admingu, adminif, admintoa, appAdminAuth } from '../middleware/admin_auth.js';
import { AdminFCMtoken, Adminid, admininfo, bookedlisttoadmin, dashboard, EVENTCreate, EVENTDelete, EVENTUpdate, getAdminOrders, getSinglePost, open, openORclose, Toadmin, updateOrder } from '../controller/admin_controller.js';
import admin_model from '../model/admin_model.js';

///admin

router.route('/admin/info').post(signat, admingu, admininfo)
//web
router.route('/adminid').get(admingu, Adminid);
//app
router.route('/app/adminid').get(appAdminAuth, Adminid);


//web
router.route('/marchent/fcmToken').post(admingu, AdminFCMtoken)

//app
router.route('/app/marchent/fcmToken').post(appAdminAuth, AdminFCMtoken)



//product  
router.route('/admin/post').post(admingu, EVENTCreate  )
router.route("/admin/post/:id").put(admingu, EVENTUpdate);
router.route("/admin/post/:id").get(admingu, getSinglePost);
//web
router.route('/admin/post/open/:id').post(admingu, open)

//app
router.route('/app/admin/post/open/:id').post(appAdminAuth, open)



//web
router.route('/admin/dashboard').get(admingu, dashboard )
//app
router.route('/app/admin/dashboard').get(appAdminAuth, dashboard )

//web
router.route('/admin/door').post(admingu, openORclose)
//app
router.route('/app/admin/door').post(appAdminAuth, openORclose)

router.route('/admin/:id').delete(admingu, EVENTDelete)


router.route('/toadmin').get(admingu, Toadmin)
router.route('/bookedlist').get(admingu, bookedlisttoadmin)

//web
router.route('/admin/Orders').get(admingu, getAdminOrders)
//app
router.route('/app/admin/Orders').get(appAdminAuth, getAdminOrders)

//web
router.route('/admin/order/update/:orderId/:orderstatus').put(admingu, updateOrder)
//app
router.route('/app/admin/order/update/:orderId/:orderstatus').put(appAdminAuth, updateOrder)


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

router.get('/marchent/data', async (req, res) => {
  try {
    
    const admin = await admin_model.find({ active: "false"  });
    console.log(admin)

    if (admin.length === 0) {
      return res.status(404).json({ message: 'No inactive vendors found' });
    }

    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/marchent/active/:id', async (req, res) => {
  try {
    const updatedVendor = await admin_model.findByIdAndUpdate(
      req.params.id,
      { $set: { active: true } },
      { new: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(200).json({
      message: 'marchent activated successfully',
      vendor: updatedVendor
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
