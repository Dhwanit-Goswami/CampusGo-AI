const User = require("../models/User");
const Ride = require("../models/Ride");
const SafetyReport = require("../models/SafetyReport");
const logger = require("../utils/logger");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("name email role isCampusDriver isOnline rewardPoints createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(users);
  } catch (err) {
    logger.error("Get all users error: %o", err);
    next(err);
  }
};

exports.getAllTrips = async (req, res, next) => {
  try {
    const trips = await Ride.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(trips);
  } catch (err) {
    logger.error("Get all trips error: %o", err);
    next(err);
  }
};

exports.getSafetyReports = async (req, res, next) => {
  try {
    const reports = await SafetyReport.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (err) {
    logger.error("Get safety reports error: %o", err);
    next(err);
  }
};

exports.updateReportStatus = async (req, res, next) => {
  const { reportId, status } = req.body; // "pending" | "reviewed" | "resolved"

  if (!["pending", "reviewed", "resolved"].includes(status)) {
    return res.status(400).json({ message: "Invalid report status" });
  }

  try {
    const report = await SafetyReport.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json({ message: "Safety report status updated successfully", report });
  } catch (err) {
    logger.error("Update report status error: %o", err);
    next(err);
  }
};
