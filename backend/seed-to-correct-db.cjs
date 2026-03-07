require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    // Build the exact same URI as the server uses
    let mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management";
    
    console.log("Original URI:", mongoURI);
    
    // Append database name if URL ends with /
    if (mongoURI.endsWith('/')) {
      mongoURI = mongoURI + 'leave_management';
      console.log("Modified URI:", mongoURI);
    }
    
    await mongoose.connect(mongoURI);
    console.log(`\n✅ Connected to database: ${mongoose.connection.name}\n`);

    // Clear all collections
    console.log("🗑️  Clearing all data...\n");
    
    const collections = ['users', 'leavetypes', 'leaverequests', 'notifications', 'audittrails'];
    for (const collName of collections) {
      try {
        await mongoose.connection.db.collection(collName).deleteMany({});
        console.log(`   Cleared ${collName}`);
      } catch (err) {
        console.log(`   ${collName} doesn't exist yet`);
      }
    }

    console.log("\n📝 Creating fresh data...\n");

    // Create HR Admin
    const hrAdminPassword = await bcrypt.hash("admin123", 10);
    const hrAdmin = await mongoose.connection.db.collection("users").insertOne({
      name: "HR Administrator",
      email: "Subramanya@aksharaenterprises.info",
      password: hrAdminPassword,
      role: "HR_ADMIN",
      department: "Human Resources",
      designation: "HR Manager",
      phone: "+1-555-0100",
      avatar: "HA",
      joinDate: new Date("2024-01-01"),
      probationStatus: false,
      probationEndDate: null,
      leaveBalances: [],
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Created HR Admin (Subramanya@aksharaenterprises.info)");

    // Create John Manager
    const johnPassword = await bcrypt.hash("admin123", 10);
    const johnManager = await mongoose.connection.db.collection("users").insertOne({
      name: "John Manager",
      email: "johnmanager@gmail.com",
      password: johnPassword,
      role: "MANAGER",
      department: "Engineering",
      designation: "Engineering Manager",
      phone: "+1-555-0101",
      avatar: "JM",
      joinDate: new Date("2024-01-15"),
      probationStatus: false,
      probationEndDate: null,
      leaveBalances: [],
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Created John Manager (johnmanager@gmail.com)");

    // Create Leave Types
    const leaveTypes = [
      {
        name: "Casual Leave",
        code: "CL",
        color: "#3B82F6",
        description: "Short-term leave for personal matters",
        accrualRate: 12,
        accrualType: "YEARLY",
        maxCarryForward: 5,
        isActive: true,
        requiresApproval: true,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Sick Leave",
        code: "SL",
        color: "#EF4444",
        description: "Leave for medical reasons",
        accrualRate: 10,
        accrualType: "YEARLY",
        maxCarryForward: 3,
        isActive: true,
        requiresApproval: true,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Earned Leave",
        code: "EL",
        color: "#10B981",
        description: "Earned leave for long service",
        accrualRate: 15,
        accrualType: "YEARLY",
        maxCarryForward: 10,
        isActive: true,
        requiresApproval: true,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Work From Home",
        code: "WFH",
        color: "#8B5CF6",
        description: "Remote work arrangement",
        accrualRate: 24,
        accrualType: "YEARLY",
        maxCarryForward: 0,
        isActive: true,
        requiresApproval: true,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Maternity Leave",
        code: "ML",
        color: "#EC4899",
        description: "Leave for maternity purposes",
        accrualRate: 180,
        accrualType: "YEARLY",
        maxCarryForward: 0,
        isActive: true,
        requiresApproval: true,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Paternity Leave",
        code: "PL",
        color: "#06B6D4",
        description: "Leave for paternity purposes",
        accrualRate: 15,
        accrualType: "YEARLY",
        maxCarryForward: 0,
        isActive: true,
        requiresApproval: true,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertedLeaveTypes = await mongoose.connection.db.collection("leavetypes").insertMany(leaveTypes);
    console.log(`✅ Created ${leaveTypes.length} leave types`);

    // Initialize leave balances for both users
    const leaveTypeIds = Object.values(insertedLeaveTypes.insertedIds);
    
    const hrBalances = leaveTypeIds.map((leaveTypeId, index) => ({
      leaveTypeId: leaveTypeId,
      balance: leaveTypes[index].accrualRate,
      used: 0,
      pending: 0,
    }));

    const johnBalances = leaveTypeIds.map((leaveTypeId, index) => ({
      leaveTypeId: leaveTypeId,
      balance: leaveTypes[index].accrualRate,
      used: 0,
      pending: 0,
    }));

    await mongoose.connection.db.collection("users").updateOne(
      { _id: hrAdmin.insertedId },
      { $set: { leaveBalances: hrBalances } }
    );

    await mongoose.connection.db.collection("users").updateOne(
      { _id: johnManager.insertedId },
      { $set: { leaveBalances: johnBalances } }
    );

    console.log("✅ Initialized leave balances for both users");

    // Verify
    const userCount = await mongoose.connection.db.collection("users").countDocuments();
    const leaveTypeCount = await mongoose.connection.db.collection("leavetypes").countDocuments();

    console.log("\n" + "=".repeat(60));
    console.log("✅ DATABASE SEEDED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\n📊 Database: ${mongoose.connection.name}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Leave Types: ${leaveTypeCount}`);

    console.log("\n🔐 Login Credentials:");
    console.log("\n   HR Admin:");
    console.log("   Email: Subramanya@aksharaenterprises.info");
    console.log("   Password: admin123");
    console.log("   Role: HR_ADMIN");

    console.log("\n   Manager:");
    console.log("   Email: johnmanager@gmail.com");
    console.log("   Password: admin123");
    console.log("   Role: MANAGER");

    console.log("\n✅ Ready to use!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedDatabase();
