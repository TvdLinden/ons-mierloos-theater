/**
 * Generate a mock ticket PDF for visual testing.
 *
 * Usage:
 *   node --import tsx scripts/generate-mock-ticket.ts
 *
 * Output: scripts/mock-ticket.pdf
 */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { generateTicketPDF } = await import('../shared/lib/utils/ticketGenerator.js');
  const { db } = await import('../shared/lib/db/index.js');
  const { images } = await import('../shared/lib/db/schema.js');
  const { eq } = await import('drizzle-orm');

  const imageId = '4877fd73-879e-4bfe-8170-1f6d7e2d3988';
  const image = await db.select().from(images).where(eq(images.id, imageId)).limit(1);

  const mockTicketData = {
    // Ticket fields
    id: 'ticket-mock-id-0001',
    orderId: 'order-mock-id-0001',
    performanceId: 'perf-mock-id-0001',
    ticketNumber: 'TKT-2026-00042',
    qrToken: 'mock-qr-token-abc123',
    rowNumber: 3,
    seatNumber: 7,
    createdAt: new Date(),

    // Order
    order: {
      id: 'order-mock-id-0001',
      customerName: 'Jan de Vries',
      customerEmail: 'jan.devries@example.nl',
      totalAmount: '25.00',
      status: 'paid' as const,
      couponId: null,
      molliePaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // Performance + Show
    performance: {
      id: 'perf-mock-id-0001',
      showId: 'show-mock-id-0001',
      date: new Date('2026-04-15T20:00:00'),
      rows: 10,
      seatsPerRow: 10,
      totalSeats: 100,
      availableSeats: 42,
      price: '25.00',
      status: 'published' as const,
      createdAt: new Date(),
      updatedAt: new Date(),

      show: {
        id: 'show-mock-id-0001',
        title: 'De Nacht van de Grote Beer',
        slug: 'de-nacht-van-de-grote-beer',
        status: 'published' as const,
        imageId,
        basePrice: '25.00',
        blocks: null,
        createdAt: new Date(),
        updatedAt: new Date(),

        image: image[0] ?? null,
      },
    },
  };

  console.log(
    image[0]
      ? `Using image: ${image[0].r2Url}`
      : 'Image not found in DB, generating without image.',
  );
  console.log('Generating mock ticket PDF...');

  const pdfBuffer = await generateTicketPDF(mockTicketData as any);

  const outputPath = path.resolve('scripts/mock-ticket.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`Done! Written to: ${outputPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
