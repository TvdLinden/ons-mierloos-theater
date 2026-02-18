import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { Order, LineItem, CouponUsage, Coupon, PerformanceWithShow } from '../db';
import { getSiteSettings } from '../queries/settings';
import { brandTeal, loadLogoBytes } from './pdfHelpers';

type LineItemWithPerformance = LineItem & {
  performance: PerformanceWithShow | null;
};

const BTW_RATE = 0.09;

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

function formatInvoiceNumber(invoiceNumber: number, createdAt: Date): string {
  const year = createdAt.getFullYear();
  return `F-${year}-${String(invoiceNumber).padStart(5, '0')}`;
}

/**
 * Draw text right-aligned at a given x position (right edge)
 */
function drawTextRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0),
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - textWidth, y, size, font, color });
}

/**
 * Generate a branded invoice PDF for an order
 */
export async function generateInvoicePDF(
  order: Order,
  lineItems: LineItemWithPerformance[],
  couponUsages: (CouponUsage & { coupon: Coupon | null })[] = [],
): Promise<Buffer> {
  const settings = await getSiteSettings();
  const contactAddress = settings.contactAddress ?? 'Heer van Scherpenzeelweg 14, 5731 EW Mierlo';
  const contactEmail = settings.contactEmail ?? 'info@onsmierloostheater.nl';
  const contactPhone = settings.contactPhone;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const rightEdge = width - margin;
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const black = rgb(0, 0, 0);

  // === HEADER: Logo ===
  const logoBytes = loadLogoBytes();
  let y = height - margin;

  if (logoBytes) {
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoAspect = logoImage.width / logoImage.height;
    const logoHeight = 45;
    const logoWidth = logoHeight * logoAspect;

    page.drawImage(logoImage, {
      x: margin,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });

    y -= logoHeight + 8;
  } else {
    page.drawText('ONS MIERLOOS THEATER', {
      x: margin,
      y: y - 20,
      size: 20,
      font: boldFont,
      color: brandTeal,
    });
    y -= 28;
  }

  // Accent line
  page.drawRectangle({
    x: margin,
    y,
    width: width - 2 * margin,
    height: 2,
    color: brandTeal,
  });

  y -= 25;

  // === FACTUUR title (right) + Invoice meta ===
  page.drawText('FACTUUR', {
    x: margin,
    y,
    size: 22,
    font: boldFont,
    color: brandTeal,
  });

  const invoiceDate = new Date(order.createdAt || new Date());
  const invoiceNum = formatInvoiceNumber(order.invoiceNumber, invoiceDate);
  const dateStr = invoiceDate.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  drawTextRight(page, invoiceNum, rightEdge, y + 4, boldFont, 11, black);
  drawTextRight(page, dateStr, rightEdge, y - 10, regularFont, 9, gray);

  y -= 40;

  // === Two-column: Customer (left) + Theater (right) ===
  // Customer
  page.drawText('Factuur aan:', { x: margin, y, size: 9, font: boldFont, color: gray });
  y -= 16;
  page.drawText(order.customerName, { x: margin, y, size: 11, font: boldFont, color: black });
  y -= 15;
  page.drawText(order.customerEmail, { x: margin, y, size: 9, font: regularFont, color: gray });

  // Theater info (right column)
  let rightY = y + 31;
  drawTextRight(page, 'Ons Mierloos Theater', rightEdge, rightY, boldFont, 9, black);
  rightY -= 14;
  // Split address into lines if it contains comma
  const addressParts = contactAddress.split(',').map((s) => s.trim());
  for (const part of addressParts) {
    drawTextRight(page, part, rightEdge, rightY, regularFont, 9, gray);
    rightY -= 13;
  }
  drawTextRight(page, contactEmail, rightEdge, rightY, regularFont, 9, gray);
  rightY -= 13;
  if (contactPhone) {
    drawTextRight(page, contactPhone, rightEdge, rightY, regularFont, 9, gray);
  }

  y -= 40;

  // === LINE ITEMS TABLE ===
  const colX = {
    desc: margin,
    qty: margin + 290,
    price: margin + 350,
    total: rightEdge,
  };

  // Table header
  page.drawRectangle({
    x: margin,
    y: y - 4,
    width: width - 2 * margin,
    height: 22,
    color: rgb(0.96, 0.96, 0.96),
  });

  const headerY = y;
  page.drawText('Omschrijving', { x: colX.desc + 4, y: headerY, size: 9, font: boldFont, color: gray });
  page.drawText('Aantal', { x: colX.qty, y: headerY, size: 9, font: boldFont, color: gray });
  page.drawText('Prijs', { x: colX.price, y: headerY, size: 9, font: boldFont, color: gray });
  drawTextRight(page, 'Totaal', colX.total, headerY, boldFont, 9, gray);

  y -= 28;

  // Line items
  for (const item of lineItems) {
    const showTitle = item.performance?.show?.title || 'Voorstelling';
    const perfDate = item.performance?.date
      ? new Date(item.performance.date).toLocaleDateString('nl-NL', {
          dateStyle: 'long',
        })
      : '';
    const qty = item.quantity || 0;
    const price = parseFloat(item.pricePerTicket || '0');
    const lineTotal = qty * price;

    // Show title
    page.drawText(showTitle, { x: colX.desc + 4, y, size: 10, font: regularFont, color: black });
    y -= 14;
    // Performance date (smaller, gray)
    if (perfDate) {
      page.drawText(perfDate, { x: colX.desc + 4, y, size: 8, font: regularFont, color: lightGray });
    }
    // Qty, price, total on first line
    page.drawText(String(qty), { x: colX.qty, y: y + 14, size: 10, font: regularFont, color: black });
    page.drawText(formatCurrency(price), {
      x: colX.price,
      y: y + 14,
      size: 10,
      font: regularFont,
      color: black,
    });
    drawTextRight(page, formatCurrency(lineTotal), colX.total, y + 14, boldFont, 10, black);

    y -= 10;

    // Separator line
    page.drawRectangle({
      x: margin,
      y: y + 2,
      width: width - 2 * margin,
      height: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    y -= 8;
  }

  // Subtotal (shown if coupons applied)
  const subtotal = lineItems.reduce(
    (sum, item) => sum + parseFloat(item.pricePerTicket || '0') * (item.quantity || 0),
    0,
  );

  if (couponUsages.length > 0) {
    y -= 4;
    page.drawText('Subtotaal', { x: colX.price, y, size: 10, font: regularFont, color: gray });
    drawTextRight(page, formatCurrency(subtotal), colX.total, y, regularFont, 10, gray);
    y -= 20;

    // Coupon discount rows
    for (const usage of couponUsages) {
      const code = usage.coupon?.code || 'Korting';
      const discount = parseFloat(usage.discountAmount || '0');
      page.drawText(`Kortingscode: ${code}`, {
        x: colX.desc + 4,
        y,
        size: 9,
        font: regularFont,
        color: rgb(0.18, 0.49, 0.2),
      });
      drawTextRight(
        page,
        `-${formatCurrency(discount)}`,
        colX.total,
        y,
        boldFont,
        10,
        rgb(0.18, 0.49, 0.2),
      );
      y -= 18;
    }
  }

  // === TOTALS SECTION ===
  y -= 6;
  page.drawRectangle({
    x: margin,
    y: y + 10,
    width: width - 2 * margin,
    height: 1.5,
    color: brandTeal,
  });

  y -= 8;

  const totalAmount = parseFloat(order.totalAmount);
  const totalExclBTW = totalAmount / (1 + BTW_RATE);
  const btwAmount = totalAmount - totalExclBTW;

  // Totaal excl. BTW
  page.drawText('Totaal excl. BTW', { x: colX.price - 40, y, size: 10, font: regularFont, color: gray });
  drawTextRight(page, formatCurrency(totalExclBTW), colX.total, y, regularFont, 10, gray);
  y -= 18;

  // BTW 9%
  page.drawText('BTW 9%', { x: colX.price - 40, y, size: 10, font: regularFont, color: gray });
  drawTextRight(page, formatCurrency(btwAmount), colX.total, y, regularFont, 10, gray);
  y -= 22;

  // Total incl. BTW (bold, larger)
  page.drawText('Totaal incl. BTW', {
    x: colX.price - 40,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });
  drawTextRight(page, formatCurrency(totalAmount), colX.total, y, boldFont, 14, brandTeal);

  y -= 16;

  // Paid status
  page.drawText('Betaald', {
    x: colX.price - 40,
    y,
    size: 9,
    font: boldFont,
    color: rgb(0.18, 0.49, 0.2),
  });
  const paidDate = invoiceDate.toLocaleDateString('nl-NL');
  drawTextRight(page, paidDate, colX.total, y, regularFont, 9, rgb(0.18, 0.49, 0.2));

  // === FOOTER ===
  page.drawRectangle({
    x: margin,
    y: 70,
    width: width - 2 * margin,
    height: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  let footerY = 54;

  page.drawText('Ons Mierloos Theater', {
    x: margin,
    y: footerY,
    size: 9,
    font: boldFont,
    color: brandTeal,
  });

  let contactLine = `${contactAddress} | ${contactEmail}`;
  if (contactPhone) {
    contactLine += ` | ${contactPhone}`;
  }

  footerY -= 14;
  page.drawText(contactLine, {
    x: margin,
    y: footerY,
    size: 8,
    font: regularFont,
    color: lightGray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate filename for invoice PDF
 */
export function getInvoiceFilename(order: Order): string {
  const invoiceDate = new Date(order.createdAt || new Date());
  const invoiceNum = formatInvoiceNumber(order.invoiceNumber, invoiceDate);
  return `factuur-${invoiceNum}.pdf`;
}
