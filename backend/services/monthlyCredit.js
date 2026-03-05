const { creditMonthlyLeaves: creditFromAccrualService } = require("./leaveAccrualService");

async function creditMonthlyLeaves({ runDate = new Date(), dryRun = false, source = "MONTHLY_JOB" } = {}) {
  if (dryRun) {
    const monthKey = `${runDate.getFullYear()}-${String(runDate.getMonth() + 1).padStart(2, "0")}`;
    return {
      monthKey,
      dryRun: true,
      message: "Dry run requested. No leave balances were updated.",
    };
  }

  return creditFromAccrualService({ runDate, source });
}

module.exports = {
  creditMonthlyLeaves,
};
