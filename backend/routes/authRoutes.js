const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { register, login, getMe, updatePassword, forgotPassword, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

// Public
router.post("/register", [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("department").notEmpty().withMessage("Department is required"),
], register);

router.post("/login", authLimiter, [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
], login);

router.post("/forgot-password", authLimiter, forgotPassword);

// Protected
router.use(protect);
router.get("/me", getMe);
router.put("/update-password", updatePassword);
router.post("/logout", logout);

module.exports = router;
