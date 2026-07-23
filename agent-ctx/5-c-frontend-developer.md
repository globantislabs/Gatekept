---
Task ID: 5-c
Agent: frontend-developer
Task: Create AuthPages.tsx and ProfilePage.tsx

Work Log:
- Read worklog.md to understand previous context (Task 1: project setup, Task 2: API routes)
- Read app-store.ts to understand navigation/state management (AppView types, setUser, navigateTo, goBack)
- Read data-service.ts to understand auth/user services (authService.login, authService.register, userService.update, productLearningService)
- Read existing AuthLogin, AuthRegister, and ProfileView implementations in page.tsx (OTP-based auth, basic profile)
- Read API routes for auth/login and auth/register to understand what fields are supported (email/phone + password login, full register with name/email/phone/password/age/gender/country/state)
- Read shadcn/ui component files: dialog.tsx, sheet.tsx, avatar.tsx, select.tsx

Changes Made:

1. Updated data-service.ts authService:
   - login() now accepts identifier (email or phone) + password, auto-detects type
   - register() now accepts full fields: name, email, phone, password, age, gender, country, state
   - Both return { user, token } consistent types

2. Created AuthPages.tsx with two exported components:
   - AuthLogin: Clean card-based form with email/phone input, password input, show/hide toggle, error display, admin note, "Register instead" link
   - AuthRegister: Clean card-based form with name, email, phone, password (with show/hide), age, gender (Select dropdown), state (Indian states dropdown), validation, "Login instead" link
   - Both use framer-motion fadeInUp animation, brand colors, proper error handling (rate limiting, invalid credentials, duplicate accounts)
   - Password fields are type="password" with Eye/EyeOff toggle
   - Mobile responsive: max-w-md centered, min 44px touch targets
   - Error messages sanitized (no internal details exposed)

3. Created ProfilePage.tsx with exported ProfilePage component:
   - Full user profile display with Avatar (circle with initials using getInitials helper)
   - ALL user fields: Name, Email, Phone, Age, Gender, Country, State, User ID, Admin status, Join date
   - Admin badge (Shield icon + blue color) if is_admin
   - Learning Complete badge if learning_completed
   - Learning progress card: shows ProductLearningProgress per product with video progress bars, quiz scores, completion badges, pass/fail indicators
   - Account Details card with grid of DetailItem helpers
   - Back button (goBack) and Logout button (setUser(null) + navigateTo('landing'))
   - Edit Profile button opens dialog/sheet:
     - Desktop: Dialog component with max-w-md
     - Mobile: Sheet component from bottom (90vh height)
     - Edit form: Name, Email, Phone, Age, Gender (Select), State (Indian states Select)
     - Save calls userService.update(userId, data) with admin header
     - Cancel closes dialog
   - Mobile responsive: md:grid-cols-3 layout, responsive grid, min 44px touch targets

4. Updated page.tsx:
   - Added imports for AuthLoginNew, AuthRegisterNew from AuthPages
   - Added import for ProfilePageNew from ProfilePage
   - Updated renderView switch: auth-login → AuthLoginNew, auth-register → AuthRegisterNew, profile → ProfilePageNew

Verification:
- Lint passes (only pre-existing errors in Gatekept/examples and page.tsx UrlSyncHandler, none in new files)
- Dev server compiles successfully (200 responses, no errors)
- All API routes working correctly (products, auth, learning progress queries confirmed in dev log)

Stage Summary:
- AuthPages.tsx: Complete login/register with password-based auth, proper validation, brand styling, responsive
- ProfilePage.tsx: Full profile display with learning progress, admin badge, edit dialog (Desktop Dialog / Mobile Sheet)
- Both components follow task spec exactly: brand colors, shadcn/ui components, framer-motion, sonner toast, mobile responsive, security best practices
