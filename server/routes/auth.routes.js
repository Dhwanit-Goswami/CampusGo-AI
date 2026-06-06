const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimiter");
const { registerValidation, loginValidation } = require("../middleware/validator");

router.post("/signup", authLimiter, registerValidation, authController.signup);
router.post("/login", authLimiter, loginValidation, authController.login);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

module.exports = router;
