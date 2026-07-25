# NOTJUST Watr — Plesk Deployment Guide (MariaDB)

Step-by-step instructions for deploying the NOTJUST Watr wellness shot application on a Plesk-managed server with MariaDB database.

---

## Prerequisites

- **Plesk** version 18+ with the **Node.js extension** installed
- **Node.js** 18.x or 20.x installed via Plesk (check in Plesk > Tools & Settings > Node.js)
- **npm** 9+ or **bun** 1+ (bun is recommended for faster builds)
- **MariaDB** 10.3+ or MySQL 5.7+ available on the Plesk server
- Domain configured in Plesk with SSL certificate (Let's Encrypt or commercial)
- SSH access to the server (optional, but recommended for initial setup)

---

## 1. Database Setup (MariaDB)

### Create Database in Plesk

1. In Plesk control panel, go to **Domains > yourdomain.com > Databases**
2. Click **Add Database**
3. Set:
   - **Database name**: `notjustwatr_com`
   - **Database user**: `notjustwatrdb`
   - **Password**: (set a strong password — you'll need this in DATABASE_URL)
   - **Database server**: (default MariaDB on localhost:3306)
4. Click **OK** to create the database

### Alternatively via SSH (if Plesk database tool is unavailable):
```bash
# Connect to MariaDB
mysql -u root -p

# Create database and user
CREATE DATABASE notjustwatr_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'notjustwatrdb'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON notjustwatr_com.* TO 'notjustwatrdb'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### DATABASE_URL Format
```
DATABASE_URL=mysql://notjustwatrdb:YOUR_PASSWORD@localhost:3306/notjustwatr_com
```

**Important**: MariaDB must use `utf8mb4` character set (not `utf8`) for proper Unicode support including emojis. The Prisma schema uses `@db.VarChar(191)` for unique fields, which is the safe maximum for utf8mb4 indexes in MariaDB.

---

## 2. Prepare the Build

Run the build on your local machine or a CI server (not on Plesk, to save resources):

```bash
# Install dependencies
npm install

# Switch to MySQL/MariaDB schema for production build
npm run db:use-mysql

# Build Next.js standalone output (includes Prisma MySQL client)
npm run build:plesk
```

This creates:
- `.next/standalone/` — The self-contained Next.js server
- `.next/static/` — Static assets (copied into standalone)
- `public/` — Public files (copied into standalone)
- `prisma/` — Prisma schema + generated MySQL client

**Note**: `npm run build:plesk` automatically switches to the MySQL schema before building. The `dev` script uses SQLite for local development.

---

## 3. Upload Files to Plesk

Upload the following files/directories to your Plesk document root (e.g., `/var/www/vhosts/yourdomain.com/httpdocs/`):

### Required files:
```
server.js                        # Plesk startup entry point
ecosystem.config.cjs             # PM2 config (optional)
package.json                     # For Plesk dependency resolution
.next/standalone/                # Built application (entire directory)
  ├── server.js                  # Next.js standalone server
  ├── .next/                     # Built Next.js assets
  │   └── static/               # Static files
  ├── public/                    # Public assets
  ├── prisma/                    # Prisma schema + generated MySQL client
  └── node_modules/              # Production dependencies (standalone includes these)
.env.production                  # Production environment variables
```

### Do NOT upload:
- `src/` — Source code is not needed in production (standalone includes compiled output)
- `.next/cache/` — Build cache, not needed
- `node_modules/` at root level — standalone has its own `node_modules`
- `dev.log`, `server.log` — Log files
- `.env` — Dev environment file (use `.env.production` instead)
- `bun.lock` — Only needed for bun dev
- `db/` — SQLite database directory (not used in production; MariaDB replaces it)

### Upload methods:
- **Plesk File Manager**: Upload zip and extract
- **FTP/SFTP**: Use an FTP client (FileZilla, etc.)
- **SSH**: `scp -r .next/standalone server.js ecosystem.config.cjs package.json .env.production user@server:/var/www/vhosts/yourdomain.com/httpdocs/`
- **Git**: Clone the repository on the server, then run `npm run build:plesk` there

---

## 4. Plesk Node.js Application Settings

In Plesk control panel:

1. Go to **Domains > yourdomain.com > Node.js**
2. Click **Create Application**

### Settings:
| Setting | Value |
|---------|-------|
| **Node.js Version** | 18.x or 20.x |
| **Application Mode** | Production |
| **Application Root** | `/var/www/vhosts/yourdomain.com/httpdocs` |
| **Startup File** | `server.js` |
| **Custom Environment Variables** | (see Section 5) |

3. Click **Enable Node.js** to start the application

---

## 5. Environment Variables

Set these in **Plesk > Node.js > Environment Variables** or in `.env.production`:

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Application environment |
| `PORT` | Auto | (set by Plesk) | Port number (Plesk sets this automatically) |
| `HOSTNAME` | Auto | (set by server.js) | Plesk needs `0.0.0.0`, server.js sets this |
| `DATABASE_URL` | Yes | `mysql://notjustwatrdb:password@localhost:3306/notjustwatr_com` | MariaDB connection string |
| `SMSALERT_ACTIVE` | No | `false` | **ON HOLD** — WhatsApp OTP is primary. Set `true` to activate SMS later |
| `SMSALERT_USER` | No* | (empty) | SMSAlert.co.in API username — fill when activating SMS |
| `SMSALERT_PWD` | No* | (empty) | SMSAlert.co.in API password — fill when activating SMS |
| `SMSALERT_SENDER` | No | `NJWATR` | SMS sender ID (default: NJWATR) |
| `WHATSAPP_TOKEN` | **Yes** | `EAAS4lNk8EUQBSG...` | WhatsApp Business API access token (v19.0) |
| `WHATSAPP_PHONE_NUMBER_ID` | **Yes** | `1249816758211230` | WhatsApp Business phone number ID |
| `ZOHO_SMTP_HOST` | No | `smtp.zoho.com` | Zoho SMTP host for transactional emails |
| `ZOHO_SMTP_PORT` | No | `465` | Zoho SMTP port (SSL on port 465) |
| `ZOHO_EMAIL` | **Yes** | `notjustwatr@zh-onehealth.com` | Zoho email address (sender) |
| `ZOHO_PASSWORD` | **Yes** | `crRxWBPYHe7r` | Zoho app password (not login password) |
| `NEXTAUTH_SECRET` | Yes | (generated) | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `https://yourdomain.com` | Full URL of your production site |

*SMSAlert is currently **disabled** (`SMSALERT_ACTIVE=false`). WhatsApp OTP is the primary OTP delivery method. SMSAlert can be activated later by setting `SMSALERT_ACTIVE=true` and providing credentials.

---

## 6. Push Prisma Schema to MariaDB

After uploading files and configuring environment variables, push the Prisma schema to create tables in MariaDB:

```bash
# On the server via SSH:
cd /var/www/vhosts/yourdomain.com/httpdocs

# Ensure DATABASE_URL is set (from Plesk environment or .env.production)
# Push the Prisma schema to create MariaDB tables
npx prisma db push

# Seed initial data (admin user, products, videos, quizzes, etc.)
npm run seed
```

**Alternative**: If SSH is not available, you can use Plesk's phpMyAdmin to verify the database, and push the schema via a build step.

---

## 7. Build and Start Commands in Plesk

In the Plesk Node.js application settings:

| Command | Value |
|---------|-------|
| **Run Build Script** | `npm run build:plesk` |
| **Run Start Script** | `npm run plesk:start` |

Or if you pre-built and uploaded:
- Skip the build step
- Start script: `node server.js`

### Using PM2 (Alternative):
If Plesk supports PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Generates startup command for auto-restart on reboot
```

---

## 8. Domain and SSL Configuration

### Plesk Domain Settings:
1. **Domains > yourdomain.com > Web Server Settings**
2. Ensure Node.js is handling requests (Plesk sets this up when you enable the Node.js app)

### SSL Certificate:
1. **Domains > yourdomain.com > SSL/TLS Certificates**
2. Install a Let's Encrypt certificate (free) or your commercial certificate
3. Enable **Force HTTPS** redirect

### DNS:
- Point your domain's A record to the Plesk server IP
- Ensure `NEXTAUTH_URL` matches the HTTPS URL

---

## 9. Database Backup & Maintenance

### MariaDB Backup (via Plesk):
Plesk provides built-in database backup:
1. **Domains > yourdomain.com > Databases > notjustwatr_com > Backup**
2. Set up scheduled backups (daily recommended)

### MariaDB Backup (via SSH):
```bash
# Full database backup
mysqldump -u notjustwatrdb -p notjustwatr_com > backup-$(date +%Y%m%d).sql

# Restore from backup
mysql -u notjustwatrdb -p notjustwatr_com < backup-20250615.sql
```

### phpMyAdmin:
Plesk provides phpMyAdmin for database inspection and manual queries:
1. **Domains > yourdomain.com > Databases > notjustwatr_com > phpMyAdmin**

### Database Optimization:
```bash
# Periodic optimization (monthly recommended)
mysql -u notjustwatrdb -p -e "OPTIMIZE TABLE UserProfile, Product, Order, OrderItem, Subscription, OtpVerification;" notjustwatr_com
```

---

## 10. Troubleshooting

### Application won't start
- Check Plesk Node.js logs: **Domains > yourdomain.com > Logs**
- Check `logs/pm2-error.log` if using PM2
- Verify `PORT` is set (Plesk sets this automatically, but check)
- Verify `server.js` is in the application root
- Verify `.next/standalone/server.js` exists (run `npm run build:plesk` first)

### "Cannot find module" errors
- Ensure `npx prisma generate` was run before building
- Ensure `.next/standalone/node_modules/` exists and contains `@prisma/client`
- Try: `npm install && npm run db:use-mysql && npx prisma generate && npm run build:plesk`

### MariaDB connection errors
- Verify `DATABASE_URL` is correctly formatted: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`
- Verify the database exists: check in Plesk > Databases or phpMyAdmin
- Verify user credentials: test with `mysql -u notjustwatrdb -p -h localhost notjustwatr_com`
- Verify MariaDB is running: `systemctl status mariadb`
- Check MariaDB character set: must be `utf8mb4` (not `utf8`)
  ```sql
  SHOW VARIABLES LIKE 'character_set_server';
  -- Should show: utf8mb4
  ```

### "Prisma client could not connect" errors
- Ensure the Prisma schema uses `provider = "mysql"` (run `npm run db:use-mysql` before building)
- Ensure `mysql2` package is in the standalone `node_modules`
- For Plesk, the MariaDB server is typically on `localhost:3306`

### OTP not working
- **WhatsApp OTP** (primary method): Verify `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set correctly
- Test the WhatsApp API by sending a test OTP via the `/api/auth/whatsapp-otp/send` endpoint
- Check WhatsApp Business API dashboard for message delivery status
- Ensure the `otp_verification` template is approved in your WhatsApp Business account
- **SMS OTP** (currently inactive): Set `SMSALERT_ACTIVE=true` and provide `SMSALERT_USER`/`SMSALERT_PWD` to activate SMSAlert.co.in
- In dev mode (without WhatsApp credentials), OTP code is logged to console and shown via toast

### "ECONNREFUSED" or port errors
- Plesk's Node.js extension sets `PORT` automatically
- The `server.js` sets `HOSTNAME=0.0.0.0` for Plesk compatibility
- Don't hardcode a port — let Plesk assign it

### Memory issues
- PM2 config limits memory to 256MB (`max_memory_restart: '256M'`)
- Increase in `ecosystem.config.cjs` if needed: `'512M'`
- Monitor with: `pm2 monit`

### 502 Bad Gateway
- Plesk's reverse proxy can't reach the Node.js app
- Ensure the app is running (check Plesk Node.js dashboard)
- Check that `HOSTNAME=0.0.0.0` is set (Plesk needs this)
- Check that `PORT` matches what Plesk expects

### Static assets not loading
- Ensure `.next/static/` was copied into `.next/standalone/.next/`
- Ensure `public/` was copied into `.next/standalone/`
- The `build:plesk` script handles these copies automatically

### Performance tips
- Use Node.js 20.x for best performance
- Set `NODE_ENV=production` (enables Next.js optimizations)
- With MariaDB, you can now use PM2 cluster mode for multiple instances (no longer limited to 1)
- Enable Plesk's Nginx caching for static assets
- Consider enabling Gzip/Brotli compression in Plesk
- Monitor MariaDB query performance in phpMyAdmin

---

## 11. Schema Switching (Local Dev vs Production)

The project supports switching between SQLite (local dev) and MariaDB (production):

```bash
# Switch to SQLite for local development (no MariaDB needed)
npm run db:use-sqlite
# DATABASE_URL=file:/path/to/local.db

# Switch to MariaDB for production
npm run db:use-mysql
# DATABASE_URL=mysql://notjustwatrdb:password@localhost:3306/notjustwatr_com
```

**How it works**:
- `prisma/schema.prisma` is the active schema (used by Prisma)
- `prisma/schema-sqlite.prisma` is the SQLite template
- `prisma/schema-mysql.prisma` is the MariaDB/MySQL template
- The `db:use-sqlite` and `db:use-mysql` scripts copy the appropriate template to `schema.prisma` and regenerate the Prisma client
- The `dev` script automatically switches to SQLite before starting
- The `build:plesk` script automatically switches to MySQL before building

---

## 12. Quick Start Checklist

```
[ ] MariaDB database created in Plesk (utf8mb4 charset)
[ ] Database user created with full privileges
[ ] Node.js 18+ installed in Plesk
[ ] Plesk Node.js extension installed
[ ] Domain configured with SSL
[ ] Files uploaded to Plesk document root
[ ] .env.production configured with MariaDB DATABASE_URL
[ ] WhatsApp Business API credentials set (WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID)
[ ] Zoho email credentials set (optional, for notifications)
[ ] SMSAlert set to inactive (SMSALERT_ACTIVE=false) — WhatsApp OTP is primary
[ ] NEXTAUTH_SECRET generated (openssl rand -base64 32)
[ ] NEXTAUTH_URL set to https://yourdomain.com
[ ] Prisma schema pushed to MariaDB (npx prisma db push)
[ ] Database seeded (npm run seed)
[ ] Build completed (npm run build:plesk) — auto-switches to MySQL schema
[ ] Plesk Node.js app created with startup file = server.js
[ ] Application started and responding
[ ] Test WhatsApp OTP login flow
[ ] Test admin login
[ ] Test product pages
[ ] Verify HTTPS redirect working
[ ] Set up MariaDB scheduled backups in Plesk
```
