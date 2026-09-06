export function buildComplaintEmailContent(fields: {
  room: string;
  contact?: string | null;
  mac?: string | null;
  issue: string;
  rollNumber: string;
}) {
  const subject = `Network Issue at Jamuna hostel, Room no : ${fields.room}`;

  const bodyLines = [
    "Location: Jamuna Hostel",
    `Room no.: ${fields.room}`,
    "Connection Type: LAN / Ethernet",
    fields.mac ? `Device MAC: ${fields.mac}` : null,
    `Description: ${fields.issue}`,
    "",
    fields.rollNumber,
    fields.contact ? fields.contact : null,
  ].filter((line) => line !== null);

  return { subject, body: bodyLines.join("\n") };
}

type ComposeParams = {
  to: string;
  cc?: readonly string[];
  bcc?: readonly string[];
  subject: string;
  body: string;
  /** The Gmail account (email) this should be composed as, when known. */
  authuser?: string;
};

export function buildGmailWebComposeUrl(params: ComposeParams) {
  const query = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: params.to,
    su: params.subject,
    body: params.body,
  });
  if (params.cc?.length) query.set("cc", params.cc.join(","));
  if (params.bcc?.length) query.set("bcc", params.bcc.join(","));
  // Forces Gmail to compose using this specific already-signed-in account,
  // instead of whichever Google account happens to be active in the browser.
  if (params.authuser) query.set("authuser", params.authuser);
  return `https://mail.google.com/mail/?${query.toString()}`;
}

// iOS only — Gmail's documented custom URL scheme for compose. Android does
// not honor this; use buildGmailAndroidIntentUrl there instead.
export function buildGmailAppComposeUrl(params: ComposeParams) {
  const query = new URLSearchParams({
    to: params.to,
    subject: params.subject,
    body: params.body,
  });
  if (params.cc?.length) query.set("cc", params.cc.join(","));
  if (params.bcc?.length) query.set("bcc", params.bcc.join(","));
  return `googlegmail:///co?${query.toString()}`;
}

// Android — Chrome's `intent://` mechanism reliably launches a specific app
// package with a built-in web fallback if it's not installed, unlike a bare
// custom-scheme redirect (which Chrome on Android frequently just ignores).
export function buildGmailAndroidIntentUrl(params: ComposeParams) {
  const query = new URLSearchParams({
    to: params.to,
    subject: params.subject,
    body: params.body,
  });
  if (params.cc?.length) query.set("cc", params.cc.join(","));
  if (params.bcc?.length) query.set("bcc", params.bcc.join(","));

  const fallback = encodeURIComponent(buildGmailWebComposeUrl(params));
  return `intent:///co?${query.toString()}#Intent;scheme=googlegmail;package=com.google.android.gm;S.browser_fallback_url=${fallback};end`;
}
