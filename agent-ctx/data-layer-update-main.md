# Data Layer Update - Task Summary

## Task ID: data-layer-update

## Changes Made

### File 1: `/home/z/my-project/src/lib/mock-supabase.ts`

**Interface Updates:**
- `QuizQuestion`: Added `product_id?: string` field
- `Product`: Added `subscription_price?: number`, `subscription_interval?: 'MONTHLY' | 'QUARTERLY'`, `has_subscription: boolean` fields
- `Order`: Added `order_type: 'one-time' | 'subscription'` field
- Added new `ProductVideo` interface with: id, product_id, title, url, order_index, duration?, created_at
- Added new `Subscription` interface with: id, user_id, product_id, status, amount, interval, start_date, next_billing_date, created_at

**TableName & Data Store Updates:**
- Added `'product_videos'` and `'subscriptions'` to `TableName` union type
- Added `product_videos: []` and `subscriptions: []` to `MockDataStore` data initialization

**Seed Data:**
- Updated product seed data: prod_001 has subscription_price: 2499, prod_002 has subscription_price: 1999, both MONTHLY interval, has_subscription: true
- Added 6 product_videos (3 per product with realistic titles and placeholder URLs)
- Added 4 subscriptions (2 ACTIVE, 1 PAUSED, 1 CANCELLED)
- Updated all 18 orders with `order_type` field (mix of 'one-time' and 'subscription')
- Bumped DB version from 'v5' to 'v6' for reseed

### File 2: `/home/z/my-project/src/lib/data-service.ts`

**Import & Export Updates:**
- Added `ProductVideo` and `Subscription` to imports and re-exports

**New Services:**
- `productVideoService` with methods: getByProduct(), create(), update(), delete(), reorder()
- `subscriptionService` with methods: create(), getByUser(), cancel(), pause(), resume(), getAll()

**Existing Service Updates:**
- `productService`: Added create() and update() methods
- `quizService`: Added updateQuestion(), deleteQuestion(), getByProduct() methods
- `orderService.create()`: Now accepts `purchaseType` in items, `orderType` parameter; calculates subscription pricing correctly

### File 3: `/home/z/my-project/src/store/app-store.ts`

**CartItem Interface:**
- Added `subscriptionPrice?: number`
- Added `purchaseType: 'one-time' | 'subscription'`
- Added `subscriptionInterval?: string`

**cartTotal() Update:**
- Now uses subscriptionPrice when purchaseType is 'subscription' and subscriptionPrice is available
