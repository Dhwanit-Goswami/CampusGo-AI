const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["ride", "payment", "safety", "reward", "system"],
      default: "system",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema, "notifications");
