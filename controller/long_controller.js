import branch_model from "../model/branch_model.js";
import Parcel_model from "../model/Parcel_model.js";
import route_db from "../model/route_db.js";
import axios from "axios";
import { sendPushNotification } from "../utils/firebase.js";



export const from = async (req, res) => {

  const tolat = '12.312480'
  const tolon = '76.658451'
  const fromlat = '12.153741'
  const fromlon = '77.104185'
  const from = 'kollegal'
  const to = 'mysore'
  const amount = 150

  // const route = await route_db.create({
  //   from,
  //   fromlat,
  //   fromlon,
  //   to,
  //   tolat,
  //   tolon,
  //   amount
  // })

  // console.log(route)



    const routes = await route_db.distinct("from");
    console.log(routes)

  res.json(routes);
}

export const forTo = async (req, res) => {

  console.log("from")
  const routes = await route_db.find({
    from: req.params.from
  });
  res.json(routes);
}

export const distance = async (req, res) => {
  try {

    const {
      from,
      to,
      pickuplat,
      pickuplon,
      reciverlat,
      reciverlon
    } = req.body;

    console.log(`from : ${from}, to : ${to}, pickuplat: ${pickuplat}
      pickuplon: ${pickuplon}, reciverlat: ${reciverlat}, reciverlon: ${reciverlon}`)

    // find route in DB
    const route = await route_db.findOne({ from, to });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const { fromlat, fromlon, tolat, tolon, amount } = route;

    const apiKey = process.env.GEOAPIFY_KEY;

    // function to get distance from geoapify
    const getDistance = async (lat1, lon1, lat2, lon2) => {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${lat1},${lon1}|${lat2},${lon2}&mode=drive&apiKey=${apiKey}`;

      const res = await axios.get(url);

      const meters = res.data.features[0].properties.distance;
      const km = meters / 1000;

      return km;
    };

    // 1️⃣ pickup → route start
    const pickupDistance = await getDistance(
      pickuplat,
      pickuplon,
      fromlat,
      fromlon
    );

    // 2️⃣ route start → route end
    const routeDistance = await getDistance(
      fromlat,
      fromlon,
      tolat,
      tolon
    );

    // 3️⃣ route end → receiver
    const receiverDistance = await getDistance(
      tolat,
      tolon,
      reciverlat,
      reciverlon
    );

    // charges
    const pickupCharge = pickupDistance * 10;
    const receiverCharge = receiverDistance * 10;

    const totalDistance =
      pickupDistance + routeDistance + receiverDistance;

    const totalAmount =
      amount + pickupCharge + receiverCharge;

      console.log(`pickupDistance: ${pickupDistance.toFixed(2)},
      routeDistance: ${routeDistance.toFixed(2)},
      receiverDistance: ${receiverDistance.toFixed(2)},
      totalDistance: ${totalDistance.toFixed(2)},
      pickupCharge: ${pickupCharge.toFixed(2)},
      receiverCharge: ${receiverCharge.toFixed(2)},
      routeAmount: ${amount},
      totalAmount: ${totalAmount.toFixed(2)}`)

    res.json({
      success: true,
      fromlat: fromlat,
      fromlon: fromlon,
      tolat: tolat,
      tolon: tolon,
      pickupDistance: pickupDistance.toFixed(2),
      routeDistance: routeDistance.toFixed(2),
      receiverDistance: receiverDistance.toFixed(2),
      totalDistance: totalDistance.toFixed(2),
      pickupCharge: pickupCharge.toFixed(2),
      receiverCharge: receiverCharge.toFixed(2),
      routeAmount: amount,
      totalAmount: totalAmount.toFixed(2)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Distance calculation failed" });
  }
};

export const createParcel = async (req, res) => {

  try {

    const {

      fromCity,
      fromlat,
      fromlon,
      toCity,
      tolat,
      tolon,

      pickupName,
      pickupPhone,
      pickupAddress,
      pickupLat,
      pickupLng,

      receiverName,
      receiverPhone,
      receiverAddress,
      receiverLat,
      receiverLng,

      price,
      paymentType

    } = req.body;

    const userID = req.Atoken.id;

    //create percel
    const parcel = await Parcel_model.create({

      userID,

      fromCity,
      fromlat,
      fromlon,

      toCity,
      tolat,
      tolon,

      pickupName,
      pickupPhone,
      pickupAddress,
      pickupLat,
      pickupLng,

      receiverName,
      receiverPhone,
      receiverAddress,
      receiverLat,
      receiverLng,

      price,
      paymentType,

    });

    //find nearest branch

    const nearbyBranches = await branch_model.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [fromlon, fromlat],
          },
          $maxDistance: 25000,
        },
      },
    })

    console.log("Nearby branches:", nearbyBranches);

    if(nearbyBranches.length > 0){

     await sendPushNotification(
        nearbyBranches[0].fcmToken,
        "New parcel Order Nearby you pickit!",
        `Order ID: `,
        "https://yourdomain.com/admin/order"
      );

    }
    // await parcel.save();

    res.json({
      success: true,
      message: "Parcel booked successfully",
      parcel
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Booking failed"
    });

  }

};