// NOTJUST Watr — Plesk-compatible production server entry point
// This file loads the Next.js standalone server built with `output: "standalone"`
// Plesk's Node.js extension uses this as the application startup file.
//
// ENVIRONMENT LOADING ORDER:
//   1. Plesk's Node.js env vars (set in Plesk panel) — highest priority
//   2. .env.production file (in project root or standalone dir) — loaded manually
//   3. Defaults/fallbacks in this file
//
// You can either:
//   - Set all env vars in Plesk's Node.js panel (tedious but works)
//   - OR just upload .env.production to the project root (much easier!)
//   - OR combine both (Plesk panel vars override .env.production)
//
// IMPORTANT: This file does NOT require 'dotenv' as a package.
// In standalone mode, node_modules is minimal and dotenv may not be available.
// We parse .env.production manually instead.

const path = require('path');
const fs = require('fs');

// ─── Manual .env Parser ─────────────────────────────────────────
// Parses a .env file and sets vars in process.env (without overwriting).
// Handles: comments (#), empty lines, quoted values, inline comments.
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Match KEY=VALUE (KEY can contain underscores, VALUE can be anything)
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2];

    // Remove surrounding quotes (single or double)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // Remove inline comments (only for unquoted values)
      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) {
        value = value.substring(0, commentIdx);
      }
    }

    value = value.trim();

    // Don't override existing env vars (Plesk panel vars take priority)
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return true;
}

// ─── Load .env.production FIRST (before any other code) ──────────
// Try loading from project root first, then from standalone dir.
const envPaths = [
  path.join(__dirname, '.env.production'),
  path.join(__dirname, '.next', 'standalone', '.env.production'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      parseEnvFile(envPath);
      envLoaded = true;
      console.log('[server.js] Loaded environment from:', envPath);
      break; // Use the first found
    } catch (err) {
      console.error('[server.js] WARNING: Failed to parse', envPath, '-', err.message);
    }
  }
}

if (!envLoaded) {
  console.warn('[server.js] .env.production not found — using Plesk env vars only');
  console.warn('[server.js] Searched:', envPaths.join(', '));
}

// ─── Environment Configuration ──────────────────────────────────
// Plesk sets the PORT environment variable for the application.
// We must listen on 0.0.0.0 so Plesk's reverse proxy can reach us.
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Set default NODE_ENV to production if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// ─── PORT Validation ────────────────────────────────────────────
// Plesk/Phusion Passenger sets PORT automatically.
// If running manually, you can set PORT=3000.
if (!process.env.PORT) {
  console.error('[server.js] ERROR: PORT environment variable is not set.');
  console.error('[server.js] Plesk/Passenger sets this automatically.');
  console.error('[server.js] If running manually, set: PORT=3000 node server.js');
  process.exit(1);
}

console.log('[server.js] Starting NOTJUST Watr on %s:%s', process.env.HOSTNAME, process.env.PORT);

// ─── Locate Standalone Server ───────────────────────────────────
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServerPath)) {
  console.error('[server.js] ERROR: Standalone server not found at:');
  console.error('[server.js]   %s', standaloneServerPath);
  console.error('[server.js]');
  console.error('[server.js] You must build the project first:');
  console.error('[server.js]   npm run build:plesk');
  console.error('[server.js]');
  console.error('[server.js] This will:');
  console.error('[server.js]   1. Switch to MySQL schema');
  console.error('[server.js]   2. Generate Prisma client');
  console.error('[server.js]   3. Build Next.js with output: "standalone"');
  console.error('[server.js]   4. Copy static files, public, prisma, and env to standalone dir');
  process.exit(1);
}

// ─── Validate Standalone Directory Structure ─────────────────────
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const standaloneNextDir = path.join(standaloneDir, '.next');
const standalonePublicDir = path.join(standaloneDir, 'public');

const structureChecks = [
  { path: standaloneNextDir, label: '.next/standalone/.next/' },
  { path: standalonePublicDir, label: '.next/standalone/public/' },
  { path: path.join(standaloneNextDir, 'static'), label: '.next/standalone/.next/static/' },
];

const missingStructure = structureChecks.filter(check => !fs.existsSync(check.path));

if (missingStructure.length > 0) {
  console.error('[server.js] ERROR: Standalone directory is incomplete!');
  console.error('[server.js] Missing:');
  missingStructure.forEach(check => {
    console.error('[server.js]   - %s (%s)', check.label, check.path);
  });
  console.error('[server.js]');
  console.error('[server.js] Run: npm run build:plesk');
  console.error('[server.js] This will copy static files and public into the standalone dir.');
  process.exit(1);
}

// ─── Validate Critical Environment Variables ─────────────────────
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('[server.js] WARNING: Missing required environment variables: %s', missingVars.join(', '));
  console.error('[server.js] Set these in your Plesk Node.js environment or .env.production file');
  // Don't exit — let the app start and handle missing vars gracefully
  // (some routes may work without all vars, e.g. static pages)
}

// ─── Detect Database Type ────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || '';
const isMariaDB = dbUrl.startsWith('mysql://');
const isSQLite = dbUrl.startsWith('file:');
const dbType = isMariaDB ? 'MariaDB/MySQL' : isSQLite ? 'SQLite' : 'Unknown';

console.log('[server.js] NODE_ENV: %s', process.env.NODE_ENV);
console.log('[server.js] DATABASE_URL: %s (%s)', dbUrl ? 'configured' : 'NOT SET', dbType);
console.log('[server.js] WhatsApp: %s (Phone ID: %s)',
  process.env.WHATSAPP_TOKEN ? 'configured' : 'NOT SET',
  process.env.WHATSAPP_PHONE_NUMBER_ID || 'not set'
);
console.log('[server.js] Zoho Email: %s (%s:%s)',
  process.env.ZOHO_EMAIL ? 'configured' : 'not configured',
  process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
  process.env.ZOHO_SMTP_PORT || '465'
);
console.log('[server.js] SMSAlert: %s — WhatsApp OTP is primary',
  process.env.SMSALERT_ACTIVE === 'true' ? 'ACTIVE' : 'INACTIVE (on hold)'
);
console.log('[server.js] NEXTAUTH_SECRET: %s', process.env.NEXTAUTH_SECRET ? 'configured' : 'NOT SET');
console.log('[server.js] NEXTAUTH_URL: %s', process.env.NEXTAUTH_URL || 'not set');

if (isMariaDB) {
  console.log('[server.js] Database: MariaDB/MySQL — production mode');
} else if (isSQLite) {
  console.log('[server.js] Database: SQLite — local dev mode (not for production)');
  console.log('[server.js] WARNING: SQLite does not support concurrent writes. Use MariaDB for production.');
}

// ─── Load the Next.js Standalone Server ──────────────────────────
console.log('[server.js] Loading Next.js standalone server from:');
console.log('[server.js]   %s', standaloneServerPath);

try {
  require(standaloneServerPath);
  console.log('[server.js] Server loaded successfully.');
} catch (error) {
  console.error('[server.js] FATAL: Failed to load standalone server:');
  console.error('[server.js] Error: %s', error.message);

  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('[server.js]');
    console.error('[server.js] This is a MODULE_NOT_FOUND error.');
    console.error('[server.js] The standalone bundle may be missing dependencies.');
    console.error('[server.js] Try running: npm run build:plesk');
    console.error('[server.js] Missing module: %s', error.requireId || 'unknown');
  }

  if (error.stack) {
    console.error('[server.js] Stack trace:');
    console.error('[server.js] %s', error.stack);
  }

  process.exit(1);
}
