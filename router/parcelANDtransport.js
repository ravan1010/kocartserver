import express from 'express';
import { parcelANDtransportAuth } from '../middleware/OGauth';
const router = express.Router();

// router.route('/parcelANDtransport/fcmToken').post(, AdminFCMtoken)


router.get('/parcelandtransport/token', parcelANDtransportAuth, async (req, res) => {
    
    res.json({ user: req.parcelANDtransport });
});

export default router;
