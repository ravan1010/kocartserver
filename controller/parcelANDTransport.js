import parcelANDtransportDB from "../model/parcelANDtransport.js";




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
      Number,
      city,
    } = req.body;

    const partnerId = req.parcelandtransport.id; // From JWT middleware

    const updatedPartner = await parcelANDtransportDB.findByIdAndUpdate(
      partnerId,
      {
        Number,
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