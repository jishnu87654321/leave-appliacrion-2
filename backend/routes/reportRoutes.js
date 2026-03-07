const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const { reportLimiter } = require("../middleware/rateLimiter");
const {
  employeeReport,
  departmentReport,
  monthlyReport,
  exportCSV,
  getAuditTrail,
} = require("../controllers/reportController");

router.use(protect);
router.use(restrictTo("HR_ADMIN", "MANAGER"));
router.use(reportLimiter);

router.get("/employee", employeeReport);
router.get("/department", departmentReport);
router.get("/monthly", monthlyReport);
router.get("/export", exportCSV);
router.get("/audit-trail", getAuditTrail); // Managers can now access audit trail

module.exports = router;
