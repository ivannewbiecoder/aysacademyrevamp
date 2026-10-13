import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const gaEnabled = !!process.env.NEXT_PUBLIC_GA_ID;

/**
 * CSP for the public site. Public pages are server-rendered for caching, so a
 * per-request nonce is not used here; inline scripts are limited to Next.js
 * hydration data and the optional GA4 snippet. All user content is sanitized
 * server-side (lib/markdown.ts). The admin panel gets a strict nonce-based CSP
 * from src/proxy.ts instead.
 */
const publicCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${gaEnabled ? " https://www.googletagmanager.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${gaEnabled ? " https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com" : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const PROGRAM_SLUGS = "biotrac|phystrac|chemtrac|mathrac-sma|mathrac-smp|scitrac|informatrac|geotrac|traconomics";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/((?!admin).*)", headers: [{ key: "Content-Security-Policy", value: publicCsp }] },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  /**
   * Static migration redirects for WordPress-era URLs. Anything more specific
   * lives in the `redirects` table, editable from /admin/redirect.
   */
  async redirects() {
    return [
      { source: "/artikel", has: [{ type: "query", key: "type", value: "berita" }], destination: "/berita", permanent: true },
      { source: "/list-program", destination: "/program", permanent: true },
      { source: `/:program(${PROGRAM_SLUGS})`, destination: "/program/:program", permanent: true },
      { source: `/program/:program(${PROGRAM_SLUGS})-batch-:batch`, destination: "/program/:program", permanent: true },
      { source: "/category/:path*", destination: "/artikel", permanent: true },
      { source: "/tag/:path*", destination: "/artikel", permanent: true },
      { source: "/author/:path*", destination: "/artikel", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})", destination: "/artikel", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})", destination: "/artikel", permanent: true },
    ];
  },
};

export default nextConfig;
