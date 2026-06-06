require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const configureSecurity = require("./middleware/security");
const errorHandler = require("./middleware/errorHandler");
const socketHandlers = require("./services/socketHandlers");
const logger = require("./utils/logger");

const { emergencyAuth } = require("./middleware/auth");
const Ride = require("./models/Ride");
const User = require("./models/User");

// Import route modules
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const rideRoutes = require("./routes/ride.routes");
const quickdropRoutes = require("./routes/quickdrop.routes");
const paymentRoutes = require("./routes/payment.routes");
const safetyRoutes = require("./routes/safety.routes");
const rewardRoutes = require("./routes/reward.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// Database Connection
connectDB();

// Body Parser
app.use(express.json({ limit: "5mb" }));

// Security & CORS Config
configureSecurity(app);

// HTTP and Socket.io Servers Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Expose Socket.io instance to handlers via Express
app.set("io", io);

// Socket Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// Socket Events Connection
io.on("connection", (socket) => {
  socketHandlers(socket, io);
});

// Register routers directly to root for API compatibility
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", rideRoutes);
app.use("/", quickdropRoutes);
app.use("/", paymentRoutes);
app.use("/safety", safetyRoutes); // namespace group for safety
app.use("/rewards", rewardRoutes); // namespace group for gamification
app.use("/analytics", analyticsRoutes); // namespace group for carbon footprint analytics
app.use("/admin", adminRoutes); // namespace group for admin dashboard

// Emergency cleanup route (needs query param auth, mapped at root level)
app.post("/emergency-cleanup", emergencyAuth, async (req, res, next) => {
  const { email: driverEmail } = req.user;

  try {
    const ride = await Ride.findOne({
      driverEmail,
      status: { $in: ["active", "in_progress", "payment_pending"] },
    });
    if (ride) {
      ride.requests
        .filter((r) => ["accepted", "paid"].includes(r.status))
        .forEach((r) => {
          io.to(r.email).emit("ride_cancelled", { message: "The driver has disconnected." });
        });
    }

    await Ride.updateMany(
      { driverEmail, status: { $in: ["active", "in_progress", "payment_pending"] } },
      { status: "cancelled" }
    );
    await User.findOneAndUpdate({ email: driverEmail }, { isOnline: false });

    res.status(200).send("Cleanup successful");
  } catch (err) {
    logger.error("Emergency cleanup failed: %o", err);
    res.status(500).send("Cleanup failed");
  }
});

// Root check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "broski-backend", timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
