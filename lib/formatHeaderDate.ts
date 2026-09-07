// Breaks a date into weekday / day / month parts (via Intl.formatToParts)
// so the caller can style the weekday differently and join them without
// the locale's default punctuation (e.g. the comma in "Mon, 7 Sep").
export function formatHeaderDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: get("weekday"),
    day: get("day"),
    month: get("month"),
  };
}
