---
Task ID: 1
Agent: Main
Task: Fix quiz submit feature, radio button bug, and add campaign sales tracking

Work Log:
- Cloned https://github.com/globantislabs/Gatekept.git and explored the full codebase
- Identified the quiz submit bug: `completeQuiz()` in data-service.ts didn't create a `learning_progress` record when none existed (only updated if found), causing quiz data to be lost for auto-created users
- Identified auto-created users (via loginWithPhone/loginWithEmail/verifyOtp) didn't get learning_progress records
- Fixed `completeQuiz()` to create a learning_progress record if none exists
- Fixed `loginWithPhone()`, `loginWithEmail()`, and `verifyOtp()` to create learning_progress records when auto-creating users
- Fixed quiz radio button bug: `value={answers[current]?.toString()}` returned `undefined` when no answer selected, causing Radix UI RadioGroup to fall into uncontrolled mode and auto-check the first option. Changed to `value={answers[current] !== undefined ? answers[current].toString() : ""}`
- Fixed duplicate radio button IDs across questions by adding question index: `id={opt-${current}-${i}}`
- Improved QuizModule UI: added question navigation dots, better error handling, answer count tracking
- Added `campaignService.getCampaignSales()` method to data-service.ts that computes sales per campaign by linking QR scans → users → orders
- Updated CampaignManager to display sales count and revenue per campaign card
- Updated Campaign detail dialog to show Campaign Performance stats (QR Scans, Sales, Revenue) and recent orders list with conversion rate
- Build and lint pass cleanly

Stage Summary:
- Quiz submit now correctly saves data for all users (including auto-created ones)
- Quiz radio buttons no longer auto-select the first option
- Admin panel Campaign tab now shows sales count + revenue per campaign
- Campaign detail dialog shows full performance metrics including conversion rate and recent orders
