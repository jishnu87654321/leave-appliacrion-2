const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  assignManager,
  updateLeaveBalance,
  getUserLeaveBalances,
  processMonthlyAccrual,
} = require("../controllers/userController");

router.use(protect);

// Public route for getting own balances
router.get("/:id/balances", getUserLeaveBalances);

// Manager and HR Admin routes
router.use(restrictTo("HR_ADMIN", "MANAGER"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/activate", activateUser);
router.patch("/:id/deactivate", deactivateUser);
router.patch("/:id/assign-manager", assignManager);
router.patch("/:id/leave-balance", updateLeaveBalance);

// HR Admin only routes
router.post("/process-accrual", restrictTo("HR_ADMIN"), processMonthlyAccrual);

module.exports = router;
