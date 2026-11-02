// Students sign in as <rollnumber>@smail.iitm.ac.in. Role accounts such as
// jamuna.legislator@ have dot-separated words instead, so dots are allowed
// between alphanumeric runs (no leading, trailing or doubled dots). Whatever
// is returned is used as the profile's roll_number; what that account may DO
// is decided separately by resolveRole, and it is a read-only viewer unless
// its email is in ADMIN_EMAILS or its value is on the residents list.
const SMAIL_EMAIL_RE =
  /^([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)@smail\.iitm\.ac\.in$/i;

export function extractRollNumber(email: string): string | null {
  const match = email.match(SMAIL_EMAIL_RE);
  return match ? match[1].toLowerCase() : null;
}
