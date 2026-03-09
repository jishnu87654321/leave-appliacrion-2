// Direct E2E Email Test - bypasses API to test SMTP directly via notificationService
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
    try {
        console.log('=== DIRECT SMTP EMAIL FLOW TEST ===\n');

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-management');
        console.log('Connected to MongoDB');

        // Import email service directly
        const { sendEmail, verifySmtpConnection } = require('../services/emailService');

        // Step 1: Verify SMTP connection
        console.log('\n1. Verifying SMTP connection...');
        const verifyResult = await verifySmtpConnection();
        console.log('   SMTP verify:', verifyResult.success ? '✅ CONNECTED' : '❌ FAILED', verifyResult.host || '');

        if (!verifyResult.success) {
            console.error('   Cannot continue without SMTP. Exiting.');
            process.exit(1);
        }

        // Step 2: Send a test email simulating leave application notification
        console.log('\n2. Sending test "New Leave Request" email...');
        const adminEmail = process.env.ADMIN_EMAIL || 'hr.admin@aksharaenterprises.info';
        const hrAdminUser = await mongoose.connection.collection('users').findOne({
            role: { $in: ['HR_ADMIN', 'hr_admin', 'ADMIN', 'HR'] },
            isActive: true
        });
        const recipientEmail = hrAdminUser?.email || adminEmail;
        console.log('   Sending to:', recipientEmail);

        const emailResult = await sendEmail({
            to: recipientEmail,
            subject: 'New Leave Request from SMTP Test User',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
                    <h2>New Leave Request</h2>
                    <p><strong>Employee:</strong> SMTP Test User</p>
                    <p><strong>Leave Type:</strong> Earned Leave (EL)</p>
                    <p><strong>Dates:</strong> 2026-03-25 to 2026-03-25</p>
                    <p><strong>Days:</strong> 1</p>
                    <p><strong>Reason:</strong> SMTP automated test - verifying email delivery</p>
                    <p><strong>Status:</strong> PENDING</p>
                    <hr>
                    <p style="font-size:12px;color:#6b7280;">This is an automated test email sent at ${new Date().toISOString()}</p>
                </div>
            `,
        });

        console.log('   Email result:', emailResult.success ? '✅ SENT' : '❌ FAILED');
        if (emailResult.success) {
            console.log('   Message ID:', emailResult.messageId);
            console.log('   Via host:', emailResult.host);
        } else {
            console.log('   Error:', emailResult.error || emailResult.reason || 'Unknown');
        }

        // Step 3: Also test the notificationMailer (the one used during leave applications)
        console.log('\n3. Testing queueAdminEventNotification...');
        const { sendAdminEventNotification } = require('../services/notificationMailer');
        const adminNotifResult = await sendAdminEventNotification('LEAVE_APPLICATION_SUBMITTED', {
            employeeName: 'SMTP Test User',
            employeeEmail: 'smtptest@test.com',
            leaveType: 'Earned Leave',
            startDate: '2026-03-25',
            endDate: '2026-03-25',
            numberOfDays: 1,
            reason: 'SMTP automated test - verifying admin notification',
            status: 'PENDING',
        });
        console.log('   Admin notification result:', adminNotifResult?.success ? '✅ SENT' : '❌ FAILED');
        if (adminNotifResult?.success) {
            console.log('   Message ID:', adminNotifResult.messageId);
        } else {
            console.log('   Details:', adminNotifResult?.error || adminNotifResult?.reason || JSON.stringify(adminNotifResult));
        }

        // Step 4: Test notifyLeaveEvent (the actual function called in applyLeave controller)
        console.log('\n4. Testing notifyLeaveEvent (actual leave notification path)...');
        const { notifyLeaveEvent } = require('../services/notificationService');
        const LeaveType = require('../models/LeaveType');
        const elLeaveType = await LeaveType.findOne({ code: 'EL', isActive: true });

        if (elLeaveType) {
            // Create a fake leave request object
            const fakeLeaveRequest = {
                _id: new mongoose.Types.ObjectId(),
                leaveType: elLeaveType,
                totalDays: 1,
                fromDate: new Date('2026-03-25'),
                toDate: new Date('2026-03-25'),
                reason: 'SMTP E2E Test via notifyLeaveEvent',
                status: 'PENDING',
            };
            const fakeEmployee = {
                _id: new mongoose.Types.ObjectId(),
                name: 'SMTP Test Employee',
                email: recipientEmail,
            };

            try {
                await notifyLeaveEvent({
                    event: 'APPLY',
                    leaveRequest: fakeLeaveRequest,
                    actor: fakeEmployee,
                    employee: fakeEmployee,
                    managerId: null,
                });
                console.log('   notifyLeaveEvent completed!');
            } catch (err) {
                console.log('   notifyLeaveEvent error:', err.message);
            }
        } else {
            console.log('   Skipped: No active EL leave type found.');
        }

        // Step 5: Check notification logs
        console.log('\n5. Checking recent notification logs...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const logs = await mongoose.connection.collection('notificationlogs')
            .find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
        logs.forEach(log => {
            console.log(`   [${log.createdAt.toISOString()}] Event: ${log.event} | To: ${log.recipientEmail} | Status: ${log.status} | Error: ${log.error || 'None'}`);
        });

        // Summary
        const recentLogs = logs.filter(l => Date.now() - l.createdAt.getTime() < 60000);
        const sentCount = recentLogs.filter(l => l.status === 'SENT').length;
        const failedCount = recentLogs.filter(l => l.status === 'FAILED').length;

        console.log('\n=== TEST RESULTS ===');
        console.log(`Emails SENT (last 60s): ${sentCount}`);
        console.log(`Emails FAILED (last 60s): ${failedCount}`);

        if (sentCount > 0) {
            console.log('\n✅ EMAIL FLOW IS FULLY WORKING! Check your Zoho inbox at:', recipientEmail);
        } else if (failedCount > 0) {
            console.log('\n❌ Emails are failing. Check errors above.');
        } else {
            console.log('\n⏳ No recent logs. The emails may still be processing.');
        }

        await mongoose.disconnect();
        process.exit(sentCount > 0 ? 0 : 1);
    } catch (err) {
        console.error('Test failed:', err.message);
        try { await mongoose.disconnect(); } catch { }
        process.exit(1);
    }
}

main();
