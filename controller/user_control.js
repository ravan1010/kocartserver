import usermodel from '../model/user_model.js';
import jwt from 'jsonwebtoken';
import addressmodel from '../model/address_model.js';
import dotenv from 'dotenv';
import client from '../model/client.js';

import parcelANDtransport from "../model/parcelANDtransport.js"

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




// Haversine distance

export const AppserviceType = async (req, res) => {
  try {
    const id = req.Atoken.id;

    // --------------------------------
    // 1. Get user
    // --------------------------------

    const user = await client
      .findById(id)
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------
    // 2. Validate user location
    // --------------------------------

    if (
      !user.location ||
      user.location.type !== "Point" ||
      !Array.isArray(user.location.coordinates) ||
      user.location.coordinates.length !== 2 ||
      (
        user.location.coordinates[0] === 0 &&
        user.location.coordinates[1] === 0
      )
    ) {
      return res.status(200).json({
        success: false,
        message: "Location not found",
        user: false,
        service: null,
        countdown: null,
      });
    }

    // GeoJSON = [longitude, latitude]
    const [
      userLng,
      userLat,
    ] = user.location.coordinates;

    // --------------------------------
    // 3. Current date/time
    // --------------------------------

    const now = new Date();

    // --------------------------------
    // 4. Check configured JSON services
    // --------------------------------

    const availableServices = [];
    const upcomingServices = [];

    for (const service of serviceLocations) {

      const distanceKm = getDistanceInKm(
        userLat,
        userLng,
        service.latitude,
        service.longitude
      );

      // --------------------------------
      // Outside configured radius
      // --------------------------------

      if (distanceKm > service.radiusKm) {
        continue;
      }

      // --------------------------------
      // Check available date/time
      // --------------------------------

      const availableAt = new Date(
        service.availableAt
      );

      if (Number.isNaN(availableAt.getTime())) {
        continue;
      }

      // --------------------------------
      // Service available now
      // --------------------------------

      if (availableAt <= now) {

        availableServices.push({
          distanceKm: Number(
            distanceKm.toFixed(2)
          ),

          radiusKm: service.radiusKm,

          availableAt:
            service.availableAt,
        });

      }

      // --------------------------------
      // Service available in future
      // --------------------------------

      else {

        upcomingServices.push({
          distanceKm: Number(
            distanceKm.toFixed(2)
          ),

          radiusKm: service.radiusKm,

          availableAt:
            service.availableAt,

          remainingMs:
            availableAt.getTime() -
            now.getTime(),
        });
      }
    }

    // --------------------------------
    // 5. Nothing configured nearby
    // --------------------------------

    if (
      availableServices.length === 0 &&
      upcomingServices.length === 0
    ) {
      return res.status(200).json({
        success: false,

        city: user.city || "",

        user: true,

        service: null,

        countdown: null,

        update: 0,

        link: "https://www.kocart.online",
      });
    }

    // --------------------------------
    // 6. Check actual DB service
    // --------------------------------

    let dbServiceTypes = [];

    // Only check DB when configured
    // service is already available

    if (availableServices.length > 0) {

      dbServiceTypes =
        await parcelANDtransport.distinct(
          "serviceType",
          {
            activate: true,
            isOnline: true,
            isAvailable: true,

            currentLocation: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates:
                    user.location.coordinates,
                },

                $maxDistance: 5000,
              },
            },
          }
        );
    }

    // --------------------------------
    // 7. Response
    // --------------------------------

    return res.status(200).json({
      success: true,

      city: user.city || "",

      user: true,

      // Actual available services
      service:
        dbServiceTypes.length > 0
          ? dbServiceTypes
          : null,

      // Future services
      countdown:
        upcomingServices.length > 0
          ? upcomingServices
          : null,

      update: 0,

      link: "https://www.kocart.online",
    });

  } catch (err) {

    console.error(
      "serviceType error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const NimmaupdateLocation = async (req, res) => {
  try {
    const id = req.Atoken.id;

    const { latitude, longitude, city } = req.body;

    const user = await client.findByIdAndUpdate(
      id,
      {
        city,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const Nimmasetting = async (req, res) => {
  console.log(req.Atoken);

  const id = req.Atoken.id;
  console.log("User ID:", id);

  try {
    if (!id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await client.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const autobooking = await BikeParcel_Order.find({customer: req.Atoken.id})


    res.json({
      number: user.email,
      user,
      order: [],
      autobooking: autobooking.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

///active 
export const NimmagetActivePassengerAutoOrder = async (req, res) => {
  // try {
    const userId = req.Atoken.id;

    const order = await BikeParcel_Order.findOne({
     customer : userId,
      status: {
        $in: [
          "pending",
          "driver_assigned",
          "driver_arrived",
          "picked_up",
        ],
      },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      order: order || null,
    });
  // } catch (error) {
  //   res.status(500).json({
  //     success: false,
  //     message: error.message,
  //   });
  // }
};