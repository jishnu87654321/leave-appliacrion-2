require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to ensure collections are created
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
const Notification = require('../models/Notification');
const AuditTrail = require('../models/AuditTrail');

const initDatabase = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   Database Initialization & Verification  ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Build MongoDB URI with database name
    let mongoURI = process.env.MONGODB_URI;
    
    // Add database name if not present
    if (!mongoURI.includes('?') && !mongoURI.endsWith('/leave_management')) {
      mongoURI = mongoURI.endsWith('/') 
        ? mongoURI + 'leave_management' 
        : mongoURI + '/leave_management';
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected Successfully!\n');
    console.log('📊 Database Information:');
    console.log(`   Name: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port || 'N/A (Atlas)'}\n`);

    // Get existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('📦 Existing Collections:');
    if (collectionNames.length === 0) {
      console.log('   (No collections found - will be created on first use)\n');
    } else {
      collectionNames.forEach(name => console.log(`   ✓ ${name}`));
      console.log('');
    }

    // Create collections if they don't exist
    console.log('🔨 Ensuring all collections exist...\n');

    const requiredCollections = [
      { name: 'users', model: User },
      { name: 'leaverequests', model: LeaveRequest },
      { name: 'leavetypes', model: LeaveType },
      { name: 'notifications', model: Notification },
      { name: 'audittrails', model: AuditTrail },
    ];

    for (const { name, model } of requiredCollections) {
      try {
        if (!collectionNames.includes(name)) {
          await mongoose.connection.db.createCollection(name);
          console.log(`   ✅ Created collection: ${name}`);
        } else {
          console.log(`   ✓ Collection exists: ${name}`);
        }

        // Ensure indexes are created
        await model.createIndexes();
      } catch (error) {
        if (error.code === 48) {
          console.log(`   ✓ Collection exists: ${name}`);
        } else {
          console.log(`   ⚠️  Warning for ${name}: ${error.message}`);
        }
      }
    }

    console.log('\n🔍 Verifying Collections...\n');

    // Verify collections again
    const updatedCollections = await mongoose.connection.db.listCollections().toArray();
    const updatedNames = updatedCollections.map(c => c.name);

    console.log('📋 Final Collection List:');
    updatedNames.forEach(name => {
      const count = mongoose.connection.db.collection(name);
      console.log(`   ✓ ${name}`);
    });

    // Get document counts
    console.log('\n📊 Document Counts:');
    for (const name of updatedNames) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`   ${name}: ${count} documents`);
    }

    console.log('\n✅ Database initialization complete!');
    console.log('🎯 All collections are ready for use.\n');

    // Test a simple query
    console.log('🧪 Testing database operations...');
    const userCount = await User.countDocuments();
    const leaveTypeCount = await LeaveType.countDocuments();
    console.log(`   Users: ${userCount}`);
    console.log(`   Leave Types: ${leaveTypeCount}`);

    if (userCount === 0) {
      console.log('\n💡 Tip: Run "npm run seed" to populate the database with sample data.\n');
    } else {
      console.log('\n✅ Database has data and is ready to use!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.message.includes('authentication')) {
      console.error('💡 Check your MongoDB credentials in .env file');
    } else if (error.message.includes('network')) {
      console.error('💡 Check your internet connection and MongoDB Atlas IP whitelist');
    }
    
    process.exit(1);
  }
};

// Run initialization
initDatabase();
