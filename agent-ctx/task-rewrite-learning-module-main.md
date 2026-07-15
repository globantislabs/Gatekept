# Task: Rewrite ProductLearningModule.tsx with Sequential Video→Quiz Flow

## Summary
Completely rewrote `ProductLearningModule.tsx` to implement a unified sequential learning flow:
**Video 1 → Quiz 1 → Video 2 → Quiz 2 → Video 3 → Quiz 3 → Product Unlocked!**

## Changes Made

### 1. `/home/z/my-project/src/components/ProductLearningModule.tsx` (Complete Rewrite)
- **Removed**: Separate `ProductQuizModule` export (no longer needed)
- **Added**: Unified `ProductLearningModule` with a single sequential flow
- **Step types**: `LearningStep = { type: 'video', videoIndex } | { type: 'quiz', videoIndex } | { type: 'completed' }`
- **Step Progress Indicator**: Visual bar at top showing V1→Q1→V2→Q2→V3→Q3 with current step highlighted, past steps in lime, locked steps grayed
- **Video Step**: Simulated video player with play/pause, seek bar, progress tracking. Video must reach 100% before "Take Quiz" button appears
- **Quiz Step**: Fetches questions via `productQuizService.getByVideo(videoId)`, shows 5 questions one at a time with radio buttons, requires 4/5 (80%) to pass
- **Pass handling**: Auto-advances to next video (or completed state if all quizzes passed)
- **Fail handling**: Shows incorrect answers with review, offers "Re-watch Video & Retry Quiz" button that resets to the video step
- **Completed Step**: Trophy icon, congratulations message, summary of all completed steps, "Browse Products" button
- **Progress persistence**: Uses `productLearningService.updateVideoProgress()` and `productLearningService.submitQuiz()` to save progress
- **Resume support**: On load, checks saved progress and determines the correct starting step

### 2. `/home/z/my-project/src/app/page.tsx` (2 edits)
- **Line 58**: Changed import from `{ ProductLearningModule, ProductQuizModule }` to `{ ProductLearningModule }`
- **Line 5132-5133**: Removed `case 'product-quiz': return <ProductQuizModule />` from renderView switch

## Key Design Decisions
- Single component handles all steps internally (no navigation to separate quiz page)
- `passedQuizzes` state tracks which video indices have had their quiz passed
- Step unlock logic: Video N+1 unlocks only after Quiz N is passed; Quiz N unlocks only after Video N is 100% watched
- Quiz questions are fetched per-video using `productQuizService.getByVideo()` instead of `productQuizService.getByProduct()`
- The `product-quiz` AppView type remains in the store but is no longer routed to in page.tsx
