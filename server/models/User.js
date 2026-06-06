const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    gender: String,
    role: { type: String, enum: ["user", "driver", "admin"], default: "user" },
    isCampusDriver: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    currentRideID: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null },
    resetOtp: String,
    resetOtpExpire: Date,
    refreshToken: String,
    driverDetails: {
      licenseNumber: String,
      vehicleModel: String,
      vehicleNumber: String,
      agreedToTerms: Boolean,
      upiId: String,
      qrPhoto: String,
    },
    emergencyContacts: [
      {
        name: String,
        phone: String,
        email: String,
      },
    ],
    rewardPoints: { type: Number, default: 0 },
    badges: [{ type: String }],
    rideStreak: { type: Number, default: 0 },
    lastRideDate: Date,
    carbonStats: {
      co2SavedKg: { type: Number, default: 0 },
      fuelSavedLitres: { type: Number, default: 0 },
      distanceSharedKm: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isCampusDriver: 1, isOnline: 1 });

module.exports = mongoose.model("User", UserSchema, "users");
