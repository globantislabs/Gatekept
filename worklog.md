# NOTJUST Watr — Work Log

---
Task ID: 1
Agent: Main Agent
Task: Fix Phusion Passenger startup error and production deployment

Work Log:
- Read and analyzed server.js, next.config.ts, package.json, .env.production
- Identified key issues with Phusion Passenger compatibility
- Rewrote server.js with simplified, robust error handling
- Updated next.config.ts with allowedDevOrigins and unoptimized images
- Updated build:plesk script with better error handling and mysql2 copying
- Kept .env.production with correct MariaDB credentials

Stage Summary:
- server.js rewritten for Passenger compatibility (simpler, better error messages)
- next.config.ts: added allowedDevOrigins, unoptimized images for standalone
- build:plesk: now copies mysql2, creates upload directories, step-by-step logging
- App runs correctly in dev mode on port 3000
