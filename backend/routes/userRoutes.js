const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo, isSelfOrPrivileged } = require("../middleware/roleCheck");
const {
  createUser,
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
router.get("/:id/balances", isSelfOrPrivileged(), getUserLeaveBalances);

// Manager and HR Admin routes
router.use(restrictTo("HR_ADMIN", "MANAGER"));

router.get("/", getAllUsers);
router.get("/:id", isSelfOrPrivileged(), getUserById);

// HR-only mutations
router.post("/", restrictTo("HR_ADMIN"), createUser);
router.put("/:id", restrictTo("HR_ADMIN"), updateUser);
router.delete("/:id", restrictTo("HR_ADMIN"), deleteUser);
router.patch("/:id/activate", restrictTo("HR_ADMIN"), activateUser);
router.patch("/:id/deactivate", restrictTo("HR_ADMIN"), deactivateUser);
router.patch("/:id/assign-manager", restrictTo("HR_ADMIN"), assignManager);
router.patch("/:id/leave-balance", restrictTo("HR_ADMIN"), updateLeaveBalance);

// HR Admin only routes
router.post("/process-accrual", restrictTo("HR_ADMIN"), processMonthlyAccrual);

module.exports = router;
