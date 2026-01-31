import { vi } from 'vitest';

// Mock environment variables for tests
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.MOLLIE_API_KEY = 'test_api_key';
process.env.USE_MOCK_PAYMENT = 'false';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock the database module to prevent connection attempts
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    execute: vi.fn(),
    query: {
      jobs: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      performances: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      payments: {
        findFirst: vi.fn(),
      },
      orders: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock the email service
vi.mock('@/lib/utils/email', () => ({
  sendQueuedPaymentEmail: vi.fn(),
  sendPaymentLinkEmail: vi.fn(),
  sendPaymentFailureEmail: vi.fn(),
}));
