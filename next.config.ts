import type { NextConfig } from "next";

// Response headers applied to every route.
//
// The CSP deliberately has no script-src/style-src. Restricting scripts needs
// per-request nonces, which forces every page to render dynamically and would
// break Next's inline bootstrap, Vercel Analytics and Supabase realtime if any
// source were missed. The directives below close clickjacking, <base> hijack,
// plugin content and cross-origin form posts without that risk.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // Older browsers ignore CSP frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops browsers sniffing an uploaded file in the public buckets into HTML/JS.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
