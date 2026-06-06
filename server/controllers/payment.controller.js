const User = require("../models/User");
const Ride = require("../models/Ride");
const QuickRequest = require("../models/QuickRequest");
const Earning = require("../models/Earning");
const Reward = require("../models/Reward");
const logger = require("../utils/logger");

const PLATFORM_FEE_PERCENT = 10;

exports.requestPayment = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const io = req.app.get("io");

  try {
    const driver = await User.findOne({ email: driverEmail });
    const upiId = driver?.driverDetails?.upiId;
    const qrPhoto = driver?.driverDetails?.qrPhoto;

    const ride = await Ride.findOneAndUpdate(
      { driverEmail, status: "in_progress" },
      { status: "payment_pending" },
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: "Route not in progress" });

    ride.requests
      .filter((r) => ["accepted", "arrived"].includes(r.status))
      .forEach((r) => {
        io.to(r.email).emit("payment_requested", {
          fare: ride.fare,
          type: "route_share",
          upiId,
          qrPhoto,
        });
      });
    res.json({ message: "Payments requested" });
  } catch (err) {
    logger.error("Request payment error: %o", err);
    next(err);
  }
};

exports.requestQuickPayment = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  const { requestId } = req.body;
  const io = req.app.get("io");

  try {
    const driver = await User.findOne({ email: driverEmail });
    const upiId = driver?.driverDetails?.upiId;
    const qrPhoto = driver?.driverDetails?.qrPhoto;

    const quickReq = await QuickRequest.findByIdAndUpdate(
      requestId,
      { status: "payment_pending" },
      { new: true }
    );
    if (!quickReq) return res.status(404).json({ message: "Request not found" });

    io.to(quickReq.passengerEmail).emit("payment_requested", {
      fare: quickReq.fare || 0,
      type: "quick_drop",
      upiId,
      qrPhoto,
    });
    res.json({ message: "Payment requested" });
  } catch (err) {
    logger.error("Request quick payment error: %o", err);
    next(err);
  }
};

exports.passengerPaid = async (req, res, next) => {
  const { email: passengerEmail } = req.user;
  const { type, rideId, paymentMethod = "cash" } = req.body;
  const io = req.app.get("io");

  try {
    if (type === "quick_drop") {
      const qReq = await QuickRequest.findById(rideId);
      if (!qReq) return res.status(404).json({ message: "Request not found" });

      await Earning.create({
        driverEmail: qReq.driverEmail,
        passengerEmail,
        rideType: "quick_drop",
        fare: qReq.fare || 0,
        paymentMethod,
        rideId: rideId.toString(),
      });

      // Gamification: award points for completing ride
      await awardPoints(passengerEmail, 10, "eco", "Quick Drop carbon-saver passenger");
      await awardPoints(qReq.driverEmail, 15, "ride_complete", "Quick Drop driver service");

      io.to(qReq.driverEmail).emit("passenger_paid", {
        passengerEmail,
        type,
        requestId: rideId,
      });
      res.json({ message: "Marked paid" });
    } else {
      const ride = await Ride.findOneAndUpdate(
        { _id: rideId, status: "payment_pending", "requests.email": passengerEmail },
        { $set: { "requests.$.status": "paid" } }
      );
      if (!ride) return res.status(404).json({ message: "Ride or request not found" });

      await Earning.create({
        driverEmail: ride.driverEmail,
        passengerEmail,
        rideType: "route_share",
        fare: ride.fare || 0,
        paymentMethod,
        rideId: rideId.toString(),
      });

      // Gamification: award points
      await awardPoints(passengerEmail, 20, "eco", "Route Share carbon-saver passenger");
      await awardPoints(ride.driverEmail, 30, "ride_complete", "Route Share driver service");

      io.to(ride.driverEmail).emit("passenger_paid", { passengerEmail, type });
      res.json({ message: "Marked paid" });
    }
  } catch (err) {
    logger.error("Passenger paid error: %o", err);
    next(err);
  }
};

exports.myEarnings = async (req, res, next) => {
  const { email: driverEmail } = req.user;
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allEarnings = await Earning.find({ driverEmail })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const monthEarnings = allEarnings.filter(
      (e) => new Date(e.createdAt) >= startOfMonth
    );
    const totalMonthly = monthEarnings.reduce((s, e) => s + (e.fare || 0), 0);
    const platformFee = parseFloat(
      ((totalMonthly * PLATFORM_FEE_PERCENT) / 100).toFixed(2)
    );
    const netMonthly = parseFloat((totalMonthly - platformFee).toFixed(2));
    const totalAllTime = parseFloat(
      allEarnings.reduce((s, e) => s + (e.fare || 0), 0).toFixed(2)
    );

    res.json({
      earnings: allEarnings.slice(0, 30),
      totalMonthly: parseFloat(totalMonthly.toFixed(2)),
      platformFee,
      netMonthly,
      totalAllTime,
    });
  } catch (err) {
    logger.error("My earnings error: %o", err);
    next(err);
  }
};

// Internal Helper for gamification points
async function awardPoints(userEmail, points, type, description) {
  try {
    const user = await User.findOne({ email: userEmail });
    if (user) {
      user.rewardPoints = (user.rewardPoints || 0) + points;
      
      // Update streak
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (user.lastRideDate && user.lastRideDate.toDateString() === yesterday.toDateString()) {
        user.rideStreak = (user.rideStreak || 0) + 1;
      } else if (!user.lastRideDate || user.lastRideDate.toDateString() !== today.toDateString()) {
        user.rideStreak = 1;
      }
      user.lastRideDate = today;

      // Add badge triggers
      if (user.rewardPoints >= 50 && !user.badges.includes("Bronze Bro")) {
        user.badges.push("Bronze Bro");
      }
      if (user.rewardPoints >= 200 && !user.badges.includes("Silver Bro")) {
        user.badges.push("Silver Bro");
      }
      if (user.rideStreak >= 3 && !user.badges.includes("Streak Master")) {
        user.badges.push("Streak Master");
      }
      
      await user.save();

      // Log reward transaction
      await Reward.create({
        userEmail,
        type,
        points,
        description,
        badge: user.badges[user.badges.length - 1], // latest if newly earned
      });
    }
  } catch (err) {
    logger.error("Failed to award points: %o", err);
  }
}
