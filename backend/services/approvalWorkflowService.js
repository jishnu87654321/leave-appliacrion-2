function applyManagerApproval(leaveRequest, actor, comment = "") {
  if (leaveRequest.status !== "PENDING") {
    throw new Error("Only pending requests can be approved.");
  }

  leaveRequest.status = "APPROVED";
  leaveRequest.approvalHistory.push({
    level: leaveRequest.currentApprovalLevel || 1,
    approverId: actor._id,
    approverName: actor.name,
    approverRole: actor.role,
    status: "APPROVED",
    comment: comment || "Approved",
    actionDate: new Date(),
  });

  return {
    leaveRequest,
    notifications: ["EMPLOYEE_NOTIFICATION", "HR_EMAIL"],
  };
}

module.exports = {
  applyManagerApproval,
};
