const canonicalRole = (role) => {
  const normalized = String(role || "").trim().toUpperCase();
  if (normalized === "ADMIN" || normalized === "HR" || normalized === "HR_ADMIN" || normalized === "HR MANAGER" || normalized === "HR_MANAGER") {
    return "HR_ADMIN";
  }
  if (normalized === "MANAGER" || normalized === "DEPT_MANAGER") return "MANAGER";
  if (normalized === "INTERN") return "INTERN";
  return "EMPLOYEE";
};

const normalizeRoleForDb = (role) => {
  const c = canonicalRole(role);
  if (c === "INTERN") return "intern";
  if (c === "EMPLOYEE") return "employee";
  if (c === "MANAGER") return "manager";
  // Keep HR/admin canonical DB value stable for current system
  return "hr_admin";
};

const displayRoleLabel = (role) => {
  const c = canonicalRole(role);
  if (c === "HR_ADMIN") return "HR Admin";
  if (c === "MANAGER") return "Manager";
  if (c === "INTERN") return "Interns";
  return "Employee";
};

const roleMatches = (userRole, allowedRoles = []) => {
  const canonicalUserRole = canonicalRole(userRole);
  const allowedCanonical = allowedRoles.map(canonicalRole);
  return allowedCanonical.includes(canonicalUserRole);
};

module.exports = {
  canonicalRole,
  normalizeRoleForDb,
  displayRoleLabel,
  roleMatches,
};
