# Task ID: 2 — Plesk Deployment Configuration

## Agent: Plesk Deployment Config Agent

## Task
Configure the NOTJUST Watr project for Plesk hosting deployment.

## Files Created
1. **server.js** — Plesk-compatible production startup entry point
2. **.env.production.example** — Template with all required production env vars
3. **ecosystem.config.cjs** — PM2 process manager config for Plesk
4. **plesk-setup.md** — Comprehensive deployment documentation

## Files Modified
1. **next.config.ts** — Added `serverExternalPackages` for Prisma/SQLite
2. **package.json** — Updated scripts for Plesk compatibility
3. **worklog.md** — Added task record

## Key Decisions
- `server.js` uses Node.js (not Bun) since Plesk only supports Node.js
- `server.js` handles missing standalone build with graceful error + exit
- `server.js` validates required env vars but doesn't exit on missing optional ones
- PM2 config uses single instance (fork mode) since SQLite doesn't support concurrent writes
- `build:plesk` includes `npx prisma generate` to ensure Prisma client is built
- `start` script changed from `bun` to `node` for Plesk compatibility
