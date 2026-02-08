import express from 'express';
import { Address, login, logout, signup } from '../controller/user_control.js';
import { appAuth, authLocation, signat } from '../middleware/OGauth.js';
import user_model from '../model/user_model.js';
const router = express.Router()

router.route('/signup').post(signup)
router.route('/to/address').post( signat, Address)


router.route('/login').post(login)
router.route('/logout').post(signat, logout)
 

//auth check for frontend

router.get('/token', signat, async (req, res) => {
    if (!req.Atoken) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ user: req.Atoken });
});


router.get('/authlocation', authLocation, async(req, res) => {
    res.json({user: req.location})
    console.log(req.user)
});

//app auth
router.get('/appAuth', appAuth, async(req, res) => {
    try {

        const user = await user_model.findOne({number: req.Atoken.number})
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
