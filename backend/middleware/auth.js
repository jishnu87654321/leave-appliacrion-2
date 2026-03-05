const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("./errorHandler");
const { canonicalRole } = require("../utils/roles");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header or cookie
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError("Not authenticated. Please login.", 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key_here_change_in_production");
    } catch (err) {
      if (err.name === "TokenExpiredError") return next(new AppError("Session expired. Please login again.", 401));
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
    process.env.JWT_SECRET || "your_super_secret_jwt_key_here_change_in_production",
    { expiresIn }
  );
};

/**
 * Optional auth — attaches user if token present, doesn't block
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key_here_change_in_production");
      req.user = await User.findById(decoded.id || decoded.userId);
    }
    next();
  } catch {
    next();
  }
};

// Aliases for projects that expect these names.
exports.requireAuth = exports.protect;
