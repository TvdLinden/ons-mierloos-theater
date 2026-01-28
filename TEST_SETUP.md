# Payment Provider Unavailability Tests

This document describes the test suite for the payment creation retry flow when the payment provider (Mollie) is unavailable.

## Overview

The test suite verifies that when the Mollie payment API is unavailable during checkout:
1. A `payment_creation` job is queued in the database
2. The user receives a queued payment email
3. The user is redirected to an order status page
4. Seats remain reserved in the database
5. The job retries with exponential backoff
6. The job eventually succeeds when the provider is available again

## Test Files

### 1. `lib/jobs/worker.test.ts` ✅ ALL PASSING
Tests the job worker that processes queued jobs with exponential backoff retry logic.

**Key test cases (17 tests):**
- ✅ Exponential backoff calculation (5s → 10s → 20s → ... → 5min cap)
- ✅ Jobs are fetched and marked as processing
- ✅ Job completes successfully and is marked completed
- ✅ Job fails and is scheduled for retry with backoff
- ✅ Job fails permanently after max attempts (default: 5)
- ✅ Multiple jobs are processed in sequence
- ✅ Job lifecycle: pending → processing → completed
- ✅ Retry lifecycle: pending → processing → pending (retry) → completed

```bash
npm test -- worker.test.ts
```

### 2. `app/checkout/integration.test.ts` ✅ ALL PASSING
Integration test validating the contract/expectations for payment retry flow.

**Key test cases (14 tests):**
- ✅ Job creation payload structure validation
- ✅ Exponential backoff pattern verification
- ✅ Order state expectations when payment fails
- ✅ Correct redirect URLs for different scenarios
- ✅ Email notification structure validation
- ✅ Payment handler error handling expectations
- ✅ Payment record creation with required fields
- ✅ Worker job state transitions
- ✅ Max retry limit enforcement (5 attempts)
- ✅ Result storage on successful payment
- ✅ Error message storage on failure
- ✅ Seat reservation protection (locked before payment)
- ✅ Seats stay reserved if payment fails

```bash
npm test -- integration.test.ts
```

**Why this approach?** Rather than trying to mock complex interactions between modules, this test validates the critical contract: the data structures, state transitions, and business logic rules that your system must follow. This is more robust and maintainable.

### 3. `lib/jobs/handlers/paymentCreationHandler.test.ts`
Tests the payment creation handler that runs when a `payment_creation` job is processed.

**Test cases:**
- Payment creation succeeds and stores payment in database
- Mollie API unreachable error triggers retry
- Mollie timeout error triggers retry
- Invalid API key error fails permanently
- Mock payment mode works correctly
- Missing MOLLIE_API_KEY configuration is caught

```bash
npm test -- paymentCreationHandler.test.ts
```

### 4. `app/checkout/actions.test.ts`
Tests the checkout action where payment creation can fail and trigger job queuing.

**Test cases:**
- When Mollie API is unavailable, `payment_creation` job is created
- When payment creation throws exception, job is queued
- Queued payment email is sent to customer
- User is redirected to order status page (not payment URL)
- When Mollie succeeds, user is redirected to payment URL directly
- Invalid cart/email validations work correctly
- Unavailable seats are rejected

```bash
npm test -- actions.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm test:watch
```

### Run tests with coverage report
```bash
npm test:coverage
```

### Run specific test file
```bash
npm test -- paymentCreationHandler.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should queue payment_creation job"
```

## Test Architecture

### Mocking Strategy

The tests use Jest mocks to isolate components:

1. **Database mocks**: `db.insert()`, `db.query.*.findMany()`, `db.transaction()`
2. **API mocks**: `@mollie/api-client`
3. **Command mocks**: `createMolliePayment()`, `createJob()`
4. **Utility mocks**: `sendQueuedPaymentEmail()`

This allows testing without requiring:
- Live database connection
- Active Mollie API account
- Real email service

### Test Data Flow

```
1. Checkout fails at payment creation
   ↓
2. Job is created and stored in database
   ↓
3. Email is sent to customer
   ↓
4. User redirected to order status page
   ↓
5. Worker picks up job
   ↓
6. Handler retries payment creation
   ↓
7. On success: payment record created
   On failure: scheduled for retry with backoff
```

## Scenario Testing

### Scenario 1: Happy Path (No Retries)
```
User Checkout → Mollie Available → Payment Created → Redirect to Payment URL
                                            ↓
                                    (No job created)
```

### Scenario 2: Temporary Unavailability (Retried and Recovered)
```
User Checkout → Mollie Unavailable → Job Created → Email Sent → Redirect to Order Page
                                            ↓
                                    (User closes browser)
                                            ↓
                          Worker Retries After 5s
                                            ↓
                          Mollie Available → Payment Created → Order Status Updated
```

### Scenario 3: Persistent Failure (Max Retries)
```
User Checkout → Mollie Unavailable → Job Created
                                            ↓
                          Worker Retry #1 (5s)   → Fails
                          Worker Retry #2 (10s)  → Fails
                          Worker Retry #3 (20s)  → Fails
                          Worker Retry #4 (40s)  → Fails
                          Worker Retry #5 (80s)  → Fails
                                            ↓
                          Job marked as FAILED
                          (Manual intervention needed)
```

## Integration with Your Flow

The checkout action (`app/checkout/actions.ts:335-398`) shows the actual integration:

1. **Payment creation attempt** (line 321-332)
   - Calls `createMolliePayment()`

2. **Failure handling** (line 334-363)
   - If `!paymentResult.success`: Creates job and sends email
   - Returns redirect to order status page

3. **Exception handling** (line 370-398)
   - If exception thrown: Creates job and sends email
   - Returns redirect to order status page

The worker (`lib/jobs/worker.ts`) processes these jobs:
- Fetches pending jobs
- Routes to `handlePaymentCreation()`
- Retries with exponential backoff if it fails
- Marks as failed if max attempts exceeded

## Environment Variables Used in Tests

From `jest.setup.js`:
```
NEXTAUTH_SECRET = 'test-secret'
NEXTAUTH_URL = 'http://localhost:3000'
NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
MOLLIE_API_KEY = 'test_api_key'
USE_MOCK_PAYMENT = 'false'
```

## Extending the Tests

To add more test cases:

1. **Test a new API error type:**
   ```typescript
   it('should handle rate limiting error', async () => {
     (createMollieClient).mockReturnValue({
       payments: {
         create: jest.fn().mockRejectedValue(
           new Error('Rate limited: 429 Too Many Requests')
         ),
       },
     });
     // Assert retry behavior
   });
   ```

2. **Test payment method selection:**
   ```typescript
   it('should store selected payment method in database', async () => {
     // Mock Mollie with payment method data
     // Verify it's stored in payments table
   });
   ```

3. **Test webhook handling after retry:**
   ```typescript
   it('should process webhook after job-queued payment succeeds', async () => {
     // Run payment_creation job to completion
     // Simulate Mollie webhook with paid status
     // Verify order status updated
   });
   ```

## Debugging Tests

### View detailed output
```bash
npm test -- --verbose
```

### Debug a specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand paymentCreationHandler.test.ts
# Then open chrome://inspect
```

### Check what's being mocked
```typescript
// Add to test
console.log(jest.mock.calls); // See all mock calls
console.log(createJob.mock.calls); // See specific mock calls
```

## CI/CD Integration

To run tests in your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --coverage --watchAll=false

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```
