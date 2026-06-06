const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { auth } = require("../middleware/auth");

router.get("/carbon", auth, analyticsController.getCarbonMetrics);
router.get("/dashboard", auth, analyticsController.getDashboardAnalytics);

module.exports = router;
