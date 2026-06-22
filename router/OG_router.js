import express from 'express';
import { Address } from '../controller/user_control.js';
import { appAuth, authLocation, deliveryBoyAuth, signat } from '../middleware/OGauth.js';
import user_model from '../model/user_model.js';
const router = express.Router()

router.route('/to/address').post( signat, Address)

//auth check for frontend

router.get('/token', signat, async (req, res) => {
    res.json({ user: req.Atoken });
});

router.get('/deliveryboy/token', deliveryBoyAuth, async (req, res) => {
    
    res.json({ user: req.deliveryBoy });
});

router.get('/authlocation', authLocation, async(req, res) => {
    res.json({user: req.location})
    console.log(req.user)
});

//app auth
router.get('/appAuth', appAuth, async(req, res) => {
    try {

        const user = await user_model.findOne({_id: req.Atoken.id})
            if(!user) return res.json({massage: 'user not found'})
        
                res.json({token: req.Atoken, username: user.number})
                console.log(req.Atoken, user.number)
    } catch (error) { 
        res.json(error)
        console.log(error)
    }
})

router.route('/app/address').post(appAuth, Address);

export default router;
