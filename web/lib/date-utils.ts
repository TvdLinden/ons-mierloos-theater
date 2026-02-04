'use client';

/**
 * Get the date format pattern based on user's locale
 */
export function getLocaleDateFormat(locale?: string): string {
  const testDate = new Date(2000, 0, 31); // January 31, 2000
  const formatted = testDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Extract the format pattern from the formatted string
  const pattern = formatted.replace('31', 'dd').replace('01', 'MM').replace('2000', 'yyyy');

  return pattern;
}

/**
 * Get the date-time format pattern based on user's locale
 */
export function getLocaleDateTimeFormat(locale?: string): string {
  const testDate = new Date(2000, 0, 31, 23, 59); // January 31, 2000 23:59
  const formatted = testDate.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Extract the format pattern
  const pattern = formatted
    .replace('31', 'dd')
    .replace('01', 'MM')
    .replace('2000', 'yyyy')
    .replace('23', 'HH')
    .replace('59', 'mm');

  return pattern;
}

/**
 * Get the time format pattern
 */
export function getLocaleTimeFormat(locale?: string): string {
  return 'HH:mm'; // 24-hour format
}

/**
 * Get the placeholder based on format
 */
export function getPlaceholder(format: string): string {
  return format;
}

/**
 * Format a date according to locale
 */
export function formatDate(date: Date | undefined, locale?: string): string {
  if (!date) return '';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a datetime according to locale
 */
export function formatDateTime(date: Date | undefined, locale?: string): string {
  if (!date) return '';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(date: Date | undefined, locale?: string): string {
  if (!date) return '';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Parse a date string with input mask
 */
export function parseDateString(value: string, locale?: string): Date | undefined {
  if (!value) return undefined;

  // Remove any non-digit characters except separators
  const cleaned = value.replace(/[^\d:/\-.\s]/g, '');

  // Try to parse as date-time first (if it contains time indicators)
  if (cleaned.includes(':')) {
    const parsed = parseDateTime(cleaned, locale);
    if (parsed) return parsed;
  }

  // Try parsing as date only
  const format = getLocaleDateFormat(locale);
  const parts = cleaned.split(/[\s/\-.]/);
  const formatParts = format.split(/[\s/\-.]/);

  if (parts.length < 3) return undefined;

  let day = 0,
    month = 0,
    year = 0;

  formatParts.forEach((part, index) => {
    const value = Number.parseInt(parts[index], 10);
    if (isNaN(value)) return;

    if (part.includes('d')) day = value;
    else if (part.includes('M')) month = value;
    else if (part.includes('y')) year = value;
  });

  // Handle 2-digit years
  if (year < 100) {
    year += year < 50 ? 2000 : 1900;
  }

  if (day === 0 || month === 0 || year === 0) return undefined;

  const date = new Date(year, month - 1, day);

  // Validate the date
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return undefined;
  }

  return date;
}

/**
 * Parse a datetime string
 */
function parseDateTime(value: string, locale?: string): Date | undefined {
  const format = getLocaleDateTimeFormat(locale);

  // Split into date and time parts
  const dateTimeParts = value.split(/[\s]/);
  if (dateTimeParts.length < 2) return undefined;

  const datePart = dateTimeParts[0];
  const timePart = dateTimeParts[1];

  // Parse date
  const dateParts = datePart.split(/[/\-.]/);
  const formatParts = format.split(/[\s/\-.:]/);

  let day = 0,
    month = 0,
    year = 0;

  formatParts.forEach((part, index) => {
    if (index >= dateParts.length) return;
    const value = Number.parseInt(dateParts[index], 10);
    if (isNaN(value)) return;

    if (part.includes('d')) day = value;
    else if (part.includes('M')) month = value;
    else if (part.includes('y')) year = value;
  });

  // Parse time
  const timeParts = timePart.split(':');
  const hour = Number.parseInt(timeParts[0], 10) || 0;
  const minute = Number.parseInt(timeParts[1], 10) || 0;

  if (day === 0 || month === 0 || year === 0) return undefined;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;

  // Handle 2-digit years
  if (year < 100) {
    year += year < 50 ? 2000 : 1900;
  }

  const date = new Date(year, month - 1, day, hour, minute);

  // Validate
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return undefined;
  }

  return date;
}

/**
 * Parse time string (HH:mm)
 */
export function parseTimeString(value: string): { hours: number; minutes: number } | undefined {
  const cleaned = value.replace(/[^\d:]/g, '');
  const parts = cleaned.split(':');

  if (parts.length !== 2) return undefined;

  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return undefined;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return undefined;

  return { hours, minutes };
}

/**
 * Apply input mask to value as user types
 */
export function applyDateMask(value: string, format: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Get separator from format
  const separator = format.match(/[/\-.\s]/)?.[0] || '/';

  let masked = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    const formatChar = format[i];

    if (/[dMyHm]/.test(formatChar)) {
      masked += digits[digitIndex++];
    } else {
      // Add separator when we've entered enough digits
      const beforeSep = format.substring(0, i).replace(/[^dMyHm]/g, '').length;
      if (digitIndex >= beforeSep && digitIndex > 0) {
        masked += formatChar;
      }
    }
  }

  return masked;
}

/**
 * Apply datetime input mask
 */
export function applyDateTimeMask(value: string, format: string): string {
  const digits = value.replace(/\D/g, '');
  let masked = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    const formatChar = format[i];

    if (/[dMyHm]/.test(formatChar)) {
      masked += digits[digitIndex++];
    } else {
      const beforeSep = format.substring(0, i).replace(/[^dMyHm]/g, '').length;
      if (digitIndex >= beforeSep && digitIndex > 0) {
        masked += formatChar;
      }
    }
  }

  return masked;
}

/**
 * Apply time input mask
 */
export function applyTimeMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  let masked = '';

  for (let i = 0; i < digits.length && i < 4; i++) {
    if (i === 2) masked += ':';
    masked += digits[i];
  }

  return masked;
}
