const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'evem-japan.com';

/**
 * Validate that the email belongs to the allowed domain
 */
export function isAllowedEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/**
 * Get the allowed email domain
 */
export function getAllowedDomain(): string {
  return ALLOWED_EMAIL_DOMAIN;
}



