const rateLimit = require("express-rate-limit");
const { logSecurityEvent, SECURITY_EVENTS } = require("../services/securityEventService");

const toInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const onLimitReached = (req, res) => {
  logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_TRIGGERED, {
    path: req.originalUrl,
    ip: req.ip,
    method: req.method,
  });
  res.status(429).json({ success: false, message: "Too many requests. Please try again shortly." });
};

exports.apiLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_MAX, 1000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached,
  skip: (req) => req.path.startsWith("/auth"),
});

exports.authLimiter = rateLimit({
  windowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
  max: toInt(process.env.AUTH_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req, res);
  },
  keyGenerator: (req) => `${req.ip}:${String(req.body?.email || "").toLowerCase()}`,
  skipSuccessfulRequests: true,
});

exports.reportLimiter = rateLimit({
  windowMs: toInt(process.env.REPORT_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
  max: toInt(process.env.REPORT_RATE_LIMIT_MAX, 60),
  handler: (req, res) => {
    onLimitReached(req, res);
  },
});
