const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-management');
    const logs = await mongoose.connection.collection('notificationlogs').find().sort({ createdAt: -1 }).limit(10).toArray();
    console.log("Recent logs:");
    logs.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] ${l.event} -> ${l.recipientEmail} | Status: ${l.status} | error: ${l.error}`);
    });

    const leaves = await mongoose.connection.collection('leaverequests').find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log("\nRecent Leave requests:");
    leaves.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] Reason: ${l.reason} | Status: ${l.status}`);
    });

    process.exit(0);
}
check();
