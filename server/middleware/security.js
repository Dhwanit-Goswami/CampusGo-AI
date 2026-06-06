const helmet = require("helmet");
const cors = require("cors");

const configureSecurity = (app) => {
  // Use Helmet for basic security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://router.project-osrm.org", "https://nominatim.openstreetmap.org", "ws:", "wss:"],
        imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io", "https://unpkg.com"],
      }
    }
  }));

  // CORS settings
  const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",");
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };

  app.use(cors(corsOptions));
};

module.exports = configureSecurity;
