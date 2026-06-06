const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ride_count", "revenue", "carbon", "demand"],
      required: true,
      index: true,
    },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    period: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", AnalyticsSchema, "analytics");
