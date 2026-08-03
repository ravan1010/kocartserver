import parcelANDtransportDB from "../model/parcelANDtransport.js";
import BikeParcel_Order from "../model/BikeParcel_Order.js";




export const parcelandtransportFCMtoken = async (req, res) => {
  try {
    const number = req.parcelandtransport.id
    const { fcmToken } = req.body;
    console.log('number :', number)

    if (!fcmToken) {
      return res.status(400).json({ success: false });

    }

    await parcelANDtransportDB.updateMany({ _id: number }, {
      fcmToken: fcmToken
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

export const updatePartnerDetails = async (req, res) => {
  try {
    const {
      vehicalNO,
      vehicalName,
      serviceType,
      latitude,
      longitude,
      phoneNumber,
      city,
    } = req.body;

    const partnerId = req.parcelandtransport.id; // From JWT middleware

    const updatedPartner = await parcelANDtransportDB.findByIdAndUpdate(
      partnerId,
      {
          Number: phoneNumber,
        city,
        vehicalNO,
        vehicalName,
        serviceType,
        currentLocation: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)], // MongoDB uses [lng, lat]
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPartner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      partner: updatedPartner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const parceldashboard = async (req, res, next) => {
  try {
    const id = req.parcelandtransport.id
    const parcel = await parcelANDtransportDB.findById(id)

    res.status(201).json({
      isOnline: parcel.isOnline,
      id: parcel._id,
      kocartAmount: parcel.kocartAmount,
      activate: parcel.activate,
    })

  } catch (error) {
    res.json(error)
  }
}

export const parcelBoyIsOnline = async (req, res) => {
  try {
    const id = req.parcelandtransport.id
    console.log(id, req.body)
    const admin = await parcelANDtransportDB.findById(id)
    // const post = await post_model.findOne({ author: admin._id })

    admin.isOnline = !admin.isOnline;
    await admin.save();
    console.log(admin._id, admin.isOnline)

    res.json({ success: true })

  } catch (error) {
    res.json({ message: error })
  }
}


export const getNearbyPendingOrders = async (req, res) => {
  try {
    const partner = await parcelANDtransportDB.findById(req.parcelandtransport.id);

    if (partner.isAvailable === false || partner.isOnline === false ) {
      return res.json({ success: false })
    }

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const orders = await BikeParcel_Order.find({
      status: "pending",
      serviceType: "bike_parcel",
      "pickup.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: partner.currentLocation.coordinates,
          },
          $maxDistance: 5000, // 5 km
        },
      },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


