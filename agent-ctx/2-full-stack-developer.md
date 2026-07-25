# Task 2 — WhatsApp OTP Login System

## Agent: full-stack-developer

## Work Summary

Created a complete WhatsApp OTP login system for the NOTJUST Watr app, including backend service, API routes, UI component, and integration.

### Files Created

1. **`src/lib/whatsapp-otp-service.ts`** — Backend WhatsApp OTP service
   - Uses WhatsApp Business API v19.0 with exact payload format (otp_verification template, body + button components)
   - URL: `https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages`
   - Auth: `Bearer {WHATSAPP_TOKEN}`
   - Generates 6-digit OTP, hashes with SHA-256, stores in `OtpVerification` model
   - Phone format: accepts Indian 10-digit numbers, adds 91 prefix for WhatsApp
   - Methods: `sendOtp()`, `verifyOtp()`, `loginWithOtp()`
   - loginWithOtp finds existing user by phone or creates new one

2. **`src/lib/email-service.ts`** — Zoho email service (backend-only)
   - Uses nodemailer with Zoho SMTP (smtp.zoho.com:465, SSL)
   - Dynamic import for nodemailer (satisfies lint rules)
   - Methods: `sendOtpEmail()`, `sendNotificationEmail()`, `isConfigured()`
   - Dev mode fallback: logs to console if SMTP not configured

3. **`src/app/api/auth/whatsapp-otp/send/route.ts`** — POST endpoint
   - Accepts { phone, purpose }
   - Returns { success, otp_id, message, phone_masked }

4. **`src/app/api/auth/whatsapp-otp/verify/route.ts`** — POST endpoint
   - Accepts { otp_id, otp_code }
   - Returns { success, message }

5. **`src/app/api/auth/whatsapp-otp/login/route.ts`** — POST endpoint
   - Accepts { otp_id, phone, name }
   - Returns { success, user, is_new, message }
   - Sets session cookies (session_token, user_id)

6. **`src/components/AuthWhatsAppOtpLogin.tsx`** — UI component
   - 3-step flow: phone input → OTP verification → success
   - Step 1: Name (optional) + Phone input + WhatsApp green (#25D366) "Send WhatsApp OTP" button
   - Step 2: OTP entry with InputOTP (6 digits) + Verify & Login button + Resend with 30s cooldown + Change phone number link
   - Step 3: Success animation with CheckCircle, auto-redirect after 2s
   - Links to auth-login and auth-register at bottom of each step
   - Uses useAppStore for navigation and setUser
   - Dev mode: shows OTP code in toast for testing

### Files Modified

7. **`src/store/app-store.ts`** — Added `'auth-whatsapp-otp'` to AppView type union

8. **`src/app/page.tsx`** — Added import and case for AuthWhatsAppOtpLogin

9. **`src/components/AuthPages.tsx`** — 
   - Added `MessageCircle` to lucide-react imports
   - Added WhatsApp OTP button between Login button and Separator
   - Button: outline variant, WhatsApp green color (#25D366)

10. **`.env`** — Added all production credentials:
    - WhatsApp: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
    - Zoho: ZOHO_SMTP_HOST, ZOHO_SMTP_PORT, ZOHO_EMAIL, ZOHO_PASSWORD
    - SMSAlert: SMSALERT_ACTIVE=false (disabled), SMSALERT_USER, SMSALERT_PWD, SMSALERT_SENDER
    - Auth: NEXTAUTH_SECRET, NEXTAUTH_URL

11. **`src/lib/smsalert-service.ts`** — Added SMSALERT_ACTIVE check at beginning of sendOtp method
    - If `'false'` or empty, throws error: "SMS OTP is currently inactive. Please use WhatsApp OTP instead."

### Package Added

12. **nodemailer** (v9.0.3) — Installed for Zoho email service

### Lint Results

- Only pre-existing error in Gatekept/examples/websocket/frontend.tsx remains
- No new lint errors from this task's code

### Dev Server Status

- Compiles and runs successfully (HTTP 200)
- All new API routes compile correctly
