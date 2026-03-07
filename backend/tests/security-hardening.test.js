const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const { isOwnerOrAdmin } = require("../middleware/roleCheck");
const { mongoSanitize } = require("../middleware/requestSecurity");
const { withIdempotency } = require("../middleware/idempotencyStore");
const {
  getRequiredJwtSecret,
  sanitizeFileName,
  hasMatchingMagicBytes,
  redactPII,
  validateOutboundUrl,
} = require("../config/security");

test("A01 PoC/Fix: manager cannot access unrelated user resource (IDOR blocked)", async () => {
  const middleware = isOwnerOrAdmin("id");
  const req = {
    user: { _id: "manager-1", role: "MANAGER" },
    params: { id: "employee-2" },
    body: {},
    query: {},
  };
  let err;
  middleware(req, {}, (nextErr) => {
    err = nextErr;
  });
  assert.ok(err);
  assert.equal(err.statusCode, 403);
});

test("A02 PoC/Fix: weak JWT secret is rejected", async () => {
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "weak-secret";
  assert.throws(() => getRequiredJwtSecret(), /at least 32 bytes/i);
  process.env.JWT_SECRET = original;
});

test("A02/A07 PoC/Fix: JWT 'none' algorithm is blocked", async () => {
  const token = jwt.sign({ id: "u1" }, "", { algorithm: "none" });
  assert.throws(() => {
    jwt.verify(token, "not-used", { algorithms: ["HS256"] });
  });
});

test("A03 PoC/Fix: NoSQL operators are removed from request body", async () => {
  const req = {
    body: { email: "user@x.com", $where: "sleep(10000)", nested: { "a.b": "x", ok: 1 } },
    query: { role: { $ne: "hr_admin" } },
    params: {},
  };
  mongoSanitize(req, {}, () => {});
  assert.equal(req.body.$where, undefined);
  assert.equal(req.body.nested["a.b"], undefined);
  assert.equal(req.query.role.$ne, undefined);
});

test("A04 PoC/Fix: duplicate request replay is blocked by idempotency middleware", async () => {
  const middleware = withIdempotency("apply_leave");
  const req = { user: { _id: "u1" }, idempotencyKey: "idem-1234567890" };
  let firstErr;
  await middleware(req, {}, (err) => {
    firstErr = err;
  });
  assert.equal(firstErr, undefined);

  let secondErr;
  await middleware(req, {}, (err) => {
    secondErr = err;
  });
  assert.ok(secondErr);
  assert.equal(secondErr.statusCode, 409);
});

test("A08 PoC/Fix: uploaded file magic bytes must match declared MIME type", async () => {
  const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ header
  assert.equal(hasMatchingMagicBytes(fakeExe, "application/pdf"), false);
  const sanitized = sanitizeFileName("../../evil.exe");
  assert.equal(sanitized.includes("/"), false);
  assert.equal(sanitized.includes("\\"), false);
});

test("A09 PoC/Fix: PII is redacted in security logs", async () => {
  const input = "Contact alice@example.com or 9876543210";
  const redacted = redactPII(input);
  assert.equal(redacted.includes("alice@example.com"), false);
  assert.equal(redacted.includes("9876543210"), false);
});

test("A10 PoC/Fix: SSRF guard blocks localhost/private network URLs", async () => {
  await assert.rejects(() => validateOutboundUrl("http://127.0.0.1:8080/health"));
  await assert.rejects(() => validateOutboundUrl("http://localhost:8080/health"));
});
