const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const {
  getCalendarLeaveSummary,
  getCalendarLeavesByDate,
} = require("../controllers/calendarController");

router.use(protect);
router.use(restrictTo("EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN"));

router.get("/leaves", getCalendarLeaveSummary);
router.get("/leaves/:date", getCalendarLeavesByDate);

module.exports = router;

