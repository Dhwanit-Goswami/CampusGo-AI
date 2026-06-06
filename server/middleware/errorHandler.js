const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "An unexpected server error occurred",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
