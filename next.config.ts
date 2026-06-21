import type { NextConfig } from "next";

// Content-Security-Policy: restrict resource loading to mitigate XSS.
// 'unsafe-inline' diperlukan untuk Next.js inline styles & Adsterra.
// Adsterra script domains ditambahkan via env agar tidak hardcoded.
const adsterraDomain = process.env.NEXT_PUBLIC_ADSTERRA_DOMAIN || "";
const cspScriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "https://vercel.live",
  adsterraDomain,
].filter(Boolean).join(" ");

const cspImgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://cdn.myanimelist.net",
  "https://img.youtube.com",
  "https://uploads.mangadex.org",
  "https://meo.comick.pictures",
  "https://res.cloudinary.com",
].join(" ");

const cspMediaSrc = [
  "'self'",
  "blob:",
  "https:",
].join(" ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      `script-src ${cspScriptSrc}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src ${cspImgSrc}`,
      `media-src ${cspMediaSrc}`,
      `font-src 'self' data:`,
      `connect-src 'self' https:`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
      },
      {
        protocol: "https",
        hostname: "*.workers.dev",
      },
      {
        protocol: "https",
        hostname: "meo.comick.pictures",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
