const mongoose = require('mongoose');
require('dotenv').config();

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-management');
        console.log('Connected to MongoDB');

        const logs = await mongoose.connection.collection('notificationlogs').find({ event: 'APPLY' }).sort({ createdAt: -1 }).limit(6).toArray();
        if (logs.length === 0) {
            console.log('No APPLY logs found.');
        } else {
            logs.forEach(log => {
                console.log(`[${log.createdAt.toISOString()}] Event: ${log.event} | To: ${log.recipientEmail} | Status: ${log.status} | Error: ${log.error || 'None'}`);
            });
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

main();
