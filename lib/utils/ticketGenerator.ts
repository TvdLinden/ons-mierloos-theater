import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { Ticket, Order, Performance, Show } from '@/lib/db';

export type TicketData = Ticket & {
  performance: Performance & {
    show: Show;
  };
  order: Order;
};

/**
 * Generate a PDF ticket with QR code and seat information
 */
export async function generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
  const { ticket, performance, show, order } = {
    ticket: ticketData,
    performance: ticketData.performance,
    show: ticketData.performance.show,
    order: ticketData.order,
  };

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  const { width, height } = page.getSize();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrToken, {
    errorCorrectionLevel: 'M',
    width: 200,
    margin: 1,
  });

  // Convert QR code data URL to PNG bytes
  const qrCodeBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);
  const qrCodeDims = qrCodeImage.scale(0.8);

  // Layout dimensions
  const margin = 50;
  const qrSize = 160;
  const qrX = width - margin - qrSize;
  const qrY = height - margin - qrSize;

  // Draw header
  page.drawText('ONS MIERLOOS THEATER', {
    x: margin,
    y: height - margin - 20,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('TOEGANGSBEWIJS', {
    x: margin,
    y: height - margin - 45,
    size: 14,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Draw ticket number
  page.drawText(`Ticket: ${ticket.ticketNumber}`, {
    x: margin,
    y: height - margin - 70,
    size: 10,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Draw QR code
  page.drawImage(qrCodeImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText('Scan bij binnenkomst', {
    x: qrX,
    y: qrY - 20,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Draw show information
  let currentY = height - margin - 120;

  page.drawText(show.title, {
    x: margin,
    y: currentY,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 40;

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
    x: margin + 100,
    y: currentY,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 25;

  page.drawText('Tijd:', {
    x: margin,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(timeStr, {
    x: margin + 100,
    y: currentY,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 40;

  // Seat information - HIGHLIGHTED SECTION
  const seatBoxY = currentY - 60;
  const seatBoxHeight = 80;

  // Draw background box for seat info
  page.drawRectangle({
    x: margin - 10,
    y: seatBoxY,
    width: width - 2 * margin + 20,
    height: seatBoxHeight,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });

  page.drawText('ZITPLAATS', {
    x: margin,
    y: currentY - 20,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Rij ${ticket.rowLetter}`, {
    x: margin,
    y: currentY - 50,
    size: 32,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.8),
  });

  page.drawText(`Stoel ${ticket.seatNumber}`, {
    x: margin + 120,
    y: currentY - 50,
    size: 32,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.8),
  });

  currentY = seatBoxY - 30;

  // Customer information
  page.drawText('Naam:', {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(order.customerName, {
    x: margin + 100,
    y: currentY,
    size: 11,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 25;

  page.drawText('Email:', {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(order.customerEmail, {
    x: margin + 100,
    y: currentY,
    size: 11,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 25;

  page.drawText('Bestelling:', {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(order.id.substring(0, 13), {
    x: margin + 100,
    y: currentY,
    size: 11,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  // Footer with theater info
  const footerY = 80;

  page.drawText('Ons Mierloos Theater', {
    x: margin,
    y: footerY + 40,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText('Adres: Dorpsstraat 123, 1234 AB Mierlo', {
    x: margin,
    y: footerY + 20,
    size: 9,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('Tel: 0123-456789 | info@onsmierloos.nl', {
    x: margin,
    y: footerY,
    size: 9,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Important notice
  page.drawText(
    'Bewaar dit ticket en toon het bij de ingang. Vrije zitplaatskeuze bij binnenkomst.',
    {
      x: margin,
      y: 40,
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
