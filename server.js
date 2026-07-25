// NOTJUST Watr — Plesk-compatible production server entry point
// This file loads the Next.js standalone server built with `output: "standalone"`
// Plesk's Node.js extension uses this as the application startup file.
// Supports both MariaDB (production) and SQLite (local dev) via DATABASE_URL.

const path = require('path');
const fs = require('fs');

// ─── Environment Configuration ──────────────────────────────────
// Plesk sets the PORT environment variable for the application.
// We must listen on 0.0.0.0 so Plesk's reverse proxy can reach us.
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

if (!process.env.PORT) {
  console.error('[server.js] ERROR: PORT environment variable is not set.');
  console.error('[server.js] Plesk sets this automatically. If running manually, set PORT=3000');
  process.exit(1);
}

console.log(`[server.js] Starting NOTJUST Watr on ${process.env.HOSTNAME}:${process.env.PORT}`);

// ─── Locate Standalone Server ───────────────────────────────────
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServerPath)) {
  console.error('[server.js] ERROR: Standalone server not found at:', standaloneServerPath);
  console.error('[server.js] You must build the project first:');
  console.error('[server.js]   npm run build');
  console.error('[server.js]   or: npm run build:plesk');
  process.exit(1);
}

// ─── Validate Critical Environment Variables ─────────────────────
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[server.js] ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[server.js] Set these in your Plesk Node.js environment or .env.production file');
  // Don't exit — let the app start and handle missing vars gracefully
  // (some routes may work without all vars, e.g. static pages)
}

// ─── Detect Database Type ────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || '';
const isMariaDB = dbUrl.startsWith('mysql://');
const isSQLite = dbUrl.startsWith('file:');
const dbType = isMariaDB ? 'MariaDB/MySQL' : isSQLite ? 'SQLite' : 'Unknown';

console.log(`[server.js] NODE_ENV: ${process.env.NODE_ENV || 'not set (defaulting to production)'}`);
console.log(`[server.js] DATABASE_URL: ${dbUrl ? 'configured' : 'NOT SET'} (${dbType})`);
console.log(`[server.js] WhatsApp: ${process.env.WHATSAPP_TOKEN ? 'configured' : 'NOT SET'} (Phone ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || 'not set'})`);
console.log(`[server.js] Zoho Email: ${process.env.ZOHO_EMAIL ? 'configured' : 'not configured (dev mode)'} (${process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com'}:${process.env.ZOHO_SMTP_PORT || '465'})`);
console.log(`[server.js] SMSAlert: ${process.env.SMSALERT_ACTIVE === 'true' ? 'ACTIVE' : 'INACTIVE (on hold)'} — WhatsApp OTP is primary`);
console.log(`[server.js] NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'configured' : 'NOT SET'}`);
console.log(`[server.js] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);

if (isMariaDB) {
  console.log('[server.js] Database: MariaDB/MySQL — production mode');
} else if (isSQLite) {
  console.log('[server.js] Database: SQLite — local dev mode (not for production)');
  console.log('[server.js] WARNING: SQLite does not support concurrent writes. Use MariaDB for production.');
}

// ─── Set Default NODE_ENV ───────────────────────────────────────
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// ─── Load the Next.js Standalone Server ──────────────────────────
try {
  console.log('[server.js] Loading Next.js standalone server...');
  require(standaloneServerPath);
  console.log('[server.js] Server loaded successfully.');
} catch (error) {
  console.error('[server.js] FATAL: Failed to load standalone server:');
  console.error('[server.js]', error.message);
  if (error.stack) {
    console.error('[server.js] Stack trace:');
    console.error('[server.js]', error.stack);
  }
  process.exit(1);
}
