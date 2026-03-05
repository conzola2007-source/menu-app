import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
});

/**
 * HTTP security headers applied to every response.
 * These are a defence-in-depth layer on top of Supabase RLS and Next.js auth.
 *
 * CSP notes:
 *  - 'unsafe-inline' for script/style is required by Next.js (inline hydration scripts)
 *    and Tailwind (runtime CSS injection). Nonce-based CSP would be the gold standard
 *    but requires significant additional infra work — add in a later hardening pass.
 *  - connect-src allows wss:// for Supabase Realtime subscriptions.
 *  - frame-ancestors 'none' prevents clickjacking.
 */
const securityHeaders = [
  // Prevent browsers from MIME-sniffing a response away from the declared content-type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Deny embedding in iframes from other origins (clickjacking protection).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Disable browser DNS prefetch to avoid leaking URLs to third-party DNS resolvers.
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Only send the origin as referrer when navigating cross-origin.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features we don't use.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // Enforce HTTPS for 1 year (only sent over HTTPS; ignored on HTTP in dev).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Content Security Policy.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for hydration scripts.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind and shadcn/ui inject styles at runtime.
      "style-src 'self' 'unsafe-inline'",
      // Allow data URIs and blob URLs for images (PWA icons, avatars).
      "img-src 'self' data: blob:",
      // Supabase REST, Auth, Storage, and Realtime (wss://).
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // Service worker scope.
      "worker-src 'self' blob:",
      // Fonts served from our own domain only.
      "font-src 'self'",
      // Block all frames.
      "frame-ancestors 'none'",
      // Block plugins.
      "object-src 'none'",
      // Restrict form submissions to same origin.
      "form-action 'self'",
      // Upgrade insecure requests in production.
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Acknowledge that next-pwa adds a webpack plugin while Turbopack is the default bundler.
  // PWA service worker generation only runs in production builds (webpack).
  turbopack: {},

  async headers() {
    return [
      {
        // Apply security headers to all routes.
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withPWA(nextConfig);
