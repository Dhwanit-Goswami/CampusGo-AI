const User = require("../models/User");
const Reward = require("../models/Reward");
const logger = require("../utils/logger");

exports.getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.find({ rewardPoints: { $gt: 0 } })
      .select("name email rewardPoints rideStreak badges gender")
      .sort({ rewardPoints: -1 })
      .limit(20)
      .lean();

    res.json(leaderboard);
  } catch (err) {
    logger.error("Get leaderboard error: %o", err);
    next(err);
  }
};

exports.getUserRewards = async (req, res, next) => {
  const { email } = req.user;
  try {
    const user = await User.findOne({ email }).select("rewardPoints rideStreak badges");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      rewardPoints: user.rewardPoints || 0,
      rideStreak: user.rideStreak || 0,
      badges: user.badges || [],
    });
  } catch (err) {
    logger.error("Get user rewards error: %o", err);
    next(err);
  }
};

exports.getPointsLogs = async (req, res, next) => {
  const { email } = req.user;
  try {
    const logs = await Reward.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(logs);
  } catch (err) {
    logger.error("Get points logs error: %o", err);
    next(err);
  }
};
