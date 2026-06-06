const Ride = require("../models/Ride");
const User = require("../models/User");
const QuickRequest = require("../models/QuickRequest");
const logger = require("../utils/logger");

const QUICK_DROP_FARE = 30;

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.searchRoutes = async (req, res, next) => {
  const { destination, lat, lng } = req.query;
  if (!destination && !lat) return res.json([]);

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const baseFilter = {
      status: "active",
      seats: { $gt: 0 },
      createdAt: { $gte: twelveHoursAgo },
    };

    if (lat && lng) {
      const pLat = parseFloat(lat);
      const pLng = parseFloat(lng);

      const rides = await Ride.find({
        ...baseFilter,
        destLat: { $exists: true, $ne: null },
        destLng: { $exists: true, $ne: null },
      }).sort({ time: 1 });

      const RADIUS_KM = 80;
      const nearby = rides.filter(
        (r) => haversine(pLat, pLng, r.destLat, r.destLng) <= RADIUS_KM
      );

      return res.json(nearby);
    }

    const rides = await Ride.find({
      ...baseFilter,
      destination: { $regex: destination, $options: "i" },
    }).sort({ time: 1 });

    res.json(rides);
  } catch (err) {
    logger.error("Search routes error: %o", err);
    next(err);
  }
};

exports.searchCampusDrivers = async (req, res, next) => {
  try {
    const activeDrivers = await User.find({
      isCampusDriver: true,
      isOnline: true,
    }).select("name email gender driverDetails");

    res.json(activeDrivers);
  } catch (err) {
    logger.error("Search campus drivers error: %o", err);
    next(err);
  }
};

exports.publishRoute = async (req, res, next) => {
  const { email: driverEmail, name: driverName } = req.user;
  const { from, destination, destLat, destLng, fromLat, fromLng, seats, time, fare } = req.body;

  if (!destination || parseInt(seats) <= 0 || parseFloat(fare) < 0) {
    return res.status(400).json({ message: "Invalid route details. Seats must be > 0 and fare >= 0." });
  }

  try {
    const driverUser = await User.findOne({ email: driverEmail });
    const vehicleModel = driverUser?.driverDetails?.vehicleModel || "Unknown";
    const vehicleNumber = driverUser?.driverDetails?.vehicleNumber || "Unknown";

    await Ride.updateMany(
      { driverEmail, status: "active" },
      { status: "cancelled" }
    );

    const newRide = new Ride({
      driverEmail,
      driverName,
      vehicleModel,
      vehicleNumber,
      from: from || "",
      fromLat: fromLat ? parseFloat(fromLat) : null,
      fromLng: fromLng ? parseFloat(fromLng) : null,
      destination,
      destLat,
      destLng,
      seats: parseInt(seats),
      time,
      fare: parseFloat(fare),
      status: "active",
    });

    await newRide.save();
    res.json({ message: "Route published successfully", rideId: newRide._id });
  } catch (err) {
    logger.error("Publish route error: %o", err);
    next(err);
  }
};

exports.cancelRoute = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findOne({
      driverEmail,
      status: { $in: ["active", "in_progress", "payment_pending"] },
    });

    if (ride) {
      ride.requests
        .filter((r) => ["accepted", "arrived", "paid"].includes(r.status))
        .forEach((r) => {
          io.to(r.email).emit("ride_cancelled", { message: "The driver has ended the trip." });
        });

      await Ride.updateMany(
        { driverEmail, status: { $in: ["active", "in_progress", "payment_pending"] } },
        { status: "cancelled" }
      );
    }

    res.json({ message: "Mission aborted and deleted successfully" });
  } catch (err) {
    logger.error("Cancel route error: %o", err);
    next(err);
  }
};

exports.completeRoute = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findOne({
      driverEmail,
      status: { $in: ["active", "in_progress", "payment_pending"] },
    });

    if (ride) {
      ride.requests
        .filter((r) => ["accepted", "arrived", "paid"].includes(r.status))
        .forEach((r) => {
          io.to(r.email).emit("ride_completed", { message: "The driver has completed the journey." });
        });

      await Ride.updateMany(
        { driverEmail, status: { $in: ["active", "in_progress", "payment_pending"] } },
        { status: "completed" }
      );
    }

    res.json({ message: "Journey completed and data cleared" });
  } catch (err) {
    logger.error("Complete route error: %o", err);
    next(err);
  }
};

exports.startRoute = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findOneAndUpdate(
      { driverEmail, status: "active" },
      { status: "in_progress" },
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: "No active trajectory found" });

    ride.requests
      .filter((r) => ["accepted", "arrived"].includes(r.status))
      .forEach((r) => {
        io.to(r.email).emit("ride_started", { message: "Trajectory in progress... Enjoy the ride!" });
      });
    res.json({ message: "Trajectory Started" });
  } catch (err) {
    logger.error("Start route error: %o", err);
    next(err);
  }
};

exports.arrivePassenger = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const { passengerEmail } = req.body;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findOneAndUpdate(
      { driverEmail, status: { $in: ["active", "in_progress"] }, "requests.email": passengerEmail },
      { $set: { "requests.$.status": "arrived" } },
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: "Ride or passenger not found" });

    io.to(passengerEmail).emit("driver_arrived", {
      message: "Driver has arrived at your pickup location! Please board the vehicle.",
    });

    io.to(driverEmail).emit("ride_requests_list", ride.requests);

    const acceptedCount = ride.requests.filter(
      (r) => ["accepted", "arrived", "paid"].includes(r.status)
    ).length;
    res.json({
      message: "Arrived",
      bookedSeats: acceptedCount,
      totalSeats: ride.seats + acceptedCount,
    });
  } catch (err) {
    logger.error("Arrive passenger error: %o", err);
    next(err);
  }
};

exports.requestRide = async (req, res, next) => {
  const { email: passengerEmail, name: passengerName } = req.user;
  const { rideId, pickupLocation } = req.body;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        $push: {
          requests: {
            email: passengerEmail,
            name: passengerName,
            pickupLocation,
            status: "pending",
          },
        },
      },
      { new: true }
    );

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    io.to(ride.driverEmail).emit("new_request", {
      passengerEmail,
      passengerName,
      pickupLocation,
      rideId,
    });

    res.json({ message: "Request sent" });
  } catch (err) {
    logger.error("Request ride error: %o", err);
    next(err);
  }
};

exports.acceptPassenger = async (req, res, next) => {
  const { email: driverEmail, name: driverName } = req.user;
  const { passengerEmail } = req.body;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findOneAndUpdate(
      {
        driverEmail,
        status: { $in: ["active", "in_progress"] },
        seats: { $gt: 0 },
        "requests.email": passengerEmail,
        "requests.status": "pending",
      },
      {
        $inc: { seats: -1 },
        $set: { "requests.$.status": "accepted" },
      },
      { new: true }
    );

    if (!ride) {
      const existingRide = await Ride.findOne({
        driverEmail,
        status: { $in: ["active", "in_progress"] },
      });
      if (!existingRide) return res.status(404).json({ message: "No active trajectory found" });
      if (existingRide.seats <= 0) return res.status(400).json({ message: "No seats available" });
      return res.status(400).json({ message: "Request already handled or not found" });
    }

    io.to(passengerEmail).emit("ride_accepted", {
      driverName,
      driverEmail,
      vehicleModel: ride.vehicleModel,
      vehicleNumber: ride.vehicleNumber,
      destination: ride.destination,
      destLat: ride.destLat,
      destLng: ride.destLng,
      fromLat: ride.fromLat,
      fromLng: ride.fromLng,
      message: "Your ride has been accepted!",
    });

    const acceptedCount = ride.requests.filter((r) => r.status === "accepted").length;
    res.json({
      message: "Linked",
      bookedSeats: acceptedCount,
      totalSeats: ride.seats + acceptedCount,
    });
  } catch (err) {
    logger.error("Accept passenger error: %o", err);
    next(err);
  }
};

exports.rejectPassenger = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const { passengerEmail } = req.body;
  const io = req.app.get("io");

  try {
    const ride = await Ride.findOne({
      driverEmail,
      status: { $in: ["active", "in_progress"] },
    });
    if (!ride) return res.status(404).json({ message: "No active trajectory found" });

    const requestIndex = ride.requests.findIndex(
      (r) => r.email === passengerEmail && r.status === "pending"
    );
    if (requestIndex === -1) {
      return res.status(400).json({ message: "Request not found or already handled" });
    }

    ride.requests.splice(requestIndex, 1);
    await ride.save();

    io.to(passengerEmail).emit("ride_rejected", {
      message: "Your request was declined by the driver. Please try another.",
    });

    res.json({ message: "Passenger request declined" });
  } catch (err) {
    logger.error("Reject passenger error: %o", err);
    next(err);
  }
};

exports.leaveRide = async (req, res, next) => {
  const { email: passengerEmail } = req.user;
  const { rideId } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.json({ message: "Ride already gone" });

    if (ride.status === "in_progress" || ride.status === "payment_pending") {
      return res
        .status(400)
        .json({ message: "Cannot leave during an active ride. Please settle payment first." });
    }

    const requestIndex = ride.requests.findIndex((r) => r.email === passengerEmail);
    if (requestIndex !== -1) {
      if (ride.requests[requestIndex].status === "accepted") {
        ride.seats += 1;
      }
      ride.requests.splice(requestIndex, 1);
      await ride.save();
    }

    res.json({ message: "Left successfully" });
  } catch (err) {
    logger.error("Leave ride error: %o", err);
    next(err);
  }
};

exports.getActiveMission = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  try {
    const ride = await Ride.findOne({
      driverEmail,
      status: { $in: ["active", "in_progress", "payment_pending"] },
    });
    if (!ride) return res.json({ active: false });
    res.json({
      active: true,
      status: ride.status,
      destination: ride.destination,
      destLat: ride.destLat,
      destLng: ride.destLng,
      seats: ride.seats,
      fare: ride.fare,
      time: ride.time,
      totalSeats:
        ride.seats +
        ride.requests.filter((r) => ["accepted", "paid"].includes(r.status)).length,
      bookedSeats: ride.requests.filter((r) => ["accepted", "paid"].includes(r.status)).length,
      requests: ride.requests,
    });
  } catch (err) {
    logger.error("Get active mission error: %o", err);
    next(err);
  }
};

exports.myRideStatus = async (req, res, next) => {
  const { email: passengerEmail } = req.user;
  const { rideId } = req.query;
  try {
    const ride = await Ride.findById(rideId).catch(() => null);
    if (ride) {
      const myReq = ride.requests.find((r) => r.email === passengerEmail);
      if (!myReq) return res.json({ status: "not_found" });

      let effectiveStatus = myReq.status;
      if (ride.status === "payment_pending" && ["accepted", "arrived"].includes(myReq.status)) {
        effectiveStatus = "payment_pending";
      }

      const driver = await User.findOne({ email: ride.driverEmail });
      return res.json({
        status: effectiveStatus,
        rideType: "route_share",
        driverName: ride.driverName,
        driverEmail: ride.driverEmail,
        destination: ride.destination,
        destLat: ride.destLat,
        destLng: ride.destLng,
        fromLat: ride.fromLat,
        fromLng: ride.fromLng,
        vehicleModel: ride.vehicleModel,
        vehicleNumber: ride.vehicleNumber,
        fare: ride.fare,
        upiId: driver?.driverDetails?.upiId,
        qrPhoto: driver?.driverDetails?.qrPhoto,
      });
    }

    const quickReq = await QuickRequest.findById(rideId).catch(() => null);
    if (quickReq && quickReq.passengerEmail === passengerEmail) {
      const terminalStatuses = ["completed", "rejected"];
      if (terminalStatuses.includes(quickReq.status)) {
        return res.json({ status: "driver_ended", rideType: "quick_drop" });
      }
      const driver = await User.findOne({ email: quickReq.driverEmail });
      return res.json({
        status: quickReq.status,
        rideType: "quick_drop",
        driverName: quickReq.driverName || (driver ? driver.name : "Driver"),
        driverEmail: quickReq.driverEmail,
        destination: (quickReq.pickup || "Campus") + " → " + (quickReq.drop || "Campus"),
        fare: quickReq.fare || 0,
        upiId: driver?.driverDetails?.upiId,
        qrPhoto: driver?.driverDetails?.qrPhoto,
      });
    }

    return res.json({ status: "driver_ended" });
  } catch (err) {
    logger.error("My ride status error: %o", err);
    next(err);
  }
};

exports.myTrips = async (req, res, next) => {
  const { email } = req.user;
  try {
    const driverRides = await Ride.find({ driverEmail: email })
      .select("destination fare time createdAt status")
      .lean();

    const passengerRides = await Ride.find({
      "requests.email": email,
      "requests.status": { $in: ["accepted", "arrived", "paid"] },
    })
      .select("destination fare time driverName createdAt status")
      .lean();

    const qdDriver = await QuickRequest.find({ driverEmail: email })
      .select("pickup drop createdAt status passengerName fare")
      .lean();

    const qdPassenger = await QuickRequest.find({ passengerEmail: email })
      .select("pickup drop createdAt status driverName fare")
      .lean();

    const driverFormatted = driverRides.map((r) => ({ ...r, role: "driver" }));
    const passengerFormatted = passengerRides.map((r) => ({ ...r, role: "passenger" }));

    const qdDriverFormatted = qdDriver.map((r) => ({
      ...r,
      role: "driver",
      destination: (r.pickup || "Campus") + " → " + (r.drop || "Campus"),
      fare: r.fare || 0,
      time: "Quick Drop",
    }));

    const qdPassengerFormatted = qdPassenger.map((r) => ({
      ...r,
      role: "passenger",
      destination: (r.pickup || "Campus") + " → " + (r.drop || "Campus"),
      fare: r.fare || QUICK_DROP_FARE,
      time: "Quick Drop",
    }));

    const all = [
      ...driverFormatted,
      ...passengerFormatted,
      ...qdDriverFormatted,
      ...qdPassengerFormatted,
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);

    res.json(all);
  } catch (err) {
    logger.error("My trips error: %o", err);
    next(err);
  }
};
