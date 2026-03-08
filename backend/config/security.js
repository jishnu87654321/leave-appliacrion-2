const crypto = require("crypto");
const dns = require("dns").promises;
const net = require("net");

const JWT_MIN_SECRET_BYTES = 32;
const JWT_ALGORITHM = "HS256";

const isStrongJwtSecret = (secret) => {
  if (!secret || typeof secret !== "string") return false;
  return Buffer.byteLength(secret, "utf8") >= JWT_MIN_SECRET_BYTES;
};

const getRequiredJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!isStrongJwtSecret(secret)) {
    throw new Error(
      `JWT_SECRET must be set and at least ${JWT_MIN_SECRET_BYTES} bytes for production-safe signing`
    );
  }
  return secret;
};

const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === "production") {
    return ["https://leave-management-nine-navy.vercel.app"];
  }
  return String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeFileName = (name = "") =>
  String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);

const isAllowedMimeType = (mimeType = "") =>
  [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ].includes(String(mimeType).toLowerCase());

const MAGIC_BYTES = [
  { type: "application/pdf", signature: Buffer.from([0x25, 0x50, 0x44, 0x46]) },
  { type: "image/png", signature: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  { type: "image/jpeg", signature: Buffer.from([0xff, 0xd8, 0xff]) },
  { type: "image/webp", signature: Buffer.from([0x52, 0x49, 0x46, 0x46]) },
  { type: "text/plain", signature: null },
];

const hasMatchingMagicBytes = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
  const type = String(mimeType || "").toLowerCase();
  const match = MAGIC_BYTES.find((entry) => entry.type === type);
  if (!match) return true;
  if (!match.signature) return true;
  return buffer.subarray(0, match.signature.length).equals(match.signature);
};

const parseIp = (input = "") => {
  const raw = String(input).trim();
  if (!raw) return "";
  if (raw.includes(",")) return parseIp(raw.split(",")[0]);
  return raw.replace(/^::ffff:/, "");
};

const isPrivateIp = (ip = "") => {
  const candidate = parseIp(ip);
  if (!net.isIP(candidate)) return true;
  if (candidate === "127.0.0.1" || candidate === "::1") return true;
  if (candidate.startsWith("10.") || candidate.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(candidate)) return true;
  if (candidate.startsWith("169.254.")) return true;
  if (/^fc|^fd/i.test(candidate)) return true;
  return false;
};

const validateOutboundUrl = async (rawUrl, allowlist = []) => {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https protocols are allowed");
  }

  if (allowlist.length && !allowlist.includes(url.hostname)) {
    throw new Error("Hostname is not allowlisted");
  }

  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error("Unable to resolve hostname");
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error("Private or loopback IPs are blocked");
    }
  }
  return { hostname: url.hostname, protocol: url.protocol };
};

const redactPII = (value = "") =>
  String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/\b\d{10,16}\b/g, "[REDACTED_NUMBER]");

const hashForAudit = (payload) => crypto.createHash("sha256").update(String(payload)).digest("hex");

module.exports = {
  JWT_ALGORITHM,
  JWT_MIN_SECRET_BYTES,
  getRequiredJwtSecret,
  getAllowedOrigins,
  escapeRegex,
  sanitizeFileName,
  isAllowedMimeType,
  hasMatchingMagicBytes,
  isPrivateIp,
  validateOutboundUrl,
  redactPII,
  hashForAudit,
};

