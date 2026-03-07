const { AppError } = require("./errorHandler");

const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

const now = () => Date.now();

const cleanup = () => {
  const current = now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= current) cache.delete(key);
  }
};

setInterval(cleanup, 60 * 1000).unref();

const withIdempotency = (operationName) => async (req, res, next) => {
  try {
    const userId = String(req.user?._id || "anon");
    const key = `${operationName}:${userId}:${req.idempotencyKey || ""}`;
    const entry = cache.get(key);
    if (entry && entry.expiresAt > now()) {
      return next(new AppError("Duplicate request blocked by idempotency policy.", 409));
    }
    cache.set(key, { expiresAt: now() + TTL_MS });
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { withIdempotency };

