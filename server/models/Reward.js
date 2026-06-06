const mongoose = require("mongoose");

const RewardSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["ride_complete", "streak", "eco", "referral"],
      required: true,
    },
    points: { type: Number, default: 0 },
    badge: String,
    description: String,
  },
  { timestamps: true }
);

RewardSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Reward", RewardSchema, "rewards");
