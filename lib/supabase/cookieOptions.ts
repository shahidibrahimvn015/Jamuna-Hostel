// Explicit (rather than relying on library defaults) so the session survives
// closing the browser and only ends on an actual sign-out or this long
// expiry — not when the tab/browser is closed.
export const SUPABASE_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 400, // 400 days — the max Chrome/Safari allow
};
