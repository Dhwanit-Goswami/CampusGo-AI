const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const transporter = require("../config/email");
const logger = require("../utils/logger");

exports.signup = async (req, res, next) => {
  const { name, email, password, gender } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      gender,
      isCampusDriver: false,
    });
    await user.save();
    res.status(201).send("User registered successfully");
  } catch (err) {
    logger.error("Signup Error: %o", err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { email: user.email, name: user.name, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      name: user.name,
      email: user.email,
      gender: user.gender,
      isCampusDriver: user.isCampusDriver,
    });
  } catch (err) {
    logger.error("Login Error: %o", err);
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "If that email is registered, an OTP will be sent.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: `"BROSKI Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "BROSKI - Password Reset OTP",
      text: `Your password reset OTP is: ${otp}\n\nIt is valid for 10 minutes. Do not share this code with anyone.`,
    });

    res.json({ message: "OTP sent to your email." });
  } catch (err) {
    logger.error("Forgot Password Error: %o", err);
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    logger.error("Reset Password Error: %o", err);
    next(err);
  }
};
