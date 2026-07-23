# Task 10 - MariaDB Migration Agent

## Task Summary
Switch the NOTJUST Watr project from SQLite to MariaDB (MySQL) for Plesk hosting deployment, while maintaining SQLite compatibility for local sandbox development.

## Files Created
1. **prisma/schema-sqlite.prisma** — Preserved original SQLite schema as template for local dev
2. **prisma/schema-mysql.prisma** — MySQL/MariaDB schema template for production deployment
3. **.env.production.example** — Production environment variables template with MariaDB DATABASE_URL format

## Files Modified
1. **prisma/schema.prisma** — Switched from SQLite (`provider = "sqlite"`) to MySQL/MariaDB (`provider = "mysql"`) with all MySQL-specific type annotations:
   - `@db.VarChar(30)` for @id fields (cuid())
   - `@db.VarChar(191)` for @unique string fields (MariaDB utf8mb4 index limit)
   - `@db.Text` for JSON-like fields
   - `@db.DateTime(3)` for all DateTime fields
   - `@@index` declarations for FK columns and query performance
   - Currently set to SQLite (after db:use-sqlite switch for local dev)

2. **.env** — Updated with detailed comments explaining both MariaDB and SQLite DATABASE_URL configurations

3. **next.config.ts** — Removed `better-sqlite3` from serverExternalPackages (only `@prisma/client` needed for MySQL)

4. **package.json** — Updated scripts:
   - `dev`: auto-switches to SQLite before starting
   - `build:plesk`: auto-switches to MySQL before building
   - `db:use-mysql`: copies MySQL schema template and regenerates Prisma client
   - `db:use-sqlite`: copies SQLite schema template and regenerates Prisma client
   - Removed SQLite file copy from build:plesk

5. **plesk-setup.md** — Complete rewrite for MariaDB:
   - Database creation via Plesk or SSH
   - MariaDB DATABASE_URL format
   - utf8mb4 charset requirement
   - Schema switching instructions
   - MariaDB backup via mysqldump
   - phpMyAdmin references
   - Updated troubleshooting for MariaDB errors

6. **ecosystem.config.cjs** — Updated comment about multiple instances now possible with MariaDB

7. **server.js** — Added MariaDB/SQLite database type detection and logging

8. **worklog.md** — Appended work record for Task 10

## Verification
- Prisma client generated successfully with MySQL schema (v6.19.2)
- Switched back to SQLite for local dev successfully
- SQLite schema pushed to local database (in sync)
- Dev server compiles and serves pages correctly (HTTP 200)
- Lint check passes (only pre-existing error in Gatekept examples folder)
- Zero new lint errors introduced

## Key Design Decisions
- **Dual-schema system**: MySQL for production (Plesk), SQLite for local dev (sandbox)
- **Three Prisma schema files**: schema.prisma (active), schema-mysql.prisma (template), schema-sqlite.prisma (template)
- **Automated switching**: `db:use-mysql` and `db:use-sqlite` npm scripts
- **Dev script auto-switch**: runs `db:use-sqlite` before starting dev server
- **Build script auto-switch**: `build:plesk` runs `db:use-mysql` before building
- **MariaDB utf8mb4 compatibility**: `@db.VarChar(191)` for unique fields
