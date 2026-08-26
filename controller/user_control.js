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

export const userFCMtoken = async (req, res) => {
  try {
    const number = req.Atoken.id
    const { fcmToken } = req.body;
    console.log('number :', number)

    if (!fcmToken) {
      return res.status(400).json({ success: false });

    }

    await usermodel.updateMany({ _id: number }, {
      fcmToken: fcmToken
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceLocationsPath = path.join(
  __dirname,
  "../data/serviceLocations.json"
);

const serviceLocations = JSON.parse(
  fs.readFileSync(
    serviceLocationsPath,
    "utf-8"
  )
);


const getDistanceInKm = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLng =
    ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};

export const checkServiceAvailability = (
  req,
  res
) => {
  try {
    const {
      latitude,
      longitude,
    } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Invalid latitude or longitude",
      });
    }

    let nearestLocation = null;
    let nearestDistance = Infinity;

    for (const service of serviceLocations) {
      const distance = getDistanceInKm(
        lat,
        lng,
        Number(service.latitude),
        Number(service.longitude)
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestLocation = service;
      }

      const radius =
        Number(service.radiusKm) || 5;

      if (distance <= radius) {
        return res.json({
          success: true,
          available: true,

          message:
            "Service is available in your location",

          serviceArea: {
            id: service.id,
            name: service.name,
          },

          distanceKm: Number(
            distance.toFixed(2)
          ),

          latitude: lat,
          longitude: lng,
        });
      }
    }

    return res.json({
      success: true,
      available: false,

      message:
        "Service is not available in your location. Coming soon!",

      nearestServiceArea:
        nearestLocation
          ? {
              id: nearestLocation.id,
              name: nearestLocation.name,
            }
          : null,

      distanceToNearestKm:
        Number(nearestDistance.toFixed(2)),

      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error(
      "Service availability error:",
      error
    );

    return res.status(500).json({
      success: false,
      available: false,
      message: "Unable to check service availability",
    });
  }
};

