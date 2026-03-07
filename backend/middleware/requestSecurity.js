const { AppError } = require("./errorHandler");

const stripDangerousKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripDangerousKeys);
  }
  if (value && typeof value === "object") {
    const clean = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = stripDangerousKeys(nested);
    }
    return clean;
  }
  return value;
};

const mongoSanitize = (req, res, next) => {
  req.body = stripDangerousKeys(req.body);
  req.query = stripDangerousKeys(req.query);
  req.params = stripDangerousKeys(req.params);
  return next();
};

const enforceJsonBodySize = (maxBytes = 1024 * 1024) => (req, res, next) => {
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > maxBytes) {
    return next(new AppError("Request payload too large.", 413));
  }
  return next();
};

const requireIdempotencyKey = (req, res, next) => {
  const key = String(req.headers["x-idempotency-key"] || "").trim();
  if (!key || key.length < 12 || key.length > 128) {
    return next(new AppError("Valid x-idempotency-key header is required.", 400));
  }
  req.idempotencyKey = key;
  return next();
};

module.exports = {
  mongoSanitize,
  enforceJsonBodySize,
  requireIdempotencyKey,
};

