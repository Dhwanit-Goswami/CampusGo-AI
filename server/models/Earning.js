const mongoose = require("mongoose");

const EarningSchema = new mongoose.Schema(
  {
    driverEmail: { type: String, required: true, index: true },
    passengerEmail: String,
    rideType: { type: String, enum: ["route_share", "quick_drop"] },
    fare: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["cash", "upi"], default: "cash" },
    rideId: String,
  },
  { timestamps: true }
);

EarningSchema.index({ driverEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Earning", EarningSchema, "earnings");
