const test = require("node:test");
const assert = require("node:assert/strict");

const { restrictTo } = require("../middleware/roleCheck");

test("non-manager tries manager route -> blocked with 403", async () => {
  const middleware = restrictTo("MANAGER");
  const req = { user: { _id: "u1", role: "EMPLOYEE" } };

  let nextError = null;
  middleware(req, {}, (err) => {
    nextError = err;
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
});
