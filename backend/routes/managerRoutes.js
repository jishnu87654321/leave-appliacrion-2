const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const {
  createManagerProfile,
  getAllManagers,
  getManagerById,
  getManagerByUserId,
  updateManagerProfile,
  getTeamMembers,
  syncTeamSize,
  updateMetrics,
  getManagerStats,
  deleteManagerProfile,
} = require("../controllers/managerController");

router.use(protect);

// Public routes (authenticated users)
router.get("/user/:userId", getManagerByUserId);
router.get("/:id/team", getTeamMembers);

// Manager and HR Admin routes
router.use(restrictTo("HR_ADMIN", "MANAGER"));

router.get("/", getAllManagers);
router.get("/stats/overview", getManagerStats);
router.get("/:id", getManagerById);
router.post("/:id/sync-team", syncTeamSize);
router.post("/:id/update-metrics", updateMetrics);

// HR Admin only routes
router.post("/", restrictTo("HR_ADMIN"), createManagerProfile);
router.put("/:id", restrictTo("HR_ADMIN"), updateManagerProfile);
router.delete("/:id", restrictTo("HR_ADMIN"), deleteManagerProfile);

module.exports = router;
