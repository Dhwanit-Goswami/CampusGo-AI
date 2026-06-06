const express = require("express");
const router = express.Router();
const safetyController = require("../controllers/safety.controller");
const { auth } = require("../middleware/auth");

router.post("/sos", auth, safetyController.triggerSOS);
router.post("/contacts", auth, safetyController.updateEmergencyContacts);
router.get("/qr/:rideId", auth, safetyController.generateRideQR);
router.post("/verify-qr", auth, safetyController.verifyRideQR);
router.post("/report", auth, safetyController.reportIncident);

module.exports = router;
