const express = require("express");
const router = express.Router();
const rideController = require("../controllers/ride.controller");
const { auth } = require("../middleware/auth");
const { requestLimiter } = require("../middleware/rateLimiter");

// Public routes
router.get("/search-routes", rideController.searchRoutes);
router.get("/search-campus-drivers", rideController.searchCampusDrivers);

// Protected routes
router.post("/publish-route", auth, rideController.publishRoute);
router.post("/cancel-route", auth, rideController.cancelRoute);
router.post("/complete-route", auth, rideController.completeRoute);
router.post("/start-route", auth, rideController.startRoute);
router.post("/arrive-passenger", auth, rideController.arrivePassenger);
router.post("/request-ride", auth, requestLimiter, rideController.requestRide);
router.post("/accept-passenger", auth, rideController.acceptPassenger);
router.post("/reject-passenger", auth, rideController.rejectPassenger);
router.post("/leave-ride", auth, rideController.leaveRide);
router.get("/get-active-mission", auth, rideController.getActiveMission);
router.get("/my-ride-status", auth, rideController.myRideStatus);
router.get("/my-trips", auth, rideController.myTrips);

module.exports = router;
