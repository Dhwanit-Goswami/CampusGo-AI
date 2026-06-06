const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token. Please log in again." });
  }
};

const emergencyAuth = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthenticated." });
  }
  
  // Fetch admin emails from env config if needed
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  
  if (req.user.role === "admin" || adminEmails.includes(req.user.email.toLowerCase())) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access required." });
  }
};

module.exports = { auth, emergencyAuth, adminAuth };
