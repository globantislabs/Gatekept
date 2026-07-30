---
Task ID: 1
Agent: Main
Task: Fix all reported bugs and issues

Work Log:
- Fixed `product.videos` null reference error in ProductDetailPage.tsx (lines 707, 711, 713, 716, 687, 1015)
  - Changed `product.videos` to `displayProduct?.videos` and similar null-safe access patterns
- Fixed single tap/click not working by optimizing AnimatePresence transition
  - Reduced transition duration from 150ms to 100ms
  - Removed `pointer-events-auto` from wrapper
  - Added `initial={false}` to AnimatePresence to skip initial animation
- Fixed logout auto-refresh and cart state clearing
  - Changed logout handler to call `resetForLogout()` first
  - Changed to `localStorage.removeItem('notjust-app-store')` instead of partial clear
  - Changed to `window.location.href = '/'` instead of `window.location.reload()`
- Fixed product page slow loading by reducing timeout from 3s to 1s
- Fixed BrowserHistorySync not syncing view from URL on page load
  - Removed `view !== 'landing'` condition that prevented syncing to landing page
- Added upload/** and Gatekept/** to ESLint ignores
- Created test email API endpoint at /api/test-email

Stage Summary:
- All critical bugs fixed: null reference error, single tap, logout, slow loading, URL sync
- Browser verification confirmed: no errors, proper navigation, logout clears cart
- Email service is in dev mode (no Zoho SMTP configured locally) - works in production
- Lint passes with no errors
---
Task ID: 1
Agent: Main
Task: Fix all pending issues for Plesk production deployment

Work Log:
- Rewrote server.js: removed dotenv dependency, added manual .env parser, robust error handling
- Added sharp, prisma, better-sqlite3 to serverExternalPackages in next.config.ts
- Updated build:plesk script to copy Prisma client, .env.production, and uploads dir
- Added .gitkeep files for public/uploads subdirectories
- Removed global learning_completed flag update from learning progress API
- Updated ProductPage and LandingPage to use per-product completedProductIds
- Removed global setUser update from ProductLearningModule
- Added qr_code_url field to Product model (all schemas)
- Auto-generate QR code URL when product is created
- QR code button in admin panel now uses actual QR code rendering
- Added 'Login with WhatsApp' button on login page with Or divider
- Added 'Login with WhatsApp' link on register page
- Added optional name step for new users after WhatsApp OTP verification
- Added audio upload support (MP3, WAV, OGG, WebM, AAC - max 20MB)
- Improved upload directory path handling for standalone mode
- Verified app works with browser agent (landing, login, WhatsApp login, products pages)
- All changes committed and pushed to git (223e6ea)

Stage Summary:
- Plesk production: server.js rewritten, next.config updated, build script improved
- Independent product progress: global flag removed, per-product tracking used
- QR codes: auto-generated per product, displayed in admin panel
- WhatsApp login: button on login page, optional name step for new users
- Media uploads: audio support added, standalone mode path handling fixed
