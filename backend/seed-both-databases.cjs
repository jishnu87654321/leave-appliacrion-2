require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seedDatabase(dbName) {
  try {
    // Get base URI and append database name correctly
    let mongoURI = process.env.MONGODB_URI;
    
    // For MongoDB Atlas URIs, the database name goes after the last /
    // Format: mongodb+srv://user:pass@cluster.mongodb.net/dbname
    if (!mongoURI.includes('?')) {
      // No query parameters, just append or replace database name
      if (mongoURI.endsWith('/')) {
        mongoURI = mongoURI + dbName;
      } else {
        // Check if there's already a database name
        const parts = mongoURI.split('/');
        if (parts.length > 3 && parts[parts.length - 1]) {
          // Replace existing database name
          parts[parts.length - 1] = dbName;
          mongoURI = parts.join('/');
        } else {
          mongoURI = mongoURI + '/' + dbName;
        }
      }
    } else {
      // Has query parameters, insert database name before ?
      const [base, query] = mongoURI.split('?');
      if (base.endsWith('/')) {
        mongoURI = base + dbName + '?' + query;
      } else {
        const parts = base.split('/');
        parts[parts.length - 1] = dbName;
        mongoURI = parts.join('/') + '?' + query;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Seeding database: ${dbName}`);
    console.log('='.repeat(60));
    
    await mongoose.connect(mongoURI);
    console.log(`✅ Connected to: ${mongoose.connection.name}\n`);

    // Clear all collections
    console.log("🗑️  Clearing all data...\n");
    
    const collections = ['users', 'leavetypes', 'leaverequests', 'notifications', 'audittrails'];
    for (const collName of collections) {
      try {
        await mongoose.connection.db.collection(collName).deleteMany({});
        console.log(`   ✓ Cleared ${collName}`);
      } catch (err) {
        console.log(`   - ${collName} doesn't exist yet`);
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

    console.log("   ✓ Created HR Admin (Subramanya@aksharaenterprises.info)");

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

    console.log("   ✓ Created John Manager (johnmanager@gmail.com)");

    // Create Leave Types (ONLY CL and SL)
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
    ];

    const insertedLeaveTypes = await mongoose.connection.db.collection("leavetypes").insertMany(leaveTypes);
    console.log(`   ✓ Created ${leaveTypes.length} leave types (CL, SL ONLY)`);

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

    console.log("   ✓ Initialized leave balances for both users");

    // Verify
    const userCount = await mongoose.connection.db.collection("users").countDocuments();
    const leaveTypeCount = await mongoose.connection.db.collection("leavetypes").countDocuments();

    console.log(`\n✅ Database "${dbName}" seeded successfully!`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Leave Types: ${leaveTypeCount}`);

    await mongoose.connection.close();
    
    return { success: true, users: userCount, leaveTypes: leaveTypeCount };
  } catch (error) {
    console.error(`❌ Error seeding ${dbName}:`, error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    return { success: false, error: error.message };
  }
}

async function seedBothDatabases() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 SEEDING BOTH DATABASES");
  console.log("=".repeat(60));

  // Seed leave_management database
  const result1 = await seedDatabase('leave_management');
  
  // Wait a bit between connections
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Seed test database
  const result2 = await seedDatabase('test');

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(60));
  
  console.log("\n✅ leave_management database:");
  if (result1.success) {
    console.log(`   Users: ${result1.users}`);
    console.log(`   Leave Types: ${result1.leaveTypes} (CL, SL ONLY)`);
  } else {
    console.log(`   ❌ Failed: ${result1.error}`);
  }
  
  console.log("\n✅ test database:");
  if (result2.success) {
    console.log(`   Users: ${result2.users}`);
    console.log(`   Leave Types: ${result2.leaveTypes} (CL, SL ONLY)`);
  } else {
    console.log(`   ❌ Failed: ${result2.error}`);
  }

  console.log("\n🔐 Login Credentials (same for both databases):");
  console.log("\n   HR Admin:");
  console.log("   Email: Subramanya@aksharaenterprises.info");
  console.log("   Password: admin123");
  console.log("   Role: HR_ADMIN");

  console.log("\n   Manager:");
  console.log("   Email: johnmanager@gmail.com");
  console.log("   Password: admin123");
  console.log("   Role: MANAGER");

  console.log("\n📝 Leave Types Created (2 types ONLY - CL and SL):");
  console.log("   - Casual Leave (CL): 12 days/year");
  console.log("   - Sick Leave (SL): 10 days/year");

  console.log("\n✅ Both databases are ready to use!");
  console.log("   Backend: http://localhost:5000");
  console.log("   Frontend: http://localhost:5173");
  console.log("\n" + "=".repeat(60) + "\n");

  process.exit(0);
}

seedBothDatabases().catch((err) => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
