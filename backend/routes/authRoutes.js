const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { register, login, getMe, updatePassword, forgotPassword, resetPassword, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const emailValidator = body("email").custom((value) => /^[^\s@]+@[^\s@]+$/.test(String(value || "").trim())).withMessage("Valid email is required");

// Public
router.post("/register", [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  emailValidator,
  body("password")
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must include an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must include a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must include a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must include a special character"),
  body("department").notEmpty().withMessage("Department is required"),
], register);

router.post("/login", authLimiter, [
  emailValidator,
  body("password").notEmpty().withMessage("Password is required"),
], login);

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

// Protected
router.use(protect);
router.get("/me", getMe);
router.put("/update-password", updatePassword);
router.post("/logout", logout);

module.exports = router;
