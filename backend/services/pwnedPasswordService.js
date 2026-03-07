const crypto = require("crypto");
const https = require("https");

const isPwnedCheckEnabled = () => process.env.ENABLE_PWNED_CHECK === "true";

const sha1 = (input) => crypto.createHash("sha1").update(String(input)).digest("hex").toUpperCase();

const requestRange = (prefix) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: "api.pwnedpasswords.com",
        path: `/range/${prefix}`,
        method: "GET",
        timeout: 5000,
        headers: { "Add-Padding": "true", "User-Agent": "leave-ms-security-check" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) return reject(new Error("HIBP range query failed"));
          resolve(data);
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("HIBP request timed out")));
    req.end();
  });

const isPasswordCompromised = async (password) => {
  if (!isPwnedCheckEnabled()) return false;
  const hash = sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const body = await requestRange(prefix);
  const lines = body.split("\n");
  return lines.some((line) => line.split(":")[0]?.trim() === suffix);
};

module.exports = { isPasswordCompromised };

