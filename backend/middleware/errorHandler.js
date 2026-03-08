const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists. Please use a different value.`, 409);
};
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map(e => e.message).join(". ");
  return new AppError(`Validation failed: ${messages}`, 400);
};
const handleJWTError = () => new AppError("Invalid token. Please login again.", 401);
const handleJWTExpired = () => new AppError("Token expired. Please login again.", 401);

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err, message: err.message };

  if (err.name === "CastError") error = handleCastError(error);
  if (err.code === 11000) error = handleDuplicateKey(error);
  if (err.name === "ValidationError") error = handleValidationError(error);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpired();

  if (process.env.NODE_ENV === "production") {
    // 1. Generic message for unexpected errors
    if (!error.isOperational) {
      logger.error("UNEXPECTED ERROR:", err);
      return res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
    // 2. Operational error (safe to show to user but no stack trace)
    return res.status(error.statusCode).json({ success: false, status: error.status, message: error.message });
  }

  // Development environment (show detailed error)
  logger.error(err);
  return res.status(error.statusCode).json({ success: false, status: error.status, message: error.message, stack: err.stack, error: err });

  res.status(error.statusCode).json({ success: false, status: error.status, message: error.message });
};

module.exports = { AppError, globalErrorHandler };
