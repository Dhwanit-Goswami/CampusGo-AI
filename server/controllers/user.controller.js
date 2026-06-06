const User = require("../models/User");
const logger = require("../utils/logger");

exports.updateDriverStatus = async (req, res, next) => {
  const { email } = req.user;
  const { license, vehicleModel, vehicleNumber, agreed, upiId, qrPhoto } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      {
        isCampusDriver: true,
        driverDetails: {
          licenseNumber: license,
          vehicleModel,
          vehicleNumber,
          agreedToTerms: agreed,
          upiId,
          qrPhoto,
        },
      },
      { new: true }
    );
    res.json({ message: "Driver verified", isCampusDriver: true });
  } catch (err) {
    logger.error("Update Driver Status Error: %o", err);
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  const { email } = req.user;
  const { gender } = req.body;

  try {
    const user = await User.findOneAndUpdate({ email }, { gender }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    logger.error("Update Profile Error: %o", err);
    next(err);
  }
};

exports.getDriverProfile = async (req, res, next) => {
  const { email } = req.user;
  try {
    const user = await User.findOne({ email }).select("driverDetails");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.driverDetails || {});
  } catch (err) {
    logger.error("Get Driver Profile Error: %o", err);
    next(err);
  }
};

exports.toggleOnline = async (req, res, next) => {
  const { email } = req.user;
  const { status } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { isOnline: status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Driver Status Change: ${email} is now ${status ? "ONLINE" : "OFFLINE"}`);
    res.json({ message: "Sync Successful", isOnline: user.isOnline });
  } catch (err) {
    logger.error("Toggle Online Error: %o", err);
    next(err);
  }
};
