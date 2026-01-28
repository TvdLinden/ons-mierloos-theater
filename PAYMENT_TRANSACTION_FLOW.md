## Payment & Order Processing Transaction Flow

### Complete Order Lifecycle with Transactions & Job Queue

```
CHECKOUT PHASE
==============
User initiates checkout
    ↓
Validate cart items (date, availability)
    ↓
Group items by performance
    ↓
TRANSACTION #1 (Checkout with Row-Level Locking):
    ├─ SELECT ... FOR UPDATE on all performances
    │  (Acquires exclusive locks on performance rows)
    ├─ Validate seat availability with locked rows
    ├─ Create Order (pending status)
    ├─ Create Line Items
    ├─ Decrement available_seats for each performance
    ├─ Record coupon usage (if coupon applied)
    └─ Increment coupon usage_count
    │  (All changes committed atomically)
    ├─ Locks released at transaction end
    ↓
✅ Order created with seats reserved (no race condition possible)
    ↓
Try to create Mollie payment (inline)
    ↓
IF Mollie succeeds:
    ├─ Store payment record in database
    └─ Return payment URL to user → Redirect immediately ✅
    ↓
IF Mollie fails (timeout/down):
    ├─ Queue 'payment_creation' job
    ├─ Send queued payment email with:
    │   ├─ Order confirmation
    │   ├─ Clear instructions (5-minute timeline)
    │   ├─ 15-minute expiry warning
    │   └─ Link to order status page
    ├─ Redirect user to /order/[orderId]?email=xxx
    └─ Worker retries payment creation (exponential backoff)
    ↓
User either:
    ├─ Redirected to Mollie immediately (95% of cases) OR
    └─ Redirected to order status page → Receives email → Payment link ready (5%)

PAYMENT SUCCESS PHASE
====================
User completes payment on Mollie
    ↓
Mollie calls webhook: /api/webhooks/mollie
    ↓
Webhook queues 'payment_webhook' job (returns 200 OK in <100ms)
    ↓
Worker picks up job from queue
    ↓
Fetch payment from Mollie (or detect mock payment)
    ↓
Map Mollie status → Internal status (paid = succeeded)
    ↓
TRANSACTION #2 (Payment Status Update):
    ├─ Update payment status → succeeded
    ├─ Update order status → paid
    └─ [Both changes committed atomically]
    ↓
Call handlePaymentSuccess()
    ↓
TRANSACTION #3 (Ticket Generation):
    ├─ Fetch order + line items + performances
    ├─ For each line item:
    │   └─ Generate tickets atomically
    └─ [All tickets committed together]
    ↓
✅ Tickets generated and stored
    ↓
Send confirmation email (non-critical)
    ↓
✅ Order complete

PAYMENT FAILURE PHASE
====================
Payment fails on Mollie (failed/expired/cancelled)
    ↓
Mollie calls webhook: /api/webhooks/mollie
    ↓
Webhook queues 'payment_webhook' job (returns 200 OK in <100ms)
    ↓
Worker picks up job from queue
    ↓
Fetch payment from Mollie
    ↓
Map status → Internal status (failed/cancelled)
    ↓
Call handlePaymentFailure()
    ↓
Validate order is still pending (idempotency check)
    ↓
Fetch line items and coupon usages for order
    ↓
Group quantities by performance
    ↓
TRANSACTION #4 (Seat & Coupon Release):
    ├─ For each performance:
    │   └─ Increment available_seats by quantity
    ├─ Delete coupon_usages records for order
    ├─ For each coupon used:
    │   └─ Decrement coupons.usage_count
    ├─ Update order status → failed
    └─ [All changes committed atomically]
    ↓
✅ Seats released back to performances
    ↓
TRANSACTION #5 (Payment Status Update):
    ├─ Update payment status → failed
    ├─ Update order status → failed
    └─ [Both changes committed atomically]
    ↓
✅ Order marked as failed

ORPHANED ORDER CLEANUP (Background Job - Runs Daily)
====================================================
Cron/scheduled job finds orders:
    ├─ Status = 'pending'
    ├─ Created > 24 hours ago
    └─ No active payment (or payment not pending/processing)
    ↓
For each orphaned order:
    ↓
TRANSACTION #6 (Orphaned Order Cleanup):
    ├─ Release all seats back to performances
    ├─ Delete coupon_usages records
    ├─ Decrement coupon usage_count
    ├─ Mark order as 'cancelled'
    └─ Mark any payments as 'cancelled'
    ↓
✅ Prevents seat/coupon leaks from incomplete checkouts
```

### Key Transaction Boundaries

#### Transaction #1: Order Creation with Seat Reservation

**File:** `app/checkout/actions.ts::processCheckout()`
**Locking:** `SELECT ... FOR UPDATE` on performances table
**Guarantees:**

- Acquires exclusive row-level locks on all performances before validation
- Validation and seat decrement are protected by locks (no race conditions)
- Order created AND line items created AND seats decremented atomically
- All succeed together or all fail together (rollback)
- No orphaned orders with undecremented seats
- No concurrent overselling possible (only one checkout per performance at a time)
- Locks released automatically at transaction end

#### Transaction #2: Payment Status Update

**File:** `lib/commands/payments.ts::handleMollieWebhook()`
**Guarantees:**

- Payment status and order status updated together
- Consistent state: payment and order have matching status

#### Transaction #3: Ticket Generation

**File:** `lib/commands/payments.ts::handlePaymentSuccess()`
**Guarantees:**

- All tickets for an order generated atomically
- If any ticket generation fails, none are committed
- Non-critical email send is outside transaction (won't block tickets)

#### Transaction #4: Seat & Coupon Release on Failure

**File:** `lib/commands/payments.ts::handlePaymentFailure()`
**Guarantees:**

- All seats released atomically for order
- All coupons released atomically (records deleted + usage count decremented)
- Order status updated together with seat and coupon release
- Idempotency check prevents duplicate releases
- GREATEST(0, usage_count - 1) prevents negative usage counts

#### Transaction #5: Payment Status Update After Failure

**File:** `lib/commands/payments.ts::handleMollieWebhook()`
**Guarantees:**

- Payment marked failed AND order marked failed
- Consistent state for audit trail

### Atomicity Protections

✅ **Checkout Phase - Row-Level Locking**

- `SELECT ... FOR UPDATE` acquires exclusive locks on all performances
- Validation and seat decrement are protected by locks (zero race conditions)
- Seats reserved only if entire order can be created
- Coupons recorded atomically with order creation
- No partial orders with some seats reserved or orphaned coupon usages
- Concurrent overselling **impossible** (tested and guaranteed by PostgreSQL)

✅ **Payment Success Phase**

- Payment status updated before ticket generation
- If email fails, tickets still exist (already committed)
- User receives confirmation via success page regardless of email

✅ **Payment Failure Phase**

- Seat release happens atomically
- Coupon usage deleted and counts decremented atomically
- Order status updated together with seat and coupon release
- Idempotency check prevents double-release
- No orphaned coupon usages on payment failure

✅ **Concurrent Access**

- `SELECT ... FOR UPDATE` acquires exclusive row-level locks
- Only one transaction can modify a performance row at a time
- Lock acquisition is ordered (no deadlocks)
- PostgreSQL automatically queues waiting transactions
- Fair, first-come-first-served access pattern

### Error Handling & Resilience

**Checkout Errors:**

- If seat validation fails → return error, no order created
- If seat reservation fails → transaction rolls back, no state changed

**Payment Webhook Errors:**

- If payment failure handling throws → error logged, still updates status
- If email fails → tickets already generated, user can access them via account
- If ticket generation fails → thrown to webhook handler for retry

**Failure Idempotency:**

- Check `order.status !== 'pending'` before releasing seats
- Prevents double-release if webhook called twice

### Testing Scenarios

```typescript
// Test 1: Normal success flow
checkout() → payment.succeed() → tickets generated ✅

// Test 2: Payment failure with coupon
checkout(with coupon) → payment.fail() → seats + coupon released ✅

// Test 3: Concurrent overselling prevention (WITH ROW-LEVEL LOCKS)
checkout(5 seats) + checkout(5 seats) [simultaneous]
→ User A acquires lock, validates, creates order, decrements seats to 2
→ User B waits for lock
→ User B acquires lock, validates (only 2 seats left), fails ✅
→ Result: One succeeds, one fails with "not enough seats" ✅

// Test 4: Email failure doesn't block tickets
checkout() → payment.succeed() → email fails
→ Tickets still generated and accessible ✅

// Test 5: Double webhook call (idempotency)
payment.fail() [webhook called twice]
→ First call releases seats
→ Second call detects order.status != 'pending', skips release ✅

// Test 6: Lock timeout (heavy load simulation)
100 simultaneous checkouts on performance with 50 seats
→ PostgreSQL queues transactions in order
→ First 50 checkouts succeed, rest fail
→ All operations atomic, no data corruption ✅
```

### Job Queue Architecture (NEW)

#### Why Job Queue?

**Problem:** Payment provider (Mollie) downtime blocks checkout

**Solution:** Queue jobs for retry with exponential backoff

#### Job Types

1. **`payment_creation`** - Retry Mollie payment creation when API is down
2. **`payment_webhook`** - Process webhook asynchronously (fast response to Mollie)
3. **`orphaned_order_cleanup`** - Daily cleanup of abandoned orders

#### Worker Design

**File:** `lib/jobs/worker.ts`

- Polls database every 5 seconds
- Processes jobs with exponential backoff (5s → 10s → 20s → 40s → 80s)
- Max 5 retry attempts before marking as failed
- Runs locally (`npm run worker`) or in Cloud Run
- Graceful shutdown handling

#### Replaces GitHub Actions

The job queue system **completely replaces** the old GitHub Actions workflows:

| Old (GitHub Actions) | New (Job Queue) |
|---------------------|-----------------|
| Hourly polling | Real-time webhooks |
| No retry logic | Exponential backoff |
| ❌ No seat release | ✅ Atomic seat + coupon release |
| ❌ Cancels orders only | ✅ Releases seats + coupons |
| Up to 1 hour delay | <5 seconds processing |
| GitHub Actions logs | Admin dashboard `/admin/jobs` |

**Files to Delete After 1-2 Week Monitoring:**
- `.github/workflows/sync-payments.yml`
- `.github/workflows/sync-orders.yml`
- `.github/workflows/sync-inventory.yml`

See `IMPLEMENTATION_GUIDE.md` "Deprecated: GitHub Actions for Payment Sync" section for detailed comparison and migration timeline.

#### Transaction #6: Orphaned Order Cleanup

**File:** `lib/jobs/handlers/orphanedOrderCleanupHandler.ts`
**Trigger:** Daily scheduled job
**Guarantees:**

- Finds orders stuck in 'pending' > 24 hours
- Releases seats atomically
- Releases coupons atomically
- Marks order and payments as 'cancelled'
- Prevents seat/coupon leaks from incomplete checkouts

### Order Status Page (Public Access)

**Route:** `/order/[orderId]?email=xxx`

**Purpose:** Allow users to check order status without login

**Features:**
- View order details (order number, amount, status)
- See payment status with clear messaging
- Click payment link if available
- Order status badges with color coding
- Works for authenticated and unauthenticated users

**Security:**
- Order IDs are UUIDs (hard to guess)
- Optional email verification parameter
- Shows limited info (no sensitive data)

**Status Messages:**
| Status | Message | Action |
|--------|---------|--------|
| `pending` + payment URL | ⏱️ Betaling vereist | Button: "Betalen →" |
| `pending` + no payment URL | 🔄 Betaallink wordt aangemaakt | Info: Check email in 5 min |
| `paid` | ✅ Betaling ontvangen | Info: Tickets sent via email |
| `failed`/`cancelled` | ❌ Bestelling geannuleerd | Link: Back to homepage |
| `refunded` | 💰 Betaling teruggestort | Info: 3-5 business days |

### Mock Payment Support

**Environment Variable:** `USE_MOCK_PAYMENT=true`

**How It Works:**
- Payment creation handler detects mock mode
- Generates mock payment ID: `mock_1234567890_abc123`
- Stores payment with `paymentProvider: 'mock'`
- Webhook handler detects mock payments
- Automatically treats mock payments as 'paid'
- No Mollie API calls required

**Benefits:**
- ✅ Local testing without Mollie credentials
- ✅ Same code paths as production
- ✅ Full job queue testing
- ✅ Fast development iteration

### Admin Jobs Dashboard

**Route:** `/admin/jobs`

**Purpose:** Monitor background job processing

**Features:**
- Real-time statistics (total, pending, processing, completed, failed, last 24h)
- Filter by status (pending, processing, failed)
- Filter by type (payment_creation, payment_webhook, orphaned_order_cleanup)
- Job details table (ID, type, status, attempts, created, next retry, error message)
- Shows first 100 results

**Monitoring Capabilities:**
- Track payment creation retries
- Identify failed jobs and error patterns
- Monitor webhook processing speed
- Verify orphaned order cleanup runs
- Debug job queue issues

**Key Metrics:**
- Pending count (should be low in healthy system)
- Failed jobs (investigate if > 5% of total)
- Execution attempts (track retry patterns)
- Next retry timing (verify exponential backoff)

### Benefits of This Architecture

1. **No Data Corruption** - Transactions ensure consistency
2. **No Overselling** - `SELECT ... FOR UPDATE` prevents race conditions
3. **No Seat Leaks** - Payment failures release seats back
4. **Idempotent** - Safe to retry webhook calls
5. **Auditable** - Clear status transitions (pending → paid OR failed)
6. **Resilient** - Email failures don't block critical operations
7. **Observable** - Detailed logging at each transaction boundary
8. **Scalable** - Row-level locks handle concurrent load fairly
9. **Payment Provider Resilience** - Job queue handles Mollie downtime gracefully
10. **Fast Webhook Response** - <100ms response prevents Mollie retries
11. **Automatic Cleanup** - Orphaned orders don't leak seats/coupons
12. **Better UX** - Inline payment (95%) with email fallback (5%)
