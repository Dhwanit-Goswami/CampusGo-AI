const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { auth, adminAuth } = require("../middleware/auth");

router.get("/users", auth, adminAuth, adminController.getAllUsers);
router.get("/trips", auth, adminAuth, adminController.getAllTrips);
router.get("/reports", auth, adminAuth, adminController.getSafetyReports);
router.post("/report/status", auth, adminAuth, adminController.updateReportStatus);

module.exports = router;
