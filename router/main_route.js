import express from 'express';
import { ALLotps, mainsignup, mainsignupOTPverify } from '../controller/main.js';
import { maintoken } from '../middleware/main_auth.js';

const router = express.Router();




router.route('/main/sign').post(mainsignup)
router.route('/main/otp').post(mainsignupOTPverify)

router.route('/main/dashboard/otp').get(maintoken, ALLotps)


router.get('/main/token', ownertoken, (req, res) => {
    res.json({owner: req.main})
});

export default router;

