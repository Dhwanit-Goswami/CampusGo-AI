const User = require("../models/User");
const Ride = require("../models/Ride");
const Earning = require("../models/Earning");
const logger = require("../utils/logger");

exports.getCarbonMetrics = async (req, res, next) => {
  const { email } = req.user;
  try {
    const user = await User.findOne({ email }).select("carbonStats");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Aggregate campus-wide statistics
    const allUsersStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCo2Saved: { $sum: "$carbonStats.co2SavedKg" },
          totalFuelSaved: { $sum: "$carbonStats.fuelSavedLitres" },
          totalDistanceShared: { $sum: "$carbonStats.distanceSharedKm" },
        },
      },
    ]);

    const campusStats = allUsersStats[0] || {
      totalCo2Saved: 0,
      totalFuelSaved: 0,
      totalDistanceShared: 0,
    };

    res.json({
      personal: {
        co2SavedKg: user.carbonStats?.co2SavedKg || 0,
        fuelSavedLitres: user.carbonStats?.fuelSavedLitres || 0,
        distanceSharedKm: user.carbonStats?.distanceSharedKm || 0,
      },
      campus: {
        co2SavedKg: campusStats.totalCo2Saved,
        fuelSavedLitres: campusStats.totalFuelSaved,
        distanceSharedKm: campusStats.totalDistanceShared,
      },
    });
  } catch (err) {
    logger.error("Get carbon metrics error: %o", err);
    next(err);
  }
};

exports.getDashboardAnalytics = async (req, res, next) => {
  const { email } = req.user;
  try {
    // Counts of trips for this user
    const rideCount = await Earning.countDocuments({
      $or: [{ driverEmail: email }, { passengerEmail: email }],
    });

    const user = await User.findOne({ email }).select("rewardPoints rideStreak");

    // Fetch monthly earnings history (past 6 months) for driver
    const earningsByMonth = await Earning.aggregate([
      { $match: { driverEmail: email } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$fare" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Format monthly earnings for charts
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = earningsByMonth.map((item) => ({
      month: monthNames[item._id - 1],
      earnings: item.total,
    }));

    res.json({
      stats: {
        totalTrips: rideCount,
        rewardPoints: user?.rewardPoints || 0,
        streak: user?.rideStreak || 0,
      },
      earningsChart: chartData,
    });
  } catch (err) {
    logger.error("Get dashboard analytics error: %o", err);
    next(err);
  }
};
