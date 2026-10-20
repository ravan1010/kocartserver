
import BusDriver from "../model/busDriver.js";

export const busdriverFCMtoken = async (req, res) => {
  try {
    const id = req.busDriver.id
    const { fcmToken } = req.body;
    console.log(typeof fcmToken, 'id :', id)

    if (!fcmToken) {
      return res.status(400).json({ success: false });
    }

    await BusDriver.findByIdAndUpdate(id, {
      fcmToken,
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

export const updateBusDriverLocation = async (req, res) => {
  try {
    // Change this to the driver ID provided by your auth middleware.
    const driverId = req.busDriver?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized bus driver",
      });
    }

    const { latitude, longitude, accuracy, heading, speed, recordedAt } =
      req.body;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const driver = await BusDriver.findByIdAndUpdate(
      driverId,
      {
        $set: {
          currentLocation: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          locationAccuracy: Number.isFinite(accuracy) ? accuracy : null,
          locationHeading: Number.isFinite(heading) ? heading : null,
          locationSpeed: Number.isFinite(speed) ? speed : null,
          locationUpdatedAt: new Date(),

        },
      },
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Bus driver not found",
      });
    }

    return res.json({
      success: true,
      message: "Location updated",
      location: {
        latitude,
        longitude,
        updatedAt: driver.locationUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Bus driver location error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update location",
    });
  }
};
