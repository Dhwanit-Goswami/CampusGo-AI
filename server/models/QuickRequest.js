const mongoose = require("mongoose");

const QuickRequestSchema = new mongoose.Schema(
  {
    passengerEmail: { type: String, index: true },
    passengerName: String,
    driverEmail: { type: String, index: true },
    driverName: String,
    pickup: String,
    drop: String,
    fare: { type: Number, default: 0 },
    status: { type: String, default: "pending", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuickRequest", QuickRequestSchema, "quick_requests");
