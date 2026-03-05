require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cron = require("node-cron");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { globalErrorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const { slowRequestLogger } = require("./utils/performance");

const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const managerRoutes = require("./routes/managerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const calendarRoutes = require("./routes/calendarRoutes");

const { creditMonthlyLeaves } = require("./services/monthlyCredit");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/api/", apiLimiter);
app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "Leave Management System");
  next();
});
app.use(slowRequestLogger(2000));

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/calendar", calendarRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(globalErrorHandler);

function registerCronJobs() {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_CRON === "true") {
    cron.schedule(
      "0 0 1 * *",
      async () => {
        if (process.env.NODE_ENV !== "production") {
          console.log("Running monthly leave credit...");
        }
        try {
          await creditMonthlyLeaves({ source: "MONTHLY_JOB" });
          if (process.env.NODE_ENV !== "production") {
            console.log("Monthly credit completed");
          }
        } catch (err) {
          console.error("Monthly credit failed:", err.message);
        }
      },
      { timezone: process.env.ORG_TIMEZONE || "Asia/Kolkata" }
    );

    if (process.env.NODE_ENV !== "production") {
      console.log("Cron jobs enabled");
    }
  }
}

function startServer(port = PORT) {
  registerCronJobs();

  const server = app.listen(port, () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`API endpoint: http://localhost:${port}/api`);
      console.log(`Health check: http://localhost:${port}/health`);
    }
  });

  let isShuttingDown = false;
  const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n${signal} received. Shutting down gracefully...`);
    }

    const forceExit = setTimeout(() => {
      process.exit(1);
    }, 10000);

    try {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.connection.close();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Shutdown error:", err.message);
      }
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Uncaught Exception:", err);
    }
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });
  process.on("unhandledRejection", (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unhandled Rejection:", err);
    }
    gracefulShutdown("UNHANDLED_REJECTION");
  });

  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = app;
module.exports.startServer = startServer;
