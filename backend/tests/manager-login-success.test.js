const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../models/User");
const AuditTrail = require("../models/AuditTrail");
const authController = require("../controllers/authController");

test("valid manager credentials -> login success with manager payload", async () => {
  const originalFindOne = User.findOne;
  const originalAudit = AuditTrail.log;

  const mockUser = {
    _id: "manager-1",
    name: "Jane Manager",
    email: "manager@example.com",
    role: "MANAGER",
    isActive: true,
    comparePassword: async (password) => password === "password123",
    save: async () => {},
    toObject() {
      return { _id: this._id, name: this.name, email: this.email, role: this.role };
    },
  };

  User.findOne = () => ({
    select: async () => mockUser,
  });
  AuditTrail.log = async () => {};

  const req = { body: { email: "manager@example.com", password: "password123" } };
  const res = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextError = null;
  const next = (err) => {
    nextError = err;
  };

  await authController.login(req, res, next);

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.role, "manager");
  assert.ok(res.body.token);

  User.findOne = originalFindOne;
  AuditTrail.log = originalAudit;
});
