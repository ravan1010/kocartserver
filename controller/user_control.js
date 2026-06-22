import usermodel from '../model/user_model.js';
import jwt from 'jsonwebtoken';
import addressmodel from '../model/address_model.js';
import dotenv from 'dotenv';


dotenv.config();

export const liveupdate = async (req, res) => {

    const { latitude, longitude, city } = req.body

    const userId = req.Atoken.id;
    const user = await usermodel.findById(userId);
    
    if (user) {

      const updatedLive = await user.findByIdAndUpdate(
        userId,
        {
          $set: {
            location: {
              type: "Point",
              coordinates: [longitude, latitude], // IMPORTANT: lng first
            },
            city: city
          },
        },
        { new: true }
      );

      await updatedLive.save()
      console.log(updatedLive)
      res.json({ success: true })
    

    }


}

export const Address = async (req, res, next) => {

  const id = req.Atoken.id
  const { Fullname, FHBCA, ASSV, Landmark, pincode, cityTown, state } = req.body
  const user = await usermodel.findOne({ _id: id })
  try {
    if (!id) {
      return res.status(401).json({ message: `you don't have access key` })
    }

    console.log(Fullname, FHBCA, ASSV, Landmark, pincode, cityTown, state)

    const address = await addressmodel.create({ authorID: user._id, Fullname, FHBCA, ASSV, Landmark, pincode, cityTown, state })
    await address.save()

    if (address) {
      user.addressID.push(address._id)
      await user.save()
      console.log(address._id, "done")
    }
    res.status(200).json({ message: 'ok' })

  } catch (error) {
    res.json(error)
  }
}

