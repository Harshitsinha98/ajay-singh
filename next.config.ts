import type { NextConfig } from "next";

/**
 * This is a purely informational site — no database, no API routes, no patient
 * data. That keeps the config small: image formats, a few hardening headers,
 * and nothing else.
 */
const nextConfig: NextConfig = {
  images: {
    // Every photograph is the doctor's own, served from /public. No remote
    // hosts are configured, so there is no open image-proxy surface.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
