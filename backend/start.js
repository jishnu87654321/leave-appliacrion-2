#!/usr/bin/env node

/**
 * Optimized startup script for Leave Management System
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Suppress mongoose warnings
mongoose.set('strictQuery', false);

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// Clean startup banner
console.clear();
console.log('\n╔════════════════════════════════════════════╗');
console.log('║   Leave Management System - Backend       ║');
console.log('╚════════════════════════════════════════════╝\n');
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Database: Connected`);
console.log(`🔐 Security: Enabled\n`);

// Start the server
const app = require("./server");
app.startServer();
