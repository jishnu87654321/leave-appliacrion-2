const rateLimit = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";
const toInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.apiLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_MAX, 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
  // Disable API rate limiting for local/dev usage.
  skip: () => !isProduction,
});

exports.authLimiter = rateLimit({
  windowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.AUTH_RATE_LIMIT_MAX, 30),
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
  skipSuccessfulRequests: true,
  // Disable auth rate limiting for local/dev usage.
  skip: () => !isProduction,
});

exports.reportLimiter = rateLimit({
  windowMs: toInt(process.env.REPORT_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
  max: toInt(process.env.REPORT_RATE_LIMIT_MAX, 120),
  message: { success: false, message: "Too many report requests. Please try again in an hour." },
  skip: () => !isProduction,
});
