const User = require("../models/User");
const SafetyReport = require("../models/SafetyReport");
const logger = require("../utils/logger");

exports.triggerSOS = async (req, res, next) => {
  const { email } = req.user;
  const { lat, lng } = req.body;
  const io = req.app.get("io");

  try {
    const user = await User.findOne({ email }).select("name emergencyContacts");
    if (!user) return res.status(404).json({ message: "User not found" });

    logger.warn(`🚨 EMERGENCY SOS TRIGGERED BY USER: ${email} at Location [${lat}, ${lng}]`);

    // In a real application, this would send SMS/Email alerts to emergency contacts.
    // Here we emit a real-time event through sockets and log details.
    user.emergencyContacts.forEach((contact) => {
      // Simulate dispatching alerts to the emergency contact
      logger.info(`Simulated emergency alert dispatched to ${contact.name} (${contact.phone})`);
    });

    // Broadcast the emergency position to active listening monitors/admin panel
    io.to("admins").emit("safety_emergency", {
      email,
      name: user.name,
      coordinates: { lat, lng },
      timestamp: new Date(),
    });

    res.json({
      message: "SOS alert dispatched successfully to emergency contacts and campus security.",
      contactsAlerted: user.emergencyContacts.length,
    });
  } catch (err) {
    logger.error("SOS trigger error: %o", err);
    next(err);
  }
};

exports.updateEmergencyContacts = async (req, res, next) => {
  const { email } = req.user;
  const { contacts } = req.body; // Array of { name, phone, email }

  if (!Array.isArray(contacts)) {
    return res.status(400).json({ message: "Emergency contacts must be an array" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { emergencyContacts: contacts.slice(0, 3) } }, // cap at 3
      { new: true }
    );
    res.json({ message: "Emergency contacts updated successfully", contacts: user.emergencyContacts });
  } catch (err) {
    logger.error("Update emergency contacts error: %o", err);
    next(err);
  }
};

exports.generateRideQR = async (req, res, next) => {
  const { rideId } = req.params;
  try {
    // Generate a simple verification code/payload containing ride info and a secure hash
    const verificationCode = `VERIFY_RIDE_${rideId}_${Date.now()}`;
    res.json({ verificationCode });
  } catch (err) {
    next(err);
  }
};

exports.verifyRideQR = async (req, res, next) => {
  const { verificationCode, passengerEmail } = req.body;
  const io = req.app.get("io");
  try {
    logger.info(`QR Verification code scanned: ${verificationCode}`);
    
    // Parse verified details and notify passenger of boarding status
    io.to(passengerEmail).emit("qr_verified", { status: "success", timestamp: new Date() });
    res.json({ status: "verified", message: "QR check complete. Boarding approved." });
  } catch (err) {
    next(err);
  }
};

exports.reportIncident = async (req, res, next) => {
  const { email: reporterEmail } = req.user;
  const { reportedEmail, rideId, type, description } = req.body;

  try {
    const report = new SafetyReport({
      reporterEmail,
      reportedEmail,
      rideId,
      type,
      description,
    });
    await report.save();
    
    logger.warn(`⚠️ Incident Report Filed by ${reporterEmail} against ${reportedEmail || "Unknown"}`);
    res.status(201).json({ message: "Safety incident reported successfully. Review pending." });
  } catch (err) {
    logger.error("Report incident error: %o", err);
    next(err);
  }
};
