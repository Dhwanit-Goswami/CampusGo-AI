const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { auth } = require("../middleware/auth");
const { profileUpdateValidation } = require("../middleware/validator");

router.post("/update-driver-status", auth, userController.updateDriverStatus);
router.post("/update-profile", auth, profileUpdateValidation, userController.updateProfile);
router.get("/get-driver-profile", auth, userController.getDriverProfile);
router.post("/toggle-online", auth, userController.toggleOnline);

module.exports = router;
