const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    driverEmail: { type: String, index: true },
    driverName: String,
    vehicleModel: String,
    vehicleNumber: String,
    from: { type: String, default: "" },
    fromLat: Number,
    fromLng: Number,
    destination: String,
    destLat: Number,
    destLng: Number,
    seats: Number,
    time: String,
    fare: Number,
    status: { type: String, default: "active", index: true },
    requests: [
      {
        email: String,
        name: String,
        pickupLocation: String,
        status: { type: String, default: "pending" },
      },
    ],
    distanceKm: { type: Number, default: 0 },
    co2SavedKg: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RideSchema.index({ status: 1, createdAt: -1 });
RideSchema.index({ destLat: 1, destLng: 1, status: 1 });
RideSchema.index({ "requests.email": 1, status: 1 });

module.exports = mongoose.model("Ride", RideSchema, "rides");
