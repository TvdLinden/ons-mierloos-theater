import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
process.env.MOLLIE_API_KEY = 'test_api_key'
process.env.USE_MOCK_PAYMENT = 'false'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NODE_ENV = 'test'

// Mock the database module to prevent connection attempts
jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    query: {
      jobs: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      performances: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      payments: {
        findFirst: jest.fn(),
      },
      orders: {
        findFirst: jest.fn(),
      },
    },
  },
}))
