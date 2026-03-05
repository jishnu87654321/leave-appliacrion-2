#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const reportPath = path.join(rootDir, "qa", "report.json");
const backendRequire = createRequire(path.join(backendDir, "package.json"));
const dotenv = backendRequire("dotenv");
const mongoose = backendRequire("mongoose");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(backendDir, ".env") });

if (!process.env.MONGODB_URI_TEST) {
  console.error("MONGODB_URI_TEST is required. Refusing to run QA on non-test DB.");
  process.exit(1);
}

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
process.env.ENABLE_CRON = "false";
process.env.EMAIL_TRANSPORT_MODE = "test";

const { seedFixtures } = require("./seed.cjs");
const { creditMonthlyLeaves } = require(path.join(backendDir, "services", "monthlyCredit"));
const mailer = require(path.join(backendDir, "services", "mailer"));

const User = require(path.join(backendDir, "models", "User"));
const LeaveType = require(path.join(backendDir, "models", "LeaveType"));
const LeaveRequest = require(path.join(backendDir, "models", "LeaveRequest"));
const LeaveBalance = require(path.join(backendDir, "models", "LeaveBalance"));
const LeaveCreditLog = require(path.join(backendDir, "models", "LeaveCreditLog"));

const app = require(path.join(backendDir, "server"));

const report = {
  startedAt: new Date().toISOString(),
  passed: 0,
  failed: 0,
  skipped: 0,
  results: [],
  env: {
    apiBase: process.env.QA_API_BASE_URL || "http://localhost:5001",
    db: "TEST",
  },
};

let server = null;
let seeded = null;
let apiBase = process.env.QA_API_BASE_URL || "http://localhost:5001";
let leaveId = null;
let applyDates = null;
const tokens = {};
let transactionsSupported = true;

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function addResult(name, status, details) {
  report.results.push({ name, status, details });
  if (status === "PASS") {
    report.passed += 1;
    console.log(`[PASS] ${details}`);
  } else if (status === "SKIP") {
    report.skipped += 1;
    console.log(`[SKIP] ${details}`);
  } else {
    report.failed += 1;
    console.log(`[FAIL] ${details}`);
  }
}

async function runCheck(name, fn) {
  try {
    const details = await fn();
    addResult(name, "PASS", details || name);
  } catch (error) {
    addResult(name, "FAIL", `${name}: ${error.message || String(error)}`);
  }
}

async function runSkipAwareCheck(name, fn, skipReason) {
  if (!transactionsSupported) {
    addResult(name, "SKIP", skipReason);
    return;
  }
  await runCheck(name, fn);
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function findUpcomingWorkingRange() {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  while (end.getDay() === 0 || end.getDay() === 6) end.setDate(end.getDate() + 1);
  return { fromDate: start, toDate: end };
}

async function api(pathname, { method = "GET", token, body } = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = {};
  try {
    json = await response.json();
  } catch {
    // ignore non-json
  }
  return { status: response.status, body: json };
}

async function login(email, password) {
  const res = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assertCondition(res.status === 200, `Login failed for ${email}`);
  assertCondition(Boolean(res.body.token), `JWT missing for ${email}`);
  return res.body.token;
}

async function getBalance(userId, leaveTypeId) {
  const doc = await LeaveBalance.findOne({ userId, leaveTypeId }).lean();
  return doc ? doc.balance : 0;
}

async function startApiIfNeeded() {
  if (process.env.QA_API_BASE_URL) {
    apiBase = process.env.QA_API_BASE_URL;
    return;
  }
  const port = Number(process.env.QA_API_PORT || 5001);
  await new Promise((resolve) => {
    server = app.listen(port, () => resolve());
  });
  apiBase = `http://localhost:${port}`;
}

async function detectTransactionSupport() {
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    return Boolean(hello.setName || hello.msg === "isdbgrid");
  } catch {
    return false;
  }
}

async function run() {
  await startApiIfNeeded();
  report.env.apiBase = apiBase;

  seeded = await seedFixtures();
  transactionsSupported = await detectTransactionSupport();
  mailer.clearCapturedEmails();

  await runCheck("A) Policy verification", async () => {
    tokens.employeeA = await login("qa.employee.a@example.com", "Password@123");
    tokens.hr = await login("qa.hr@example.com", "Password@123");

    const res = await api("/api/leave-types?isActive=true", { token: tokens.employeeA });
    assertCondition(res.status === 200, "Leave types endpoint failed");

    const leaveTypes = res.body?.data?.leaveTypes || [];
    const earned = leaveTypes.find((x) => x.code === "EL");
    const sick = leaveTypes.find((x) => x.code === "SL");
    const casual = leaveTypes.find((x) => x.code === "CL");

    assertCondition(Boolean(earned), "Earned Leave not found");
    assertCondition(earned.yearlyTotal === 15 || Number(earned.accrualPerMonth) === 1.25, "Earned Leave accrual mismatch");
    assertCondition(Number(earned.carryForwardLimit) === 30, "Earned Leave carry-forward mismatch");
    assertCondition(Boolean(sick), "Sick Leave not found");
    assertCondition(sick.yearlyTotal === 12 || Number(sick.accrualPerMonth) === 1, "Sick Leave entitlement mismatch");
    assertCondition(!casual, "Casual Leave should not be active/selectable");

    const allTypes = await LeaveType.find({}).lean();
    const cl = allTypes.find((x) => x.code === "CL");
    if (cl) assertCondition(cl.isActive === false, "Casual Leave should be inactive");

    return "Earned Leave policy is 15/year and carry forward 30";
  });

  await runCheck("B) Apply leave without document", async () => {
    if (!tokens.employeeA) tokens.employeeA = await login("qa.employee.a@example.com", "Password@123");

    const { fromDate, toDate } = findUpcomingWorkingRange();
    applyDates = { fromDate: formatDate(fromDate), toDate: formatDate(toDate) };

    const res = await api("/api/leaves/apply", {
      method: "POST",
      token: tokens.employeeA,
      body: {
        leaveTypeId: String(seeded.leaveTypes.EL._id),
        fromDate: applyDates.fromDate,
        toDate: applyDates.toDate,
        reason: "QA validation leave request without document upload.",
      },
    });

    assertCondition(res.status === 201, `Expected 201, got ${res.status}`);
    leaveId = res.body?.data?.leaveRequest?._id;
    assertCondition(Boolean(leaveId), "Leave ID missing in response");

    const leave = await LeaveRequest.findById(leaveId).lean();
    assertCondition(Boolean(leave), "Leave not found in DB");
    assertCondition(leave.status === "PENDING", `Expected PENDING, got ${leave.status}`);
    assertCondition(!leave.attachmentUrl, "Document should be null/undefined");

    return "Leave application works without document";
  });

  await runCheck("C) Email notification", async () => {
    const start = Date.now();
    let emails = mailer.getCapturedEmails();
    while (emails.length < 2 && Date.now() - start < 6000) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      emails = mailer.getCapturedEmails();
    }

    const toList = emails.map((e) => String(e.to).toLowerCase());
    const managerEmails = toList.filter((x) => x === "qa.manager@example.com");
    const hrEmails = toList.filter((x) => x === "qa.hr@example.com");

    assertCondition(managerEmails.length >= 1, `Email to manager not triggered (expected 1, got ${managerEmails.length})`);
    assertCondition(hrEmails.length >= 1, `Email to HR not triggered (expected 1, got ${hrEmails.length})`);

    const payload = JSON.stringify(emails);
    assertCondition(payload.includes("QA Employee A"), "Employee name missing in email body");
    assertCondition(payload.includes(applyDates.fromDate), "Leave dates missing in email body");
    return "Leave apply triggered manager + HR emails";
  });

  await runSkipAwareCheck(
    "D) Manager approve",
    async () => {
    tokens.manager = await login("qa.manager@example.com", "Password@123");
    const res = await api(`/api/leaves/${leaveId}/approve`, {
      method: "PUT",
      token: tokens.manager,
      body: { comment: "Manager approval from QA runner" },
    });
    assertCondition(res.status === 200, `Manager approve failed with ${res.status}`);

    const leave = await LeaveRequest.findById(leaveId).lean();
    assertCondition(leave.status === "APPROVED", `Expected APPROVED, got ${leave.status}`);
    return "Manager approval endpoint updated status to APPROVED";
    },
    "Manager approval check skipped: MongoDB transactions unavailable in this test DB."
  );

  await runSkipAwareCheck(
    "E) HR override",
    async () => {
    if (!tokens.hr) tokens.hr = await login("qa.hr@example.com", "Password@123");
    const res = await api(`/api/leaves/${leaveId}/override`, {
      method: "PUT",
      token: tokens.hr,
      body: { status: "REJECTED", comment: "HR override from QA runner" },
    });
    assertCondition(res.status === 200, `HR override failed with ${res.status}`);

    const leave = await LeaveRequest.findById(leaveId).lean();
    assertCondition(leave.status === "REJECTED", `Expected REJECTED, got ${leave.status}`);
    assertCondition(Boolean(leave.hrOverride?.isOverridden), "hrOverride flag missing");
    assertCondition(Boolean(leave.hrOverride?.overriddenBy), "hrOverride user missing");
    assertCondition(Boolean(leave.hrOverride?.overriddenAt), "hrOverride timestamp missing");
    return "HR override changed final status with audit metadata";
    },
    "HR override check skipped: MongoDB transactions unavailable in this test DB."
  );

  await runSkipAwareCheck(
    "F) Monthly credit + idempotency",
    async () => {
    const runDate = seeded.month.firstDay;

    const beforeA = {
      el: await getBalance(seeded.users.employeeA._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.employeeA._id, seeded.leaveTypes.SL._id),
    };
    const beforeB = {
      el: await getBalance(seeded.users.employeeB._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.employeeB._id, seeded.leaveTypes.SL._id),
    };
    const beforeIntern = {
      el: await getBalance(seeded.users.intern._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.intern._id, seeded.leaveTypes.SL._id),
    };

    const run1 = await creditMonthlyLeaves({ runDate });
    const after1A = {
      el: await getBalance(seeded.users.employeeA._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.employeeA._id, seeded.leaveTypes.SL._id),
    };
    const after1B = {
      el: await getBalance(seeded.users.employeeB._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.employeeB._id, seeded.leaveTypes.SL._id),
    };
    const after1Intern = {
      el: await getBalance(seeded.users.intern._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.intern._id, seeded.leaveTypes.SL._id),
    };

    assertCondition(Number((after1A.el - beforeA.el).toFixed(2)) === 1.25, "EmployeeA EL monthly credit mismatch");
    assertCondition(Number((after1A.sl - beforeA.sl).toFixed(2)) === 1, "EmployeeA SL monthly credit mismatch");
    assertCondition(Number((after1Intern.el - beforeIntern.el).toFixed(2)) === 1, "Intern EL monthly credit mismatch");
    assertCondition(Number((after1Intern.sl - beforeIntern.sl).toFixed(2)) === 0, "Intern SL monthly credit mismatch");
    assertCondition(Number((after1B.el - beforeB.el).toFixed(2)) === 1, "EmployeeB EL join-after-15th rule mismatch");
    assertCondition(Number((after1B.sl - beforeB.sl).toFixed(2)) === 0, "EmployeeB SL join-after-15th rule mismatch");

    await creditMonthlyLeaves({ runDate });

    const after2A = {
      el: await getBalance(seeded.users.employeeA._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.employeeA._id, seeded.leaveTypes.SL._id),
    };
    const after2B = {
      el: await getBalance(seeded.users.employeeB._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.employeeB._id, seeded.leaveTypes.SL._id),
    };
    const after2Intern = {
      el: await getBalance(seeded.users.intern._id, seeded.leaveTypes.EL._id),
      sl: await getBalance(seeded.users.intern._id, seeded.leaveTypes.SL._id),
    };

    assertCondition(after2A.el === after1A.el && after2A.sl === after1A.sl, "EmployeeA changed on second run");
    assertCondition(after2B.el === after1B.el && after2B.sl === after1B.sl, "EmployeeB changed on second run");
    assertCondition(after2Intern.el === after1Intern.el && after2Intern.sl === after1Intern.sl, "Intern changed on second run");

    const logCount = await LeaveCreditLog.countDocuments({ month: run1.monthKey });
    assertCondition(logCount > 0, "LeaveCreditLog missing entries");

    return "Monthly credit applied once and remained idempotent on second run";
    },
    "Monthly credit check skipped: MongoDB transactions unavailable in this test DB."
  );

  await runCheck("G) Balance endpoint", async () => {
    if (!tokens.employeeB) tokens.employeeB = await login("qa.employee.b@example.com", "Password@123");
    if (!tokens.intern) tokens.intern = await login("qa.intern@example.com", "Password@123");

    const checks = [
      { token: tokens.employeeA, userId: seeded.users.employeeA._id, label: "EmployeeA" },
      { token: tokens.employeeB, userId: seeded.users.employeeB._id, label: "EmployeeB" },
      { token: tokens.intern, userId: seeded.users.intern._id, label: "Intern" },
    ];

    for (const c of checks) {
      const res = await api("/api/leaves/balance", { token: c.token });
      assertCondition(res.status === 200, `${c.label} balance API failed`);
      const balances = res.body?.data?.balances || [];
      const apiEL = balances.find((x) => x.leaveType?.code === "EL");
      const apiSL = balances.find((x) => x.leaveType?.code === "SL");
      assertCondition(Boolean(apiEL && apiSL), `${c.label} EL/SL missing from API`);

      const dbEL = await getBalance(c.userId, seeded.leaveTypes.EL._id);
      const dbSL = await getBalance(c.userId, seeded.leaveTypes.SL._id);
      assertCondition(Number(apiEL.balance) === Number(dbEL), `${c.label} EL mismatch API vs DB`);
      assertCondition(Number(apiSL.balance) === Number(dbSL), `${c.label} SL mismatch API vs DB`);
    }

    return "Balance API matches DB for employee and intern users";
  });

  await runCheck("H) Role access control (intern)", async () => {
    if (!tokens.intern) tokens.intern = await login("qa.intern@example.com", "Password@123");

    const managerRes = await api("/api/leaves/team/requests", { token: tokens.intern });
    assertCondition([401, 403].includes(managerRes.status), `Intern should be blocked from manager routes, got ${managerRes.status}`);

    const hrRes = await api("/api/admin/calendar", { token: tokens.intern });
    assertCondition([401, 403].includes(hrRes.status), `Intern should be blocked from admin/hr routes, got ${hrRes.status}`);

    const employeeRes = await api("/api/leaves/balance", { token: tokens.intern });
    assertCondition(employeeRes.status === 200, `Intern should access employee routes, got ${employeeRes.status}`);
    return "Intern access control works (blocked on privileged routes, allowed on employee routes)";
  });
}

async function cleanup() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

(async () => {
  try {
    await run();
  } catch (error) {
    addResult("Runner", "FAIL", `Runner failed unexpectedly: ${error.message || String(error)}`);
  } finally {
    report.endedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\nQA Summary");
    console.log(`Passed: ${report.passed}`);
    console.log(`Failed: ${report.failed}`);
    console.log(`Skipped: ${report.skipped}`);
    console.log(`Report: ${reportPath}`);

    await cleanup();
    process.exit(report.failed > 0 ? 1 : 0);
  }
})();
