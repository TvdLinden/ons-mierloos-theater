import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { Ticket, Order, Performance, Show } from '../db';
import { getSiteSettings } from '../queries/settings';
import { brandTeal, loadLogoBytes } from './pdfHelpers';

export type TicketData = Ticket & {
  performance: Performance & {
    show: Show;
  };
  order: Order;
};

/**
 * Generate a PDF ticket with QR code, logo branding, and seat information
 */
export async function generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
  const { ticket, performance, show, order } = {
    ticket: ticketData,
    performance: ticketData.performance,
    show: ticketData.performance.show,
    order: ticketData.order,
  };

  // Fetch site settings for footer contact info
  const settings = await getSiteSettings();
  const contactAddress = settings.contactAddress ?? 'Heer van Scherpenzeelweg 14, 5731 EW Mierlo';
  const contactEmail = settings.contactEmail ?? 'info@onsmierloostheater.nl';
  const contactPhone = settings.contactPhone;

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  const { width, height } = page.getSize();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Layout dimensions
  const margin = 50;

  // === HEADER: Logo + Branding ===
  const logoBytes = loadLogoBytes();
  let headerBottomY = height - margin;

  if (logoBytes) {
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoAspect = logoImage.width / logoImage.height;
    const logoHeight = 50;
    const logoWidth = logoHeight * logoAspect;

    page.drawImage(logoImage, {
      x: margin,
      y: height - margin - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });

    headerBottomY = height - margin - logoHeight - 10;
  } else {
    // Fallback: text-only header
    page.drawText('ONS MIERLOOS THEATER', {
      x: margin,
      y: height - margin - 20,
      size: 24,
      font: boldFont,
      color: brandTeal,
    });

    headerBottomY = height - margin - 30;
  }

  // Accent line below header
  page.drawRectangle({
    x: margin,
    y: headerBottomY,
    width: width - 2 * margin,
    height: 2,
    color: brandTeal,
  });

  headerBottomY -= 15;

  // TOEGANGSBEWIJS + ticket number
  page.drawText('TOEGANGSBEWIJS', {
    x: margin,
    y: headerBottomY,
    size: 14,
    font: boldFont,
    color: brandTeal,
  });

  page.drawText(`Ticket: ${ticket.ticketNumber}`, {
    x: width - margin - boldFont.widthOfTextAtSize(`Ticket: ${ticket.ticketNumber}`, 10),
    y: headerBottomY + 2,
    size: 10,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // === QR CODE (top-right area) ===
  const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrToken, {
    errorCorrectionLevel: 'M',
    width: 200,
    margin: 1,
  });
  const qrCodeBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);

  const qrSize = 140;
  const qrX = width - margin - qrSize;
  const qrY = headerBottomY - 30 - qrSize;

  // === SHOW INFORMATION ===
  let currentY = headerBottomY - 40;

  page.drawText(show.title, {
    x: margin,
    y: currentY,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 35;

  // Performance date and time
  const performanceDate = new Date(performance.date);
  const dateStr = performanceDate.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = performanceDate.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  page.drawText('Datum:', {
    x: margin,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(dateStr, {
    x: margin + 80,
    y: currentY,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  page.drawText('Tijd:', {
    x: margin,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(timeStr, {
    x: margin + 80,
    y: currentY,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 35;

  // === SEAT INFORMATION ===
  const seatBoxHeight = 80;
  const seatBoxY = currentY - seatBoxHeight;

  // Teal accent left border
  page.drawRectangle({
    x: margin - 10,
    y: seatBoxY,
    width: 4,
    height: seatBoxHeight,
    color: brandTeal,
  });

  // Light background
  page.drawRectangle({
    x: margin - 6,
    y: seatBoxY,
    width: width - 2 * margin + 16,
    height: seatBoxHeight,
    color: rgb(0.96, 0.96, 0.96),
  });

  page.drawText('ZITPLAATS', {
    x: margin + 4,
    y: currentY - 20,
    size: 12,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Rij ${ticket.rowLetter}`, {
    x: margin + 4,
    y: currentY - 52,
    size: 32,
    font: boldFont,
    color: brandTeal,
  });

  page.drawText(`Stoel ${ticket.seatNumber}`, {
    x: margin + 124,
    y: currentY - 52,
    size: 32,
    font: boldFont,
    color: brandTeal,
  });

  // === QR CODE (drawn after seat box so it renders on top) ===
  page.drawImage(qrCodeImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText('Scan bij binnenkomst', {
    x: qrX + (qrSize - regularFont.widthOfTextAtSize('Scan bij binnenkomst', 9)) / 2,
    y: qrY - 15,
    size: 9,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  currentY = seatBoxY - 30;

  // === CUSTOMER INFORMATION ===
  page.drawText('Naam:', {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(order.customerName, {
    x: margin + 80,
    y: currentY,
    size: 11,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  page.drawText('Email:', {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(order.customerEmail, {
    x: margin + 80,
    y: currentY,
    size: 11,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  page.drawText('Bestelling:', {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(order.id.substring(0, 13), {
    x: margin + 80,
    y: currentY,
    size: 11,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  // === FOOTER ===
  // Separator line
  page.drawRectangle({
    x: margin,
    y: 100,
    width: width - 2 * margin,
    height: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  let footerY = 82;

  page.drawText('Ons Mierloos Theater', {
    x: margin,
    y: footerY,
    size: 10,
    font: boldFont,
    color: brandTeal,
  });

  footerY -= 16;

  page.drawText(contactAddress, {
    x: margin,
    y: footerY,
    size: 9,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  footerY -= 14;

  // Build contact line: email + optional phone
  let contactLine = contactEmail;
  if (contactPhone) {
    contactLine += ` | ${contactPhone}`;
  }

  page.drawText(contactLine, {
    x: margin,
    y: footerY,
    size: 9,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  footerY -= 18;

  // Important notice
  page.drawText(
    'Bewaar dit ticket en toon het bij de ingang. Vrije zitplaatskeuze bij binnenkomst.',
    {
      x: margin,
      y: footerY,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    },
  );

  // Serialize PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate filename for ticket PDF
 */
export function getTicketFilename(ticket: Ticket, show: Show): string {
  const sanitizedTitle = show.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `ticket-${ticket.ticketNumber}-${sanitizedTitle}.pdf`;
}
