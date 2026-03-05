const test = require("node:test");
const assert = require("node:assert/strict");

const { determineMonthlyAccrual } = require("../services/leaveAccrualService");

const CTX = { year: 2026, month: 3, timezone: "Asia/Kolkata" };

test("full-time employee gets EL 1.25 and SL 1 for regular month", () => {
  const user = { role: "EMPLOYEE", joinDate: "2025-01-10T00:00:00.000Z" };
  const el = determineMonthlyAccrual(user, "EL", CTX);
  const sl = determineMonthlyAccrual(user, "SL", CTX);
  assert.equal(el.amount, 1.25);
  assert.equal(sl.amount, 1);
});

test("intern gets EL 1 and SL 0", () => {
  const user = { role: "INTERN", joinDate: "2025-01-10T00:00:00.000Z" };
  const el = determineMonthlyAccrual(user, "EL", CTX);
  const sl = determineMonthlyAccrual(user, "SL", CTX);
  assert.equal(el.amount, 1);
  assert.equal(sl.amount, 0);
});

test("join after 15th in same month gets EL 1 and SL 0", () => {
  const user = { role: "EMPLOYEE", joinDate: "2026-03-20T00:00:00.000Z" };
  const el = determineMonthlyAccrual(user, "EL", CTX);
  const sl = determineMonthlyAccrual(user, "SL", CTX);
  assert.equal(el.amount, 1);
  assert.equal(sl.amount, 0);
});

test("intern join after 15th in same month also gets EL 1", () => {
  const user = { role: "INTERN", joinDate: "2026-03-20T00:00:00.000Z" };
  const el = determineMonthlyAccrual(user, "EL", CTX);
  assert.equal(el.amount, 1);
});

test("missing join date is skipped safely", () => {
  const user = { role: "EMPLOYEE" };
  const el = determineMonthlyAccrual(user, "EL", CTX);
  assert.equal(el.skip, true);
  assert.equal(el.reason, "MISSING_JOIN_DATE");
});
