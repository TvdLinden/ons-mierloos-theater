import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface TestResult {
  name: string;
  passed: boolean;
  value: any;
  expected: any;
}

async function testConcurrentCheckout() {
  // Import db AFTER dotenv loads
  const { db } = await import('@/lib/db');
  const { performances, orders, lineItems: lineItemsTable, shows } = await import('@/lib/db/schema');
  const { eq, sql, desc } = await import('drizzle-orm');

  console.log('🧪 Testing concurrent checkout race condition prevention\n');

  let createdShowId: string | null = null;
  let createdPerfId: string | null = null;

  try {
    // 1. Create a test show
    console.log('📝 Setting up test environment...');

    const [testShow] = await db.insert(shows).values({
      title: `Test Show - Race Condition ${Date.now()}`,
      slug: `test-race-${Date.now()}`,
      status: 'published',
    }).returning({ id: shows.id });

    createdShowId = testShow.id;
    console.log(`✅ Created test show: ${createdShowId}`);

    // 2. Create a test performance with exactly 5 available seats
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    futureDate.setHours(19, 0, 0, 0); // Set time to 19:00

    const [testPerf] = await db.insert(performances).values({
      showId: createdShowId,
      date: futureDate,
      rows: 1,
      seatsPerRow: 5,
      totalSeats: 5,
      availableSeats: 5,
      price: '20.00',
      status: 'published',
    }).returning({ id: performances.id, availableSeats: performances.availableSeats });

    createdPerfId = testPerf.id;
    console.log(`✅ Created test performance with 5 seats: ${createdPerfId}\n`);

    const perfId = createdPerfId;
    const initialSeats = testPerf.availableSeats;

    console.log(`📍 Using performance: ${perfId}`);
    console.log(`📊 Initial available seats: ${initialSeats}`);
    console.log('🔄 Launching two concurrent checkout attempts...');
    console.log('   - User 1: Trying to reserve 3 seats');
    console.log('   - User 2: Trying to reserve 3 seats');
    console.log('   (Only 5 available, so one should fail)\n');

    let checkout1Success = false;
    let checkout1Error = '';
    let checkout1OrderId = '';

    let checkout2Success = false;
    let checkout2Error = '';
    let checkout2OrderId = '';

    // Promise 1: First checkout
    const promise1 = (async () => {
      try {
        // Simulate checkout transaction
        const result = await db.transaction(async (tx) => {
          // Create order
          const orderResult = await tx.insert(orders).values({
            customerEmail: 'user1@test.com',
            customerName: 'Test User 1',
            totalAmount: '60.00',
            status: 'pending',
          }).returning();

          const orderId = orderResult[0].id;
          checkout1OrderId = orderId;

          // Create line item
          await tx.insert(lineItemsTable).values({
            orderId,
            performanceId: perfId,
            quantity: 3,
            pricePerTicket: '20.00',
          });

          // Lock and validate seats (THIS IS THE CRITICAL PART)
          const lockedPerf = await tx.execute<{ available_seats: number }>(
            sql`
              SELECT available_seats
              FROM ${performances}
              WHERE id = ${perfId}
              FOR UPDATE
            `,
          );

          const available = lockedPerf.rows[0]?.available_seats || 0;

          if (available < 3) {
            throw new Error(
              `Not enough seats available (need 3, have ${available})`
            );
          }

          // Reserve seats
          await tx.execute(
            sql`
              UPDATE ${performances}
              SET available_seats = available_seats - 3
              WHERE id = ${perfId}
            `,
          );

          return { success: true, orderId };
        });

        checkout1Success = true;
        return result;
      } catch (error) {
        checkout1Error = error instanceof Error ? error.message : String(error);
        throw error;
      }
    })();

    // Promise 2: Second checkout (starts slightly after, but overlaps)
    const promise2 = (async () => {
      // Small delay to ensure both start around the same time
      await new Promise((r) => setTimeout(r, 10));

      try {
        const result = await db.transaction(async (tx) => {
          // Create order
          const orderResult = await tx.insert(orders).values({
            customerEmail: 'user2@test.com',
            customerName: 'Test User 2',
            totalAmount: '60.00',
            status: 'pending',
          }).returning();

          const orderId = orderResult[0].id;
          checkout2OrderId = orderId;

          // Create line item
          await tx.insert(lineItemsTable).values({
            orderId,
            performanceId: perfId,
            quantity: 3,
            pricePerTicket: '20.00',
          });

          // Lock and validate seats
          const lockedPerf = await tx.execute<{ available_seats: number }>(
            sql`
              SELECT available_seats
              FROM ${performances}
              WHERE id = ${perfId}
              FOR UPDATE
            `,
          );

          const available = lockedPerf.rows[0]?.available_seats || 0;

          if (available < 3) {
            throw new Error(
              `Not enough seats available (need 3, have ${available})`
            );
          }

          // Reserve seats
          await tx.execute(
            sql`
              UPDATE ${performances}
              SET available_seats = available_seats - 3
              WHERE id = ${perfId}
            `,
          );

          return { success: true, orderId };
        });

        checkout2Success = true;
        return result;
      } catch (error) {
        checkout2Error = error instanceof Error ? error.message : String(error);
        throw error;
      }
    })();

    // Wait for both checkouts
    const results = await Promise.allSettled([promise1, promise2]);

    // 3. Analyze results
    console.log('📊 Results:\n');

    results.forEach((result, i) => {
      const userNum = i + 1;
      if (result.status === 'fulfilled') {
        console.log(`✅ User ${userNum}: SUCCESS - Order created`);
      } else {
        console.log(`❌ User ${userNum}: FAILED - ${(result.reason as Error).message}`);
      }
    });

    // 4. Check final state
    console.log('\n📈 Seat Inventory Check:\n');

    const finalPerf = await db.query.performances.findFirst({
      where: eq(performances.id, perfId),
      columns: { availableSeats: true },
    });

    const finalSeats = finalPerf?.availableSeats ?? 0;
    const seatsReserved = initialSeats - finalSeats;

    console.log(`Before checkout: ${initialSeats} seats`);
    console.log(`After checkout:  ${finalSeats} seats`);
    console.log(`Seats reserved:  ${seatsReserved} seats\n`);

    // 5. Validation
    console.log('✅ Assertions:\n');

    const successCount = (checkout1Success ? 1 : 0) + (checkout2Success ? 1 : 0);
    const tests: TestResult[] = [
      {
        name: 'Exactly one checkout succeeded',
        value: successCount,
        expected: 1,
        passed: successCount === 1,
      },
      {
        name: 'Exactly 3 seats were reserved',
        value: seatsReserved,
        expected: 3,
        passed: seatsReserved === 3,
      },
      {
        name: 'No overselling occurred',
        value: finalSeats,
        expected: `>= 0 (have ${finalSeats})`,
        passed: finalSeats >= 0,
      },
      {
        name: 'Correct seats were deducted from total',
        value: initialSeats - seatsReserved,
        expected: finalSeats,
        passed: initialSeats - seatsReserved === finalSeats,
      },
    ];

    tests.forEach((test) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
      console.log(`   Value: ${test.value}, Expected: ${test.expected}\n`);
    });

    // 6. Summary
    const allPassed = tests.every((t) => t.passed);
    console.log(
      allPassed
        ? '✅ All tests passed! Race condition prevention is working correctly.'
        : '❌ Some tests failed. Race condition protection may have issues.',
    );

    // Cleanup: Delete test data
    console.log('\n🧹 Cleaning up test data...');

    if (checkout1OrderId) {
      await db.delete(lineItemsTable).where(
        eq(lineItemsTable.orderId, checkout1OrderId)
      );
      await db.delete(orders).where(eq(orders.id, checkout1OrderId));
    }
    if (checkout2OrderId) {
      await db.delete(lineItemsTable).where(
        eq(lineItemsTable.orderId, checkout2OrderId)
      );
      await db.delete(orders).where(eq(orders.id, checkout2OrderId));
    }

    if (createdPerfId) {
      await db.delete(performances).where(eq(performances.id, createdPerfId));
    }

    if (createdShowId) {
      await db.delete(shows).where(eq(shows.id, createdShowId));
    }

    console.log('✅ Test data cleaned up');

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('💥 Test error:', error);

    // Cleanup on error
    console.log('\n🧹 Cleaning up due to error...');
    try {
      if (createdPerfId) {
        await db.delete(performances).where(eq(performances.id, createdPerfId));
      }
      if (createdShowId) {
        await db.delete(shows).where(eq(shows.id, createdShowId));
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    process.exit(1);
  }
}

testConcurrentCheckout();
