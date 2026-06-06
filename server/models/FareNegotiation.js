const mongoose = require("mongoose");

const FareNegotiationSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    driverEmail: String,
    passengerEmail: String,
    proposedFare: Number,
    counterFare: { type: Number, default: null },
    status: {
      type: String,
      enum: ["pending_passenger", "countered", "accepted", "rejected"],
      default: "pending_passenger",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "FareNegotiation",
  FareNegotiationSchema,
  "fare_negotiations"
);
