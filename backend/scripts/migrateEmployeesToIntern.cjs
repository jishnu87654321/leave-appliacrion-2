require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("../models/User");

function parseEmailsArg() {
  const arg = process.argv.find((a) => a.startsWith("--emails="));
  if (!arg) return [];
  return arg
    .replace("--emails=", "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function run() {
  const apply = process.argv.includes("--apply");
  const emails = parseEmailsArg();
  const onlyByDesignation = process.argv.includes("--designation");

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  const query = {
    role: { $in: ["employee", "EMPLOYEE"] },
    $or: [],
  };

  if (emails.length) {
    query.$or.push({ email: { $in: emails } });
  }
  if (onlyByDesignation || !emails.length) {
    query.$or.push({ designation: /intern/i });
  }
  if (query.$or.length === 0) delete query.$or;

  const candidates = await User.find(query).select("name email role designation");
  console.log(`Found ${candidates.length} employee user(s) eligible for intern migration.`);
  candidates.forEach((u) => console.log(`- ${u.email} (${u.designation || "no designation"})`));

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to persist changes.");
    await mongoose.disconnect();
    return;
  }

  const result = await User.updateMany(
    { _id: { $in: candidates.map((u) => u._id) } },
    { $set: { role: "intern" } }
  );

  console.log(`Updated ${result.modifiedCount} user(s) to role=intern.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Migration failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
