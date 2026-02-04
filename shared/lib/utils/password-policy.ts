/**
 * Checks if a password meets policy requirements.
 */
export function isPasswordPolicyCompliant(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasMinLength = password.length >= minLength;
  return hasUpperCase && hasLowerCase && hasDigit && hasMinLength;
}

/**
 * Gets the password policy requirements as a human-readable string.
 */
export function getPasswordPolicyText(): string {
  return 'Minimaal 8 tekens, minstens één hoofdletter, één kleine letter en één cijfer';
}
