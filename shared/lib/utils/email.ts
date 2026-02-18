import nodemailer from 'nodemailer';
import { Order, LineItem, CouponUsage, Coupon, PerformanceWithShow } from '../db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generateTicketPDF, getTicketFilename } from './ticketGenerator';
import { generateInvoicePDF, getInvoiceFilename } from './invoiceGenerator';
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

// ─── Shared design tokens ────────────────────────────────────────────────────
const TEAL = '#00a098';
const NAVY = '#1a1a2e';
const CREAM = '#f7e9c1';

let cachedLogoDataUrl: string | null | undefined = undefined;

function loadLogoDataUrl(): string | null {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;
  try {
    const logoPath = path.join(__dirname, '../assets/logo.png');
    const bytes = fs.readFileSync(logoPath);
    cachedLogoDataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    cachedLogoDataUrl = null;
  }
  return cachedLogoDataUrl;
}

/**
 * Wraps email body content in the shared branded shell (header + footer).
 * Pass `unsubscribeUrl` to add an unsubscribe link in the footer.
 */
function emailShell(opts: { subtitle: string; content: string; unsubscribeUrl?: string }): string {
  const year = new Date().getFullYear();
  const unsubscribeBlock = opts.unsubscribeUrl
    ? `<p style="margin:8px 0 0 0;">
        <a href="${opts.unsubscribeUrl}" style="color:#999;text-decoration:underline;font-size:11px;">Uitschrijven van deze nieuwsbrief</a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:28px 40px 20px 40px;border-radius:4px 4px 0 0;border:1px solid #e0e0e0;border-bottom:none;">
            ${(() => {
              const logo = loadLogoDataUrl();
              return logo
                ? `<img src="${logo}" alt="Ons Mierloos Theater" height="44" style="display:block;margin-bottom:16px;">`
                : `<p style="margin:0 0 16px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${TEAL};font-weight:bold;">ONS MIERLOOS THEATER</p>`;
            })()}
            <p style="margin:0;font-size:17px;font-weight:bold;color:${NAVY};">${opts.subtitle}</p>
          </td>
        </tr>

        <!-- Teal accent bar -->
        <tr><td style="background:${TEAL};height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0;border-top:none;">
            ${opts.content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 4px 4px;text-align:center;">
            <p style="margin:0;font-size:12px;font-weight:bold;color:${TEAL};">Ons Mierloos Theater</p>
            <p style="margin:6px 0 0 0;font-size:11px;color:#999;">Heer van Scherpenzeelweg 14, 5731 EW Mierlo</p>
            <p style="margin:4px 0 0 0;font-size:11px;color:#999;">© ${year} ${FROM_NAME}. Alle rechten voorbehouden.</p>
            ${unsubscribeBlock}
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a teal-accented info box (matches the PDF callout style).
 */
function infoBox(content: string, tint = '#f5f5f5'): string {
  return `<div style="background:${tint};border-left:4px solid ${TEAL};padding:14px 16px;margin:24px 0;border-radius:0 4px 4px 0;">${content}</div>`;
}

/**
 * Renders a primary CTA button in brand teal.
 */
function ctaButton(label: string, url: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:${TEAL};color:#ffffff;padding:14px 40px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:15px;letter-spacing:0.3px;">${label}</a>
  </div>`;
}

/**
 * Generate HTML for the order confirmation / ticket email
 */
function generateTicketEmail(
  order: Order,
  lineItems: LineItemWithPerformance[],
  couponUsages: (CouponUsage & { coupon: Coupon | null })[] = [],
): string {
  const itemsHtml = lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding:11px 8px;border-bottom:1px solid #eeeeee;font-size:14px;">
        <strong style="color:${NAVY};">${item.performance?.show?.title || 'Voorstelling'}</strong><br>
        <span style="color:#888;font-size:12px;">
          ${item.performance?.date ? new Date(item.performance.date).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' }) : ''}
        </span>
      </td>
      <td style="padding:11px 8px;border-bottom:1px solid #eeeeee;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:11px 8px;border-bottom:1px solid #eeeeee;text-align:right;font-size:14px;">€${parseFloat(item.pricePerTicket || '0').toFixed(2)}</td>
      <td style="padding:11px 8px;border-bottom:1px solid #eeeeee;text-align:right;font-size:14px;">
        <strong>€${(parseFloat(item.pricePerTicket || '0') * (item.quantity || 0)).toFixed(2)}</strong>
      </td>
    </tr>`,
    )
    .join('');

  const subtotal = lineItems.reduce(
    (sum, item) => sum + parseFloat(item.pricePerTicket || '0') * (item.quantity || 0),
    0,
  );

  const couponDiscountHtml =
    couponUsages.length > 0
      ? `<tr>
          <td colspan="3" style="padding:10px 8px;text-align:right;font-size:13px;color:#666;border-top:1px solid #eeeeee;">Subtotaal:</td>
          <td style="padding:10px 8px;text-align:right;font-size:13px;color:#666;">€${subtotal.toFixed(2)}</td>
        </tr>` +
        couponUsages
          .map(
            (usage) => `
        <tr style="background:#f0faf9;">
          <td colspan="3" style="padding:10px 8px;font-size:13px;">
            <strong style="color:${TEAL};">Kortingscode: ${usage.coupon?.code || 'Onbekend'}</strong>
            ${usage.coupon?.description ? `<br><span style="color:#888;font-size:12px;">${usage.coupon.description}</span>` : ''}
          </td>
          <td style="padding:10px 8px;text-align:right;font-size:13px;color:#1a7a5e;"><strong>-€${usage.discountAmount}</strong></td>
        </tr>`,
          )
          .join('')
      : '';

  const content = `
    <p style="margin:0 0 6px 0;font-size:22px;font-weight:bold;color:${NAVY};">Je tickets zijn bevestigd!</p>
    <p style="margin:0 0 24px 0;color:#555;">Beste ${order.customerName},<br><br>
    Je betaling is succesvol verwerkt. Je tickets zijn als bijlage bij deze e-mail gevoegd.</p>

    ${infoBox(`
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;">
        <tr><td style="color:#888;padding:2px 0;width:120px;">Bestelnummer</td><td style="color:${NAVY};font-weight:bold;">${order.id.substring(0, 13)}</td></tr>
        <tr><td style="color:#888;padding:2px 0;">Datum</td><td style="color:#333;">${new Date(order.createdAt || '').toLocaleDateString('nl-NL', { dateStyle: 'long' })}</td></tr>
        <tr><td style="color:#888;padding:2px 0;">E-mail</td><td style="color:#333;">${order.customerEmail}</td></tr>
      </table>`)}

    <p style="margin:28px 0 10px 0;font-size:13px;font-weight:bold;color:#888;letter-spacing:1px;text-transform:uppercase;">Overzicht bestelling</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#888;font-weight:bold;border-bottom:2px solid #e0e0e0;">Voorstelling</th>
          <th style="padding:10px 8px;text-align:center;font-size:12px;color:#888;font-weight:bold;border-bottom:2px solid #e0e0e0;">Aantal</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;color:#888;font-weight:bold;border-bottom:2px solid #e0e0e0;">Prijs</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;color:#888;font-weight:bold;border-bottom:2px solid #e0e0e0;">Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${couponDiscountHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:14px 8px;text-align:right;font-weight:bold;border-top:2px solid ${TEAL};font-size:14px;">Totaal betaald:</td>
          <td style="padding:14px 8px;text-align:right;border-top:2px solid ${TEAL};">
            <strong style="font-size:18px;color:${TEAL};">€${order.totalAmount}</strong>
          </td>
        </tr>
      </tfoot>
    </table>

    ${infoBox(`<p style="margin:0;font-size:13px;color:#555;"><strong style="color:${NAVY};">Toegangsbewijs</strong><br>Je persoonlijke tickets zijn als PDF-bijlage meegestuurd. Toon je ticket (digitaal of geprint) bij de ingang.</p>`)}

    <p style="margin:24px 0 6px 0;font-size:14px;color:#555;">
      Heb je vragen? Neem contact met ons op via
      <a href="mailto:info@onsmierloostheater.nl" style="color:${TEAL};text-decoration:none;">info@onsmierloostheater.nl</a>.
    </p>
    <p style="margin:0;font-size:14px;color:#555;">We kijken ernaar uit je te verwelkomen!</p>
    <p style="margin:24px 0 0 0;font-size:14px;color:#555;">Met vriendelijke groet,<br><strong style="color:${NAVY};">${FROM_NAME}</strong></p>`;

  return emailShell({ subtitle: 'Bedankt voor je bestelling!', content });
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

    console.log(`✓ Generated ${attachments.length} PDF ticket attachments`);

    // Generate invoice PDF
    try {
      const invoiceBuffer = await generateInvoicePDF(order, lineItems as any, couponUsages);
      const invoiceFilename = getInvoiceFilename(order);
      attachments.push({
        filename: invoiceFilename,
        content: invoiceBuffer,
        contentType: 'application/pdf',
      });
      console.log(`✓ Generated invoice PDF: ${invoiceFilename}`);
    } catch (invoiceError) {
      console.error('⚠️ Failed to generate invoice PDF, continuing without it:', invoiceError);
    }

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

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Send emails to all subscribers
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        const unsubUrl = subscriber.unsubscribeToken
          ? `${baseUrl}/api/mailing-list/unsubscribe?token=${subscriber.unsubscribeToken}`
          : undefined;

        const htmlContent = emailShell({
          subtitle: subject,
          content: `<div style="font-size:15px;line-height:1.7;color:#444;white-space:pre-wrap;">${message}</div>
            <p style="margin:28px 0 0 0;font-size:12px;color:#aaa;text-align:center;">
              Je ontvangt deze e-mail omdat je bent geabonneerd op de nieuwsbrief van ${FROM_NAME}.
            </p>`,
          unsubscribeUrl: unsubUrl,
        });

        const headers: Record<string, string> | undefined = unsubUrl
          ? {
              'List-Unsubscribe': `<mailto:${FROM_EMAIL}?subject=unsubscribe>, <${unsubUrl}>`,
              'List-Unsubscribe-Post': `<${unsubUrl}>; method=POST`,
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

  const htmlContent = emailShell({
    subtitle: 'Welkom bij Ons Mierloos Theater!',
    content: `
      <p style="margin:0 0 6px 0;font-size:22px;font-weight:bold;color:${NAVY};">Bevestig je e-mailadres</p>
      <p style="margin:0 0 24px 0;color:#555;">Beste ${name},<br><br>
      Bedankt voor je registratie! Klik op de knop hieronder om je account te activeren.</p>

      ${ctaButton('Bevestig e-mailadres', verificationUrl)}

      <p style="margin:0 0 6px 0;font-size:13px;color:#888;">Of kopieer deze link naar je browser:</p>
      <p style="word-break:break-all;background:#f5f5f5;padding:10px 12px;border-radius:4px;font-size:11px;color:#666;margin:0 0 24px 0;">${verificationUrl}</p>

      ${infoBox(`<p style="margin:0;font-size:13px;color:#555;"><strong style="color:${NAVY};">Let op:</strong> Deze link is 24 uur geldig. Als je deze e-mail niet hebt aangevraagd, kun je hem negeren.</p>`)}

      <p style="margin:24px 0 0 0;font-size:14px;color:#555;">Met vriendelijke groet,<br><strong style="color:${NAVY};">${FROM_NAME}</strong></p>`,
  });

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

  const htmlContent = emailShell({
    subtitle: 'Je bestelling wordt verwerkt',
    content: `
      <p style="margin:0 0 6px 0;font-size:22px;font-weight:bold;color:${NAVY};">Je bestelling is aangemaakt!</p>
      <p style="margin:0 0 24px 0;color:#555;">Hallo ${data.customerName},<br><br>
      Je plaatsen zijn gereserveerd. We maken je betaallink klaar — je ontvangt deze binnen enkele minuten.</p>

      ${infoBox(`
        <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;">
          <tr><td style="color:#888;padding:2px 0;width:120px;">Bestelling</td><td style="color:${NAVY};font-weight:bold;">#${data.orderNumber}</td></tr>
          <tr><td style="color:#888;padding:2px 0;">Totaal</td><td style="color:#333;">€${data.totalAmount}</td></tr>
          <tr><td style="color:#888;padding:2px 0;">Status</td><td style="color:${TEAL};font-weight:bold;">Wacht op betaling</td></tr>
        </table>`)}

      <p style="margin:0 0 10px 0;font-size:13px;font-weight:bold;color:#888;letter-spacing:1px;text-transform:uppercase;">Volgende stappen</p>
      <ol style="margin:0 0 24px 0;padding-left:20px;font-size:14px;color:#444;line-height:2;">
        <li>Je ontvangt binnen enkele minuten een e-mail met de betaallink</li>
        <li>Klik op de link om je betaling te voltooien</li>
        <li>Je plaatsen blijven <strong>15 minuten</strong> gereserveerd</li>
      </ol>

      ${infoBox(`<p style="margin:0;font-size:13px;color:#555;"><strong style="color:${NAVY};">Belangrijk:</strong> Rond je betaling op tijd af om je plaatsen te behouden.</p>`)}

      ${ctaButton('Bekijk mijn bestelling', orderStatusUrl)}

      <p style="margin:0;font-size:14px;color:#555;">
        Vragen? Mail naar <a href="mailto:info@onsmierloostheater.nl" style="color:${TEAL};text-decoration:none;">info@onsmierloostheater.nl</a>.
      </p>
      <p style="margin:24px 0 0 0;font-size:14px;color:#555;">Met vriendelijke groet,<br><strong style="color:${NAVY};">${FROM_NAME}</strong></p>`,
  });

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

  const htmlContent = emailShell({
    subtitle: 'Wachtwoord herstellen',
    content: `
      <p style="margin:0 0 6px 0;font-size:22px;font-weight:bold;color:${NAVY};">Reset je wachtwoord</p>
      <p style="margin:0 0 24px 0;color:#555;">Beste ${name},<br><br>
      We hebben een verzoek ontvangen om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord te kiezen.</p>

      ${ctaButton('Wachtwoord opnieuw instellen', resetUrl)}

      <p style="margin:0 0 6px 0;font-size:13px;color:#888;">Of kopieer deze link naar je browser:</p>
      <p style="word-break:break-all;background:#f5f5f5;padding:10px 12px;border-radius:4px;font-size:11px;color:#666;margin:0 0 24px 0;">${resetUrl}</p>

      ${infoBox(`<p style="margin:0;font-size:13px;color:#555;"><strong style="color:${NAVY};">Let op:</strong> Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze e-mail negeren. Je wachtwoord blijft ongewijzigd.</p>`)}

      <p style="margin:24px 0 0 0;font-size:14px;color:#555;">Met vriendelijke groet,<br><strong style="color:${NAVY};">${FROM_NAME}</strong></p>`,
  });

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
