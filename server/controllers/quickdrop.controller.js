const QuickRequest = require("../models/QuickRequest");
const User = require("../models/User");
const logger = require("../utils/logger");

exports.requestQuickDrop = async (req, res, next) => {
  const { email: passengerEmail, name: passengerName } = req.user;
  const { driverEmail, pickup, drop } = req.body;
  const io = req.app.get("io");

  try {
    const driverUser = await User.findOne({ email: driverEmail });
    const driverName = driverUser ? driverUser.name : "Driver";

    const newReq = new QuickRequest({
      passengerEmail,
      passengerName,
      driverEmail,
      driverName,
      pickup,
      drop,
    });
    await newReq.save();

    io.to(driverEmail).emit("new_quick_request", {
      requestId: newReq._id,
      passengerEmail,
      passengerName,
      pickup,
      drop,
    });

    res.json({ message: "Request sent", requestId: newReq._id });
  } catch (err) {
    logger.error("Request quick drop error: %o", err);
    next(err);
  }
};

exports.acceptQuickDrop = async (req, res, next) => {
  const { email: driverEmail, name: driverName } = req.user;
  const { requestId, fare } = req.body;
  const io = req.app.get("io");

  let fareValue = parseFloat(fare);
  if (isNaN(fareValue) || fareValue < 0 || fareValue > 50) {
    return res.status(400).json({ message: "Fare must be between ₹0 and ₹50" });
  }

  try {
    const quickReq = await QuickRequest.findByIdAndUpdate(
      requestId,
      { status: "accepted", fare: fareValue },
      { new: true }
    );

    if (!quickReq) return res.status(404).json({ message: "Request not found" });

    const driverUser = await User.findOne({ email: driverEmail });
    io.to(quickReq.passengerEmail).emit("quick_drop_accepted", {
      driverName,
      driverEmail,
      fare: quickReq.fare,
      vehicleModel: driverUser?.driverDetails?.vehicleModel || "Vehicle",
      vehicleNumber: driverUser?.driverDetails?.vehicleNumber || "Unknown Plate",
      message: "Your quick drop was accepted!",
    });

    res.json({ message: "Accepted" });
  } catch (err) {
    logger.error("Accept quick drop error: %o", err);
    next(err);
  }
};

exports.startQuickDrop = async (req, res, next) => {
  const { requestId } = req.body;
  const io = req.app.get("io");

  try {
    const quickReq = await QuickRequest.findByIdAndUpdate(
      requestId,
      { status: "in_progress" },
      { new: true }
    );
    if (!quickReq) return res.status(404).json({ message: "Request not found" });

    io.to(quickReq.passengerEmail).emit("quick_drop_started", {
      message: "Driver has arrived and drop has started.",
    });
    res.json({ message: "Started" });
  } catch (err) {
    logger.error("Start quick drop error: %o", err);
    next(err);
  }
};

exports.arriveQuickDrop = async (req, res, next) => {
  const { requestId } = req.body;
  const io = req.app.get("io");

  try {
    const quickReq = await QuickRequest.findByIdAndUpdate(
      requestId,
      { status: "arrived" },
      { new: true }
    );
    if (!quickReq) return res.status(404).json({ message: "Request not found" });

    io.to(quickReq.passengerEmail).emit("quick_drop_arrived", {
      message: "Driver has arrived at your location! Please board.",
    });
    res.json({ message: "Arrived" });
  } catch (err) {
    logger.error("Arrive quick drop error: %o", err);
    next(err);
  }
};

exports.completeQuickDrop = async (req, res, next) => {
  const { name: driverName } = req.user;
  const { requestId } = req.body;
  const io = req.app.get("io");

  try {
    const quickReq = await QuickRequest.findByIdAndUpdate(
      requestId,
      { status: "completed" },
      { new: true }
    );
    if (!quickReq) return res.status(404).json({ message: "Request not found" });

    io.to(quickReq.passengerEmail).emit("quick_drop_completed", {
      driverName,
      message: "Your drop has been completed! Thank you for using Campus Vehicle.",
    });

    res.json({ message: "Drop completed" });
  } catch (err) {
    logger.error("Complete quick drop error: %o", err);
    next(err);
  }
};

exports.rejectQuickDrop = async (req, res, next) => {
  const { requestId } = req.body;
  const io = req.app.get("io");

  try {
    const quickReq = await QuickRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true }
    );
    if (!quickReq) return res.status(404).json({ message: "Request not found" });

    io.to(quickReq.passengerEmail).emit("quick_drop_rejected", {
      message: "Your quick drop was declined. Please try another driver.",
    });

    res.json({ message: "Request rejected" });
  } catch (err) {
    logger.error("Reject quick drop error: %o", err);
    next(err);
  }
};
