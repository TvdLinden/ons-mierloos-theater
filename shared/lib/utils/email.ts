import nodemailer from 'nodemailer';
import { Order, LineItem, Performance, CouponUsage, Coupon, PerformanceWithShow } from '../db';
import crypto from 'crypto';
import { getTicketsByOrderId } from '../commands/tickets';
import { generateTicketPDF, getTicketFilename } from './ticketGenerator';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { lineItems, tickets } from '../db/schema';
import { getSubscriberByEmail } from '../commands/mailingList';

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const FROM_NAME = process.env.FROM_NAME || 'Ons Mierloos Theater';

type LineItemWithPerformance = LineItem & {
  performance: PerformanceWithShow | null;
};

/**
 * Create email transporter
 */
function createTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Emails will not be sent.');
    console.warn('Missing:', !SMTP_USER ? 'SMTP_USER' : '', !SMTP_PASS ? 'SMTP_PASS' : '');
    return null;
  }

  console.log('Creating email transporter with:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    user: SMTP_USER,
  });

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Generate HTML invoice/ticket email
 */
function generateTicketEmail(
  order: Order,
  lineItems: LineItemWithPerformance[],
  couponUsages: (CouponUsage & { coupon: Coupon | null })[] = [],
): string {
  const itemsHtml = lineItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px;">
        <strong>${item.performance?.show?.title || 'Voorstelling'}</strong><br/>
        <small style="color: #666;">
          ${item.performance?.date ? new Date(item.performance.date).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' }) : ''}
        </small>
      </td>
      <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">€${item.pricePerTicket || '0.00'}</td>
      <td style="padding: 12px 8px; text-align: right;">
        <strong>€${(parseFloat(item.pricePerTicket || '0') * (item.quantity || 0)).toFixed(2)}</strong>
      </td>
    </tr>
  `,
    )
    .join('');

  // Generate coupon discount HTML if any coupons were applied
  const couponDiscountHtml =
    couponUsages.length > 0
      ? couponUsages
          .map(
            (usage) => `
        <tr style="background: #e8f5e9;">
          <td colspan="3" style="padding: 12px 8px;">
            <strong>🎟️ Kortingscode: ${usage.coupon?.code || 'Onbekend'}</strong>
            ${usage.coupon?.description ? `<br/><small style="color: #666;">${usage.coupon.description}</small>` : ''}
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #2e7d32;">
            <strong>-€${usage.discountAmount}</strong>
          </td>
        </tr>
      `,
          )
          .join('')
      : '';

  const subtotal = lineItems.reduce(
    (sum, item) => sum + parseFloat(item.pricePerTicket || '0') * (item.quantity || 0),
    0,
  );
  // const totalDiscount = couponUsages.reduce(
  //   (sum, usage) => sum + parseFloat(usage.discountAmount || '0'),
  //   0,
  // );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Je tickets voor ${FROM_NAME}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%); color: #f7e9c1; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎭 ${FROM_NAME}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Bedankt voor je bestelling!</p>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Je tickets zijn bevestigd!</h2>
    
    <p>Beste ${order.customerName},</p>
    
    <p>Je betaling is succesvol verwerkt. Hieronder vind je de details van je bestelling.</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Bestelnummer:</strong> ${order.id}</p>
      <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(order.createdAt || '').toLocaleDateString('nl-NL')}</p>
      <p style="margin: 5px 0;"><strong>E-mail:</strong> ${order.customerEmail}</p>
    </div>
    
    <h3 style="color: #1a1a2e; margin-top: 30px;">Bestelling</h3>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <thead>
        <tr style="background: #f8f9fa; border-bottom: 2px solid #ddd;">
          <th style="padding: 12px 8px; text-align: left;">Voorstelling</th>
          <th style="padding: 12px 8px; text-align: center;">Aantal</th>
          <th style="padding: 12px 8px; text-align: right;">Prijs</th>
          <th style="padding: 12px 8px; text-align: right;">Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${
          couponUsages.length > 0
            ? `
        <tr style="border-top: 1px solid #ddd;">
          <td colspan="3" style="padding: 12px 8px; text-align: right;">Subtotaal:</td>
          <td style="padding: 12px 8px; text-align: right;">€${subtotal.toFixed(2)}</td>
        </tr>
        `
            : ''
        }
        ${couponDiscountHtml}
      </tbody>
      <tfoot>
        <tr style="border-top: 2px solid #ddd;">
          <td colspan="3" style="padding: 15px 8px; text-align: right;"><strong>Totaal betaald:</strong></td>
          <td style="padding: 15px 8px; text-align: right;">
            <strong style="font-size: 18px; color: #1a1a2e;">€${order.totalAmount}</strong>
          </td>
        </tr>
      </tfoot>
    </table>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>ℹ️ Belangrijk:</strong></p>
      <p style="margin: 10px 0 0 0;">Neem deze e-mail mee naar de voorstelling (digitaal of geprint). Dit is je toegangsbewijs.</p>
    </div>
    
    <h3 style="color: #1a1a2e; margin-top: 30px;">Locatie</h3>
    <p>Ons Mierloos Theater<br/>
    Heer van Scherpenzeelweg 14<br/>
    5731 EW Mierlo</p>
    
    <p style="margin-top: 30px;">Heb je vragen over je bestelling? Neem dan contact met ons op via <a href="mailto:info@onsmierloostheater.nl" style="color: #1a1a2e;">info@onsmierloostheater.nl</a>.</p>
    
    <p style="margin-top: 30px;">We kijken ernaar uit je te verwelkomen!</p>
    
    <p style="margin-top: 20px;">Met vriendelijke groet,<br/>
    <strong>${FROM_NAME}</strong></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${FROM_NAME}. Alle rechten voorbehouden.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send order confirmation email with tickets
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  lineItems: LineItemWithPerformance[],
  couponUsages: (CouponUsage & { coupon: Coupon | null })[] = [],
): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Attempting to send order confirmation email...');
  console.log('Recipient:', order.customerEmail);
  console.log('Order ID:', order.id);
  console.log('Line items count:', lineItems.length);
  console.log('Coupons applied:', couponUsages.length);

  const transporter = createTransporter();

  if (!transporter) {
    console.log('❌ Email not sent: SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const htmlContent = generateTicketEmail(order, lineItems, couponUsages);

    console.log('Sending email from:', `"${FROM_NAME}" <${FROM_EMAIL}>`);
    console.log('Sending email to:', order.customerEmail);

    // Fetch tickets for this order
    const orderTickets = await db.query.tickets.findMany({
      where: eq(tickets.orderId, order.id),
      with: {
        performance: {
          with: {
            show: true,
          },
        },
        order: true,
      },
    });

    console.log(`Generating ${orderTickets.length} PDF tickets...`);

    // Generate PDF attachments for each ticket
    const attachments = await Promise.all(
      orderTickets.map(async (ticket) => {
        const pdfBuffer = await generateTicketPDF(ticket as any);
        const filename = getTicketFilename(ticket, ticket.performance.show);

        return {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        };
      }),
    );

    console.log(`✓ Generated ${attachments.length} PDF attachments`);

    // Build optional List-Unsubscribe headers if the recipient is a mailing list subscriber
    let headers: Record<string, string> | undefined;
    try {
      const sub = await getSubscriberByEmail(order.customerEmail.toLowerCase());
      if (sub && sub.unsubscribeToken) {
        const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mailing-list/unsubscribe?token=${sub.unsubscribeToken}`;
        headers = {
          'List-Unsubscribe': `<mailto:${FROM_EMAIL}?subject=unsubscribe>, <${url}>`,
          'List-Unsubscribe-Post': `<${url}>; method=POST`,
        };
      }
    } catch (e) {
      console.warn('Failed to build List-Unsubscribe header', e);
    }

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: order.customerEmail,
      subject: `Je tickets voor ${FROM_NAME} - Bestelling ${order.id.substring(0, 8)}`,
      html: htmlContent,
      ...(headers ? { headers } : {}),
      attachments,
    });

    console.log(`✅ Order confirmation email sent successfully to ${order.customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send test email (for testing configuration)
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: 'Test email van Ons Mierloos Theater',
      html: '<h1>Test email</h1><p>Je email configuratie werkt!</p>',
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email to all active mailing list subscribers
 */
export async function sendMailingListEmail(
  subject: string,
  message: string,
): Promise<{ success: boolean; error?: string; sent?: number }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email not sent: SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    // Get all active subscribers
    const { getAllActiveSubscribers } = await import('../commands/mailingList');
    const subscribers = await getAllActiveSubscribers();

    if (subscribers.length === 0) {
      return { success: false, error: 'Geen actieve abonnees gevonden' };
    }

    console.log(`Sending mailing list email to ${subscribers.length} subscribers...`);

    // Generate HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%); color: #f7e9c1; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎭 ${FROM_NAME}</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <div style="white-space: pre-wrap;">${message}</div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      Je ontvangt deze e-mail omdat je bent geabonneerd op de nieuwsbrief van ${FROM_NAME}.
    </p>
  </div>
</body>
</html>
    `;

    // Send emails to all subscribers
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        const headers: Record<string, string> | undefined = subscriber.unsubscribeToken
          ? {
              'List-Unsubscribe': `<mailto:${FROM_EMAIL}?subject=unsubscribe>, <${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mailing-list/unsubscribe?token=${subscriber.unsubscribeToken}>`,
              'List-Unsubscribe-Post': `<${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mailing-list/unsubscribe?token=${subscriber.unsubscribeToken}>; method=POST`,
            }
          : undefined;

        await transporter.sendMail({
          from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
          to: subscriber.email,
          subject,
          html: htmlContent,
          ...(headers ? { headers } : {}),
        });
        sent++;
        console.log(`✓ Email sent to ${subscriber.email}`);
      } catch (error) {
        console.error(`✗ Failed to send to ${subscriber.email}:`, error);
        failed++;
      }
    }

    console.log(`📧 Mailing list email complete: ${sent} sent, ${failed} failed`);

    if (sent === 0) {
      return { success: false, error: 'Geen e-mails verzonden' };
    }

    return { success: true, sent };
  } catch (error) {
    console.error('Failed to send mailing list email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Attempting to send verification email...');
  console.log('Recipient:', email);

  const transporter = createTransporter();

  if (!transporter) {
    console.log('❌ Email not sent: SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig je e-mailadres</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%); color: #f7e9c1; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎭 ${FROM_NAME}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Welkom!</p>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Bevestig je e-mailadres</h2>
    
    <p>Beste ${name},</p>
    
    <p>Bedankt voor je registratie bij ${FROM_NAME}! Om je account te activeren, klik je op de onderstaande knop:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: #1a1a2e; color: #f7e9c1; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Bevestig e-mailadres
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Of kopieer deze link naar je browser:</p>
    <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; color: #666;">
      ${verificationUrl}
    </p>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>⚠️ Let op:</strong></p>
      <p style="margin: 10px 0 0 0;">Deze link is 24 uur geldig. Als je deze e-mail niet hebt aangevraagd, kun je hem negeren.</p>
    </div>
    
    <p style="margin-top: 30px;">Met vriendelijke groet,<br/>
    <strong>${FROM_NAME}</strong></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${FROM_NAME}. Alle rechten voorbehouden.</p>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: `Bevestig je e-mailadres voor ${FROM_NAME}`,
      html: htmlContent,
    });

    console.log(`✅ Verification email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send queued payment email (when payment is being processed)
 */
export async function sendQueuedPaymentEmail(data: {
  to: string;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  orderId: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Attempting to send queued payment email...');
  console.log('Recipient:', data.to);
  console.log('Order ID:', data.orderId);

  const transporter = createTransporter();

  if (!transporter) {
    console.log('❌ Email not sent: SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const orderStatusUrl = `${baseUrl}/order/${data.orderId}?email=${encodeURIComponent(data.to)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Je bestelling wordt verwerkt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%); color: #f7e9c1; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎭 ${FROM_NAME}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Bedankt voor je bestelling!</p>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Je bestelling is aangemaakt!</h2>

    <p>Hallo ${data.customerName},</p>

    <p>Je bestelling is succesvol aangemaakt en je plaatsen zijn gereserveerd.</p>

    <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1a1a2e;">Bestelling #${data.orderNumber}</h3>
      <p style="margin: 5px 0;"><strong>Totaal:</strong> €${data.totalAmount}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #ffc107;">⏱️ Wacht op betaling</span></p>
    </div>

    <h3 style="color: #1a1a2e;">⏱️ Wat gebeurt er nu?</h3>
    <p>We maken momenteel je betaallink aan. Dit duurt normaal gesproken <strong>minder dan 5 minuten</strong>.</p>

    <h3 style="color: #1a1a2e;">📧 Volgende stappen:</h3>
    <ol style="line-height: 2;">
      <li>Je ontvangt binnen enkele minuten een nieuwe e-mail met de betaallink</li>
      <li>Klik op de link om je betaling te voltooien</li>
      <li>Je plaatsen blijven <strong>15 minuten</strong> gereserveerd vanaf het moment van bestelling</li>
    </ol>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>⚠️ Belangrijk:</strong></p>
      <p style="margin: 10px 0 0 0;">Rond je betaling binnen 15 minuten af om je plaatsen te behouden.</p>
    </div>

    <p>Je kunt de status van je bestelling ook bekijken via:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${orderStatusUrl}"
         style="display: inline-block; background: #1a1a2e; color: #f7e9c1; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Bekijk mijn bestelling
      </a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Vragen? Neem contact op via <a href="mailto:info@onsmierloostheater.nl" style="color: #1a1a2e;">info@onsmierloostheater.nl</a>
    </p>

    <p style="margin-top: 30px;">Met vriendelijke groet,<br/>
    <strong>${FROM_NAME}</strong></p>
  </div>

  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${FROM_NAME}. Alle rechten voorbehouden.</p>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: data.to,
      subject: `Je bestelling wordt verwerkt - Bestelling #${data.orderNumber}`,
      html: htmlContent,
    });

    console.log(`✅ Queued payment email sent successfully to ${data.to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send queued payment email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  console.log('📧 Attempting to send password reset email...');
  console.log('Recipient:', email);

  const transporter = createTransporter();

  if (!transporter) {
    console.log('❌ Email not sent: SMTP not configured');
    return { success: false, error: 'SMTP not configured' };
  }

  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wachtwoord opnieuw instellen</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%); color: #f7e9c1; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎭 ${FROM_NAME}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Wachtwoord herstellen</p>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Reset je wachtwoord</h2>
    
    <p>Beste ${name},</p>
    
    <p>We hebben een verzoek ontvangen om het wachtwoord van je account opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background: #1a1a2e; color: #f7e9c1; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Wachtwoord opnieuw instellen
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Of kopieer deze link naar je browser:</p>
    <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; color: #666;">
      ${resetUrl}
    </p>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>⚠️ Let op:</strong></p>
      <p style="margin: 10px 0 0 0;">Deze link is 1 uur geldig. Als je deze e-mail niet hebt aangevraagd, kun je hem negeren. Je wachtwoord blijft dan ongewijzigd.</p>
    </div>
    
    <p style="margin-top: 30px;">Met vriendelijke groet,<br/>
    <strong>${FROM_NAME}</strong></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${FROM_NAME}. Alle rechten voorbehouden.</p>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: `Wachtwoord opnieuw instellen voor ${FROM_NAME}`,
      html: htmlContent,
    });

    console.log(`✅ Password reset email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, error: String(error) };
  }
}
