import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * better-sqlite3 is a native addon that resolves its `.node` binary at
   * runtime. The bundler cannot follow that, so it must stay an external
   * require handled by Node itself. It is only ever loaded on the local/VPS
   * path — serverless deployments go through @libsql/client instead.
   */
  serverExternalPackages: ["better-sqlite3"],

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
      {
        // Patient data — never let a proxy or a browser cache an API response.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
