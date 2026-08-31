// NOTJUST Watr — Plesk/Phusion Passenger Production Server
// ──────────────────────────────────────────────────────────────
// This file is the entry point for Phusion Passenger on Plesk.
// It loads the Next.js standalone server and handles all the
// configuration needed for Plesk shared hosting.
//
// DEPLOYMENT STEPS:
//   1. Upload project files to Plesk
//   2. Run: npm install && npm run build:plesk
//   3. In Plesk Node.js panel:
//      - Application Root: project directory
//      - Application Startup File: server.js
//      - Application Mode: production
//      - Node.js Version: 18.x or 20.x
// ──────────────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');

// ─── Manual .env Parser (no dotenv dependency) ────────────────
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      let key = match[1];
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else {
        const commentIdx = value.indexOf(' #');
        if (commentIdx !== -1) value = value.substring(0, commentIdx);
      }
      value = value.trim();
      if (!process.env[key]) process.env[key] = value;
    }
    return true;
  } catch (err) {
    console.error('[server.js] WARNING: Failed to parse', filePath, '-', err.message);
    return false;
  }
}

// ─── Load .env.production BEFORE anything else ────────────────
// Search in multiple locations (Plesk may have the project in different dirs)
const envSearchPaths = [
  path.join(__dirname, '.env.production'),
  path.join(__dirname, '.next', 'standalone', '.env.production'),
  path.join(process.cwd(), '.env.production'),
];

let envLoaded = false;
for (const envPath of envSearchPaths) {
  if (parseEnvFile(envPath)) {
    console.log('[server.js] Loaded environment from:', envPath);
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  console.warn('[server.js] No .env.production found — relying on Plesk env vars only');
}

// ─── Core Environment Setup ──────────────────────────────────
// Plesk/Passenger sets PORT automatically. We MUST listen on 0.0.0.0.
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

// ─── PORT Handling ───────────────────────────────────────────
// Phusion Passenger sets PORT automatically. If not set, default to 3000.
if (!process.env.PORT) {
  process.env.PORT = '3000';
  console.warn('[server.js] PORT not set by Passenger — defaulting to 3000');
}

console.log('[server.js] Starting NOTJUST Watr');
console.log('[server.js] NODE_ENV:', process.env.NODE_ENV);
console.log('[server.js] PORT:', process.env.PORT);
console.log('[server.js] HOSTNAME:', process.env.HOSTNAME);
console.log('[server.js] DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'NOT SET');

// ─── Locate and Load Standalone Server ───────────────────────
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServerPath)) {
  console.error('[server.js] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[server.js] FATAL: Standalone server not found!');
  console.error('[server.js] Path checked:', standaloneServerPath);
  console.error('[server.js]');
  console.error('[server.js] You MUST build the project first:');
  console.error('[server.js]   npm run build:plesk');
  console.error('[server.js]');
  console.error('[server.js] This will create the .next/standalone/ directory');
  console.error('[server.js] with all the files needed for production.');
  console.error('[server.js] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}

// ─── Verify Standalone Directory Structure ────────────────────
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const requiredDirs = [
  path.join(standaloneDir, '.next'),
  path.join(standaloneDir, 'public'),
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.error('[server.js] WARNING: Missing directory:', dir);
    console.error('[server.js] Run: npm run build:plesk');
  }
}

// ─── Anchor Upload Storage To The Project Root ───────────────
// CRITICAL: the Next.js standalone server runs with process.chdir()
// pointing INSIDE .next/standalone — any upload path resolved from
// process.cwd() lands inside .next and is DESTROYED on every build
// (`next build` regenerates .next from scratch). Anchoring uploads
// to the project root (data/uploads) makes them permanent: neither
// `npm run build`, `npm run build:plesk`, nor git deploys touch them.
process.env.UPLOAD_ROOT = path.join(__dirname, 'data', 'uploads');
const dataUploadDirs = [
  path.join(process.env.UPLOAD_ROOT, 'products'),
  path.join(process.env.UPLOAD_ROOT, 'videos'),
  path.join(process.env.UPLOAD_ROOT, 'audio'),
];
for (const dir of dataUploadDirs) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[server.js] Created upload directory:', dir);
    }
  } catch (err) {
    console.warn('[server.js] Could not create directory:', dir, '-', err.message);
  }
}

// ─── Load the Next.js Standalone Server ──────────────────────
console.log('[server.js] Loading Next.js standalone server...');

try {
  require(standaloneServerPath);
  console.log('[server.js] ✓ Server loaded successfully');
} catch (error) {
  console.error('[server.js] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('[server.js] FATAL: Failed to load standalone server!');
  console.error('[server.js] Error:', error.message);

  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('[server.js]');
    console.error('[server.js] MODULE_NOT_FOUND — missing dependency.');
    console.error('[server.js] Missing module:', error.requireId || 'unknown');
    console.error('[server.js]');
    console.error('[server.js] Try: npm run build:plesk');
    console.error('[server.js] This copies Prisma client and other native modules.');
  }

  if (error.message && error.message.includes('prisma')) {
    console.error('[server.js]');
    console.error('[server.js] PRISMA ERROR — the Prisma client is missing or broken.');
    console.error('[server.js] Make sure to run:');
    console.error('[server.js]   1. npm run db:use-mysql');
    console.error('[server.js]   2. npx prisma generate');
    console.error('[server.js]   3. npm run build:plesk');
  }

  if (error.stack) {
    console.error('[server.js]');
    console.error('[server.js] Stack trace:');
    console.error(error.stack);
  }
  console.error('[server.js] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}
