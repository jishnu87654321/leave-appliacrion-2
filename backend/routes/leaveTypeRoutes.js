const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const {
  getAllLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} = require("../controllers/leaveTypeController");

router.use(protect);

router.get("/", getAllLeaveTypes);
router.get("/:id", getLeaveTypeById);

// Managers and HR can manage leave types
router.use(restrictTo("HR_ADMIN", "MANAGER"));
router.post("/", createLeaveType);
router.put("/:id", updateLeaveType);
router.delete("/:id", deleteLeaveType);

module.exports = router;
