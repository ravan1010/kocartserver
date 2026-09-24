import express from 'express';
import { checkServiceAvailability, Locationupdate } from '../controller/user_control.js';
import { appAuth, authLocation, signat } from '../middleware/user_auth.js';
import user_model from '../model/user_model.js';
const router = express.Router()

router.post( 
  "/check",
  checkServiceAvailability
);

//web   
router.put("/user/location", signat, Locationupdate);
//ko app
router.put("/app/user/location", appAuth, Locationupdate);

//auth check for frontend

router.get('/token', signat, async (req, res) => {
    res.json({ user: req.Atoken });
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


export default router;
