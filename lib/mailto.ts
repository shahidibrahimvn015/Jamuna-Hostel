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
  return `https://mail.google.com/mail/?${query.toString()}`;
}

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
