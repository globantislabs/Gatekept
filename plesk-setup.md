# NOTJUST Watr — Plesk Deployment Guide

Step-by-step instructions for deploying the NOTJUST Watr wellness shot application on a Plesk-managed server.

---

## Prerequisites

- **Plesk** version 18+ with the **Node.js extension** installed
- **Node.js** 18.x or 20.x installed via Plesk (check in Plesk > Tools & Settings > Node.js)
- **npm** 9+ or **bun** 1+ (bun is recommended for faster builds)
- Domain configured in Plesk with SSL certificate (Let's Encrypt or commercial)
- SSH access to the server (optional, but recommended for initial setup)

---

## 1. Prepare the Build

Run the build on your local machine or a CI server (not on Plesk, to save resources):

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build Next.js standalone output
npm run build:plesk
```

This creates:
- `.next/standalone/` — The self-contained Next.js server
- `.next/static/` — Static assets (copied into standalone)
- `public/` — Public files (copied into standalone)
- `prisma/` — Prisma schema (copied into standalone)
- `db/` — SQLite database file (copied if exists)

---

## 2. Upload Files to Plesk

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
  ├── prisma/                    # Prisma schema + generated client
  ├── node_modules/              # Production dependencies (standalone includes these)
  └── db/                        # SQLite database (if exists)
.env.production                  # Production environment variables
```

### Do NOT upload:
- `src/` — Source code is not needed in production (standalone includes compiled output)
- `.next/cache/` — Build cache, not needed
- `node_modules/` at root level — standalone has its own `node_modules`
- `dev.log`, `server.log` — Log files
- `.env` — Dev environment file (use `.env.production` instead)
- `bun.lock` — Only needed for bun dev

### Upload methods:
- **Plesk File Manager**: Upload zip and extract
- **FTP/SFTP**: Use an FTP client (FileZilla, etc.)
- **SSH**: `scp -r .next/standalone server.js ecosystem.config.cjs package.json .env.production user@server:/var/www/vhosts/yourdomain.com/httpdocs/`
- **Git**: Clone the repository on the server, then run `npm run build:plesk` there

---

## 3. Plesk Node.js Application Settings

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
| **Custom Environment Variables** | (see Section 4) |

3. Click **Enable Node.js** to start the application

---

## 4. Environment Variables

Set these in **Plesk > Node.js > Environment Variables** or in `.env.production`:

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Application environment |
| `PORT` | Auto | (set by Plesk) | Port number (Plesk sets this automatically) |
| `HOSTNAME` | Auto | (set by server.js) | Plesk needs `0.0.0.0`, server.js sets this |
| `DATABASE_URL` | Yes | `file:/var/www/vhosts/yourdomain.com/httpdocs/db/production.db` | SQLite database path (must be absolute) |
| `SMSALERT_USER` | No* | `your_username` | SMSAlert.co.in API username |
| `SMSALERT_PWD` | No* | `your_password` | SMSAlert.co.in API password |
| `SMSALERT_SENDER` | No | `NJWATR` | SMS sender ID (default: NJWATR) |
| `NEXTAUTH_SECRET` | Yes | (generated) | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `https://yourdomain.com` | Full URL of your production site |

*SMSAlert credentials are optional — without them, OTP works in dev mode (codes shown in API response for testing).

---

## 5. Database Setup

### SQLite Path Configuration

The `DATABASE_URL` must use an **absolute path** pointing to a writable location on the server:

```
DATABASE_URL=file:/var/www/vhosts/yourdomain.com/httpdocs/db/production.db
```

### Initialize the Database:

```bash
# On the server via SSH:
cd /var/www/vhosts/yourdomain.com/httpdocs

# Push the Prisma schema to create tables
npx prisma db push

# Seed initial data (admin user, products, videos, quizzes, etc.)
npm run seed
```

### Database Permissions:
Ensure the `db/` directory and `production.db` file are writable by the Node.js process user:
```bash
chmod 755 /var/www/vhosts/yourdomain.com/httpdocs/db/
chmod 644 /var/www/vhosts/yourdomain.com/httpdocs/db/production.db
```

### Backup:
SQLite is a single-file database — backup by copying the file:
```bash
cp db/production.db db/production.db.backup-$(date +%Y%m%d)
```

---

## 6. Build and Start Commands in Plesk

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

## 7. Domain and SSL Configuration

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

## 8. Troubleshooting

### Application won't start
- Check Plesk Node.js logs: **Domains > yourdomain.com > Logs**
- Check `logs/pm2-error.log` if using PM2
- Verify `PORT` is set (Plesk sets this automatically, but check)
- Verify `server.js` is in the application root
- Verify `.next/standalone/server.js` exists (run `npm run build:plesk` first)

### "Cannot find module" errors
- Ensure `npx prisma generate` was run before building
- Ensure `.next/standalone/node_modules/` exists and contains `@prisma/client`
- Try: `npm install && npx prisma generate && npm run build:plesk`

### "SQLite database not found"
- Verify `DATABASE_URL` uses an **absolute path** (not relative)
- Ensure the directory exists: `mkdir -p /var/www/vhosts/yourdomain.com/httpdocs/db`
- Ensure file permissions allow writing by the Node.js process
- Run `npx prisma db push` on the server to create the schema

### OTP not working
- Verify `SMSALERT_USER` and `SMSALERT_PWD` are set correctly
- Without SMS credentials, OTP still works in dev mode (code visible in API response)
- Check SMSAlert.co.in dashboard for delivery status

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
- Use PM2 cluster mode only if using an external database (not SQLite)
- Enable Plesk's Nginx caching for static assets
- Consider enabling Gzip/Brotli compression in Plesk

---

## 9. Quick Start Checklist

```
[ ] Node.js 18+ installed in Plesk
[ ] Plesk Node.js extension installed
[ ] Domain configured with SSL
[ ] Files uploaded to Plesk document root
[ ] .env.production configured with correct values
[ ] DATABASE_URL points to absolute SQLite path
[ ] NEXTAUTH_SECRET generated (openssl rand -base64 32)
[ ] NEXTAUTH_URL set to https://yourdomain.com
[ ] Prisma schema pushed to database (npx prisma db push)
[ ] Database seeded (npm run seed)
[ ] Build completed (npm run build:plesk)
[ ] Plesk Node.js app created with startup file = server.js
[ ] Application started and responding
[ ] Test OTP flow
[ ] Test admin login
[ ] Test product pages
[ ] Verify HTTPS redirect working
```
