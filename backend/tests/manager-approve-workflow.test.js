const test = require("node:test");
const assert = require("node:assert/strict");

const { applyManagerApproval } = require("../services/approvalWorkflowService");

test("manager approves leave -> status updated and notifications planned", async () => {
  const leaveRequest = {
    status: "PENDING",
    currentApprovalLevel: 1,
    approvalHistory: [],
  };

  const actor = {
    _id: "manager-1",
    name: "Jane Manager",
    role: "MANAGER",
  };

  const result = applyManagerApproval(leaveRequest, actor, "Approved for coverage");

  assert.equal(result.leaveRequest.status, "APPROVED");
  assert.equal(result.leaveRequest.approvalHistory.length, 1);
  assert.equal(result.leaveRequest.approvalHistory[0].approverRole, "MANAGER");
  assert.deepEqual(result.notifications, ["EMPLOYEE_NOTIFICATION", "HR_EMAIL"]);
});
