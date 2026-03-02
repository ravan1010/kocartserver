import main_model from "../model/main_model.js";
import adminotpmodel from '../model/admin_otp.js'



export const mainsignup = async (req, res, next) => {

    const {number} = req.body;
    try { 
    
    const otp = otpGenerate.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false })

    const otpnumber = await adminotpmodel.create({ otp: otp, number})
    await otpnumber.save()

    res.status(201).json({success: true})
        
    } catch(error) {
      res.status(401).json({error:error.message})
    }

}

export const mainsignupOTPverify = async (req, res, next) => { 
          const {otp} = req.body

          const findotp = await adminotpmodel.findOne({ otp })
          const number = findotp.number

          try {
          if(!findotp){return res.json({message:'no'})}

          const main = await main_model.create(number)
          const id = main._id

          const token = jwt.sign({ id , iat: Math.floor(Date.now() / 1000) - 30 }
                 ,process.env.ADMINJWTOTPKEY , { expiresIn: '400d' });

          res.cookie('main', token, {
              httpOnly: true,
              secure: true, // true in production
              sameSite: 'none',
              maxAge: 400 * 24 * 60 * 60 * 1000
            })
            return res.json({message: 'verified'})
          } catch (error) {
            console.log(error)
            res.status(400).json(error)
          }
}  

export const ALLotps = async(req, res) => {
  try {
    const otps = await adminotpmodel.find()
    res.json(otps || [])
  } catch (error) {
    res.json(error)
  }
}



