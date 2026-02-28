require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cron = require("node-cron");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { globalErrorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const { slowRequestLogger } = require("./utils/performance");

// Route imports
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Services
const { processMonthlyAccrual, resetYearlyBalances } = require("./services/leaveBalanceService");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

// Request Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan("dev"));
}

// Rate Limiting
app.use("/api/", apiLimiter);

// Compression
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Leave Management System');
  next();
});

// Performance monitoring
app.use(slowRequestLogger(2000)); // Log requests taking more than 2 seconds

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/reports", reportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(globalErrorHandler);

// ── CRON JOBS ──────────────────────────────────────────────────
// Only run cron jobs in production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
  // Monthly leave accrual — runs on 1st of every month at midnight
  cron.schedule("0 0 1 * *", async () => {
    console.log("⏰ Running monthly leave accrual...");
    try {
      await processMonthlyAccrual();
      console.log("✅ Monthly accrual completed");
    } catch (err) {
      console.error("❌ Monthly accrual failed:", err.message);
    }
  });

  // Yearly reset — runs on Jan 1st at midnight
  cron.schedule("0 0 1 1 *", async () => {
    console.log("⏰ Running yearly leave reset...");
    try {
      await resetYearlyBalances();
      console.log("✅ Yearly reset completed");
    } catch (err) {
      console.error("❌ Yearly reset failed:", err.message);
    }
  });
  
  console.log("⏰ Cron jobs enabled");
}

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
  console.log('Ready to accept requests!\n');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
