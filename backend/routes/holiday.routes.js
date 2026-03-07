const express = require("express");
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roleCheck");
const { upsertHoliday, listHolidays, deleteHoliday } = require("../controllers/holiday.controller");

const router = express.Router();

router.use(protect);

router.get("/", restrictTo("EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN"), listHolidays);
router.post("/", restrictTo("HR_ADMIN"), upsertHoliday);
router.delete("/:date", restrictTo("HR_ADMIN"), deleteHoliday);

module.exports = router;

