const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const {
  getCalendar,
  upsertCalendar,
  runMonthlyAccrual,
  createDepartmentChangeRequest,
  getDepartmentChangeRequests,
  confirmDepartmentChange,
  rejectDepartmentChange,
} = require("../controllers/adminController");

router.use(protect);

router.get("/calendar", restrictTo("HR_ADMIN", "MANAGER"), getCalendar);
router.post("/calendar", restrictTo("HR_ADMIN", "MANAGER"), upsertCalendar);
router.post("/run-monthly-accrual", restrictTo("HR_ADMIN"), runMonthlyAccrual);
router.post("/run-monthly-credit", restrictTo("HR_ADMIN"), runMonthlyAccrual);

router.get("/department-change-requests", restrictTo("HR_ADMIN", "MANAGER"), getDepartmentChangeRequests);
router.post("/department-change-requests", restrictTo("HR_ADMIN", "MANAGER"), createDepartmentChangeRequest);
router.patch("/department-change-requests/:id/confirm", restrictTo("HR_ADMIN"), confirmDepartmentChange);
router.patch("/department-change-requests/:id/reject", restrictTo("HR_ADMIN"), rejectDepartmentChange);

module.exports = router;
