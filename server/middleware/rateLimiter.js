const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // increased max limit a bit to be more dev-friendly but still secure
  message: { message: "Too many attempts from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const requestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 10,
  message: { message: "Too many requests from this IP, please try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, requestLimiter };
