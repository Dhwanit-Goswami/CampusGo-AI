const Ride = require("../models/Ride");
const User = require("../models/User");
const QuickRequest = require("../models/QuickRequest");
const logger = require("../utils/logger");

const disconnectTimers = new Map(); // email → NodeJS timer id

const socketHandlers = (socket, io) => {
  const userEmail = socket.user.email;
  socket.join(userEmail);
  logger.info(`Verified Socket Connected: ${userEmail}`);

  // Cancel any pending disconnect timer
  if (disconnectTimers.has(userEmail)) {
    clearTimeout(disconnectTimers.get(userEmail));
    disconnectTimers.delete(userEmail);
    logger.info(`${userEmail} reconnected — disconnect timer cancelled.`);

    // Notify peers that user is back
    (async () => {
      try {
        const rideAsP = await Ride.findOne({
          "requests.email": userEmail,
          status: { $in: ["active", "in_progress", "payment_pending"] },
        });
        if (rideAsP) {
          io.to(rideAsP.driverEmail).emit("peer_reconnected", {
            who: "passenger",
            email: userEmail,
          });
        }

        const rideAsD = await Ride.findOne({
          driverEmail: userEmail,
          status: { $in: ["active", "in_progress", "payment_pending"] },
        });
        if (rideAsD) {
          rideAsD.requests
            .filter((r) => ["accepted", "arrived"].includes(r.status))
            .forEach((r) => {
              io.to(r.email).emit("peer_reconnected", { who: "driver", email: userEmail });
            });
        }

        const qdAsP = await QuickRequest.findOne({
          passengerEmail: userEmail,
          status: { $in: ["accepted", "arrived", "in_progress", "payment_pending"] },
        });
        if (qdAsP) {
          io.to(qdAsP.driverEmail).emit("peer_reconnected", {
            who: "passenger",
            email: userEmail,
          });
        }

        const qdAsD = await QuickRequest.findOne({
          driverEmail: userEmail,
          status: { $in: ["accepted", "arrived", "in_progress", "payment_pending"] },
        });
        if (qdAsD) {
          io.to(qdAsD.passengerEmail).emit("peer_reconnected", {
            who: "driver",
            email: userEmail,
          });
        }
      } catch (e) {
        logger.error("Peer reconnection notify error: %o", e);
      }
    })();
  }

  // Driver reconnecting request current rides list
  socket.on("request_current_rides", async ({ driverEmail }) => {
    try {
      const ride = await Ride.findOne({ driverEmail, status: "active" });
      socket.emit("ride_requests_list", ride ? ride.requests : []);
    } catch (err) {
      socket.emit("ride_requests_list", []);
    }
  });

  // GPS telemetries updates
  socket.on("driver_location_update", async (data) => {
    try {
      const rides = await Ride.find({
        driverEmail: socket.user.email,
        status: { $in: ["active", "in_progress"] },
      });
      rides.forEach((ride) => {
        ride.requests.forEach((req) => {
          if (req.status === "accepted") {
            io.to(req.email).emit("driver_location", data);
          }
        });
      });

      const quickReqs = await QuickRequest.find({
        driverEmail: socket.user.email,
        status: { $in: ["accepted", "in_progress"] },
      });
      quickReqs.forEach((qr) => {
        io.to(qr.passengerEmail).emit("driver_location", data);
      });
    } catch (err) {
      logger.error("GPS telemetry forward error: %o", err);
    }
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    logger.info(`Socket Disconnected: ${userEmail}`);

    const GRACE_MS = 30000; // 30-sec grace window

    const timer = setTimeout(async () => {
      disconnectTimers.delete(userEmail);
      logger.info(`${userEmail} confirmed offline after grace period.`);

      try {
        // Driver left route share
        const rideAsDriver = await Ride.findOne({
          driverEmail: userEmail,
          status: { $in: ["active", "in_progress", "payment_pending"] },
        });
        if (rideAsDriver) {
          rideAsDriver.requests
            .filter((r) => ["accepted", "arrived", "paid"].includes(r.status))
            .forEach((r) => {
              io.to(r.email).emit("ride_cancelled", {
                message: "The driver has disconnected. The trip has been cancelled.",
              });
            });
          await Ride.updateMany(
            { driverEmail: userEmail, status: { $in: ["active", "in_progress", "payment_pending"] } },
            { status: "cancelled" }
          );
          await User.findOneAndUpdate({ email: userEmail }, { isOnline: false });
        }

        // Passenger left route share
        const rideAsPassenger = await Ride.findOne({
          "requests.email": userEmail,
          "requests.status": { $in: ["accepted", "arrived"] },
          status: { $in: ["active", "in_progress"] },
        });
        if (rideAsPassenger) {
          io.to(rideAsPassenger.driverEmail).emit("passenger_disconnected", {
            message: `A passenger has disconnected from your trajectory.`,
            passengerEmail: userEmail,
          });
        }

        // Passenger left quick drop
        const qdAsPassenger = await QuickRequest.findOne({
          passengerEmail: userEmail,
          status: { $in: ["pending", "accepted", "arrived", "in_progress", "payment_pending"] },
        });
        if (qdAsPassenger) {
          io.to(qdAsPassenger.driverEmail).emit("passenger_disconnected", {
            message: `Quick-drop passenger has disconnected.`,
            passengerEmail: userEmail,
            requestId: qdAsPassenger._id,
          });
          
          // Auto-cancel after 30s more if never returns
          setTimeout(async () => {
            const still = await QuickRequest.findOne({
              _id: qdAsPassenger._id,
              status: { $in: ["pending", "accepted"] },
            });
            if (still) {
              await QuickRequest.findByIdAndUpdate(qdAsPassenger._id, { status: "cancelled" });
              io.to(qdAsPassenger.driverEmail).emit("quick_drop_completed", {
                message: "Passenger did not return. Drop has been auto-cancelled.",
              });
            }
          }, 30000);
        }

        // Driver left quick drop
        const qdAsDriver = await QuickRequest.findOne({
          driverEmail: userEmail,
          status: { $in: ["accepted", "arrived", "in_progress", "payment_pending"] },
        });
        if (qdAsDriver) {
          io.to(qdAsDriver.passengerEmail).emit("ride_cancelled", {
            message: "The driver has disconnected. Your quick drop has been cancelled.",
          });
          await QuickRequest.findByIdAndUpdate(qdAsDriver._id, { status: "cancelled" });
        }
      } catch (err) {
        logger.error("Grace disconnect cleanup error: %o", err);
      }
    }, GRACE_MS);

    disconnectTimers.set(userEmail, timer);
  });
};

module.exports = socketHandlers;
