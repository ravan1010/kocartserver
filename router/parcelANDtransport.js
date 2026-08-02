import express from 'express';
import { parcelANDtransportAuth } from '../middleware/OGauth.js';
import { parcelandtransportFCMtoken, 
         parcelBoyIsOnline, 
         parceldashboard, 
         updatePartnerDetails } from '../controller/parcelANDTransport.js';
const router = express.Router();

router.route('/parcelandtransport/fcmToken').post(parcelANDtransportAuth,parcelandtransportFCMtoken )

router.route('/parcelandtransport/details').put(parcelANDtransportAuth, updatePartnerDetails )

router.route('/parcel/dashboard').get(parcelANDtransportAuth, parceldashboard)
router.route('/parcel/onANDoff').post(parcelANDtransportAuth, parcelBoyIsOnline)


router.get('/parcelandtransport/token', parcelANDtransportAuth, async (req, res) => {
    res.json({ user: req.parcelandtransport }); 
});

export default router;
