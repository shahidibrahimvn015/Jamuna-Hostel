const SMAIL_EMAIL_RE = /^([a-zA-Z0-9]+)@smail\.iitm\.ac\.in$/i;

export function extractRollNumber(email: string): string | null {
  const match = email.match(SMAIL_EMAIL_RE);
  return match ? match[1].toLowerCase() : null;
}
