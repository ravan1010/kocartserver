import express from "express";
import { busdriverFCMtoken, updateBusDriverLocation } from "../controller/busdriver.js";
import { appBusDriver } from "../middleware/busDriver_auth.js"
import busDriver from "../model/busDriver.js";
const router = express.Router();

router.route('/app/busDriver/fcmToken').post(appBusDriver, busdriverFCMtoken)


router.post(
  "/app/busDriver/location",
  appBusDriver,
  updateBusDriverLocation
);


router.post("/save-driver-details", appBusDriver, async (req, res) => {
  try {
    const id = req.busDriver?.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Bus driver authentication required",
      });
    }

    const {
      driverName,
      phoneNumber,
      driverId,
      busNumber,
    } = req.body;

    if (!driverName || !phoneNumber || !driverId || !busNumber) {
      return res.status(400).json({
        success: false,
        message: "All driver details are required",
      });
    }

    // Check whether driverId already exists
    const existingDriver = await busDriver.findOne({
      driverId: driverId.trim(),
    });

    if (existingDriver) {
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Driver ID already exists. Not saved.",
      });
    }

    // Save only if driverId does not exist
    const driver = await busDriver.findByIdAndUpdate(
      id,
      {
        $set:
        {
          driverName: driverName.trim(),
          phoneNumber: String(phoneNumber).trim(),
          driverId: driverId.trim(),
          busNumber: busNumber.trim(),
        }
      },
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Bus driver not found",
      });
    }

    return res.status(201).json({
      success: true,
      saved: true,
      message: "Driver details saved successfully",
    });
  } catch (error) {
    // Handles duplicate driverId requests arriving simultaneously
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Driver ID already exists. Not saved.",
      });
    }

    console.error("Save driver details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save driver details",
    });
  }
});


router.get("/bus/profile", appBusDriver, async (req, res) => {
  try {
    const id = req.busDriver?.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Driver not authenticated",
      });
    }

    const driver = await busDriver.findById(id)
      .select(
        "driverName phoneNumber driverId busNumber"
      )
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("Get driver profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load driver profile",
    });
  }
});


// Search driver by driverId
router.get("/search", async (req, res) => {
  try {
    const driverId = req.query.driverId?.trim();

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required",
      });
    }

    const driver = await busDriver.findOne({
      driverId,
    })
      .select(
        "driverName phoneNumber driverId busNumber currentLocation"
      )
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver ID not found",
      });
    }

    return res.json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("Search driver error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search driver",
    });
  }
});

// Get driver details and latest location
router.get("/:driverId", async (req, res) => {
  try {
    const driver = await busDriver.findOne({
      driverId: req.params.driverId,
    })
      .select(
        "driverName phoneNumber driverId busNumber currentLocation"
      )
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("Get driver error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get driver details",
    });
  }
});

export default router;