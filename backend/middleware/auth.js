const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("./errorHandler");
const { canonicalRole } = require("../utils/roles");
const { getRequiredJwtSecret, JWT_ALGORITHM } = require("../config/security");
const { logSecurityEvent, SECURITY_EVENTS } = require("../services/securityEventService");

const JWT_SECRET = getRequiredJwtSecret();

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.jwt;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      // CSRF Protection: Only allow cookies for GET/HEAD requests by default
      // to prevent state-changing actions via automatic cookie transmission.
      const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
      if (stateChangingMethods.includes(req.method)) {
        logSecurityEvent(SECURITY_EVENTS.AUTH_CSRF_BLOCK, { ip: req.ip, method: req.method });
        return next(new AppError("State-changing requests require an Authorization header for security.", 401));
      }
      token = cookieToken;
    }

    if (!token) {
      return next(new AppError("Not authenticated. Please login.", 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: process.env.JWT_ISSUER || "leave-ms-api",
        audience: process.env.JWT_AUDIENCE || "leave-ms-web",
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        logSecurityEvent(SECURITY_EVENTS.AUTH_TOKEN_EXPIRED, { ip: req.ip });
        return next(new AppError("Session expired. Please login again.", 401));
      }
      logSecurityEvent(SECURITY_EVENTS.AUTH_TOKEN_INVALID, { ip: req.ip });
      return next(new AppError("Invalid token. Please login again.", 401));
    }

    // Fetch user
    const tokenUserId = decoded.id || decoded.userId;
    const user = await User.findById(tokenUserId).select("+password");
    if (!user) return next(new AppError("User no longer exists.", 401));

    // Check if user is active
    if (!user.isActive) return next(new AppError("Your account has been deactivated. Contact HR.", 403));

    // Check if password changed after token issued
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return next(new AppError("Password was recently changed. Please login again.", 401));
    }

    user.role = canonicalRole(user.role);
    req.user = user;
    next();
  } catch (error) {
    next(new AppError("Authentication failed.", 401));
  }
};

/**
 * Generate JWT token
 */
exports.generateToken = (userId, expiresIn = "7d") => {
  const payload = typeof userId === "object" && userId !== null ? userId : { id: userId };
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn,
      algorithm: JWT_ALGORITHM,
      issuer: process.env.JWT_ISSUER || "leave-ms-api",
      audience: process.env.JWT_AUDIENCE || "leave-ms-web",
    }
  );
};

/**
 * Optional auth — attaches user if token present, doesn't block
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: process.env.JWT_ISSUER || "leave-ms-api",
        audience: process.env.JWT_AUDIENCE || "leave-ms-web",
      });
      req.user = await User.findById(decoded.id || decoded.userId);
    }
    next();
  } catch {
    next();
  }
};

// Aliases for projects that expect these names.
exports.requireAuth = exports.protect;
