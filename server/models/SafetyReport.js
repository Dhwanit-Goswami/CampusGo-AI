const mongoose = require("mongoose");

const SafetyReportSchema = new mongoose.Schema(
  {
    reporterEmail: { type: String, required: true },
    reportedEmail: String,
    rideId: String,
    type: {
      type: String,
      enum: ["harassment", "unsafe_driving", "route_deviation", "other"],
      required: true,
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SafetyReport", SafetyReportSchema, "safety_reports");
