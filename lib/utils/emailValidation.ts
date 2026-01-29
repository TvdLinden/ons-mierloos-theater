/**
 * Email validation utilities shared across client and server
 */

/**
 * Email validation regex - matches the pattern used in mailing list API
 * Requires: local@domain.extension format
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize email address by trimming whitespace and converting to lowercase
 * @param email - Raw email input
 * @returns Normalized email
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate email format using regex
 * @param email - Email to validate (should be normalized first)
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate and normalize email in one step
 * @param email - Raw email input
 * @returns Object with normalized email and validation status
 */
export function validateEmail(email: string): {
  normalized: string;
  isValid: boolean;
  error?: string;
} {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return {
      normalized: '',
      isValid: false,
      error: 'E-mailadres is verplicht.',
    };
  }

  if (!isValidEmail(normalized)) {
    return {
      normalized,
      isValid: false,
      error: 'Voer een geldig e-mailadres in (bijvoorbeeld: naam@voorbeeld.nl)',
    };
  }

  return {
    normalized,
    isValid: true,
  };
}
