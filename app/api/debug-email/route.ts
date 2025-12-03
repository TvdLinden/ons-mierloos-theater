import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check email configuration
 */
export async function GET() {
  const config = {
    smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    smtpHost: process.env.SMTP_HOST || 'not set',
    smtpPort: process.env.SMTP_PORT || 'not set',
    smtpUser: process.env.SMTP_USER ? '✓ set' : '✗ not set',
    smtpPass: process.env.SMTP_PASS ? '✓ set' : '✗ not set',
    fromEmail: process.env.FROM_EMAIL || 'not set',
    fromName: process.env.FROM_NAME || 'not set',
    mockPayment: process.env.USE_MOCK_PAYMENT === 'true',
  };

  return NextResponse.json(config);
}
