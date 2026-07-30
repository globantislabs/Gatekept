---
Task ID: 1
Agent: main
Task: Fix WhatsApp OTP - remove dev mode notification, add lazy env var reading, update .env.production

Work Log:
- Fixed `src/lib/whatsapp-otp-service.ts` — Changed top-level const env vars to lazy getter functions (`getWhatsappToken()`, `getWhatsappPhoneNumberId()`, `getWhatsappBaseUrl()`) so they read at CALL TIME, not import time
- Fixed `src/lib/whatsapp-otp-service.ts` — Removed OTP code from API response message (was `OTP recorded (dev mode: code is 123456)`, now `OTP recorded. WhatsApp not configured — check server logs for dev OTP code.`)
- Fixed `src/lib/notification-service.ts` — Same lazy env var pattern for WhatsApp and SMS config
- Fixed `src/lib/smsalert-service.ts` — Same lazy env var pattern for SMS credentials; removed OTP code from response message
- Fixed `src/components/AuthWhatsAppOtpLogin.tsx` — Removed dev mode OTP toast notification
- Fixed `src/components/AuthPages.tsx` — Removed `devOtp` state variable and all references; removed `[DEV] OTP: xxx` toast notifications; removed "Dev mode — OTP: xxx" UI display
- Fixed `src/components/OtpVerifyModal.tsx` — Removed dev mode OTP toast notification
- Updated `.env.production` — Added real WhatsApp Business API credentials (WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID)

Stage Summary:
- OTP codes are NEVER exposed in API responses or frontend UI — security fix
- In dev mode, OTP is only logged to server console (not shown to user)
- All env vars use lazy getter functions for proper runtime loading in production
- WhatsApp credentials are now properly configured in .env.production

---
Task ID: 2
Agent: main
Task: Fix Prisma/MySQL production build for Plesk deployment

Work Log:
- Switched Prisma schema from SQLite to MySQL (`cp prisma/schema-mysql.prisma prisma/schema.prisma`)
- Regenerated Prisma client for MySQL (`npx prisma generate`)
- Built Next.js standalone app with MySQL schema (`npx next build`)
- Copied all necessary files to standalone build: static files, public, Prisma client, mysql2 driver, .env.production
- Verified standalone build includes: MySQL engine binary (`libquery_engine-debian-openssl-3.0.x.so.node`), mysql2 driver, .env.production with WhatsApp credentials
- Switched back to SQLite for local dev (`cp prisma/schema-sqlite.prisma prisma/schema.prisma && npx prisma generate`)
- Verified dev server still works with SQLite

Stage Summary:
- Production build is ready with MySQL Prisma client for Plesk
- The standalone build includes all necessary files for MySQL connectivity
- Dev environment continues to use SQLite as before

---
Task ID: 3
Agent: main
Task: WhatsApp OTP shown as site notification (dev-mode behavior), all OTP flows fixed, production build, git push

Work Log:
- Modified `src/lib/whatsapp-otp-service.ts` — Added `otp_code` field to sendOtp() return type; now returns OTP code in API response for frontend notification display (both when WhatsApp sends successfully and when credentials not configured)
- Modified `src/lib/smsalert-service.ts` — Added `otpCode` field to sendOtp() return type; now returns OTP code in API response for frontend notification display
- Modified `src/app/api/auth/whatsapp-otp/send/route.ts` — Added `otp_code` field to API response
- Modified `src/app/api/otp/send/route.ts` — Added `otp_code` field to API response
- Modified `src/app/api/auth/verify-email-otp/send/route.ts` — Changed from returning 503 error when email not configured to returning OTP code as notification; also returns otp_code when email is sent
- Modified `src/app/api/auth/forgot-password/route.ts` — Changed from returning 503 error when email/SMS not configured to returning OTP code as notification; also returns otp_code when email/SMS is sent
- Modified `src/components/AuthWhatsAppOtpLogin.tsx` — Shows OTP as toast notification with 15s duration when `data.otp_code` is present
- Modified `src/components/AuthPages.tsx` — Updated WhatsApp OTP, email OTP, and forgot-password OTP flows to show OTP as toast notification with 15s duration
- Modified `src/components/OtpVerifyModal.tsx` — Shows OTP as toast notification when `result.otp_code` is present
- Modified `src/lib/data-service.ts` — Added `otp_code` field to `OtpSendResponse` interface
- Verified login name is already optional in WhatsApp login flow (handleNameSkip exists)
- Verified product learning progress is already independent per product (user_id + product_id unique constraint)
- Built production bundle with MySQL schema (`npm run build:plesk`)
- Switched back to SQLite for local dev
- Committed and pushed to git (commit 4e830cb)

Stage Summary:
- All OTP flows (WhatsApp, SMS, email, forgot-password) now return otp_code in API response
- Frontend shows OTP as toast notification with 15s duration (dev-mode behavior)
- No more 503 errors when email/SMS services are not configured
- Production build with MySQL schema ready for Plesk deployment
- All changes pushed to git

---
Task ID: 4
Agent: main
Task: CRITICAL FIX — Remove OTP exposure from API/UI, fix WhatsApp OTP delivery to phone

Work Log:
- REVERTED all otp_code from API responses — OTP must NEVER be exposed in frontend
- FIXED WhatsApp template message: `index` field was string `"0"` instead of number `0`, causing API error (#131008)
- ADDED fallback: if template message fails, sends plain text WhatsApp message as fallback
- ADDED better error logging for WhatsApp API failures (logs full error JSON)
- Verified WhatsApp Business API works with production credentials (both template and plain text)
- Verified Zoho SMTP email service works for OTP delivery (tested via /api/test-email)
- WhatsApp OTP now properly delivered to user's phone via WhatsApp Business API
- Email OTP properly delivered via Zoho SMTP
- Production build with MySQL schema for Plesk deployment
- All changes pushed to git (commit ad2ca71)

Stage Summary:
- OTP is NEVER exposed in API responses or frontend UI — security fix
- WhatsApp OTP is delivered to user's phone via WhatsApp Business API
- Email OTP is delivered via Zoho SMTP
- If WhatsApp template fails, falls back to plain text message
- Root cause of WhatsApp failure: template `index` field was string "0" instead of number 0
