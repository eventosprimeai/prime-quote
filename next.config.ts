import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // ═══════════════════════════════════════════════════════
  // EDGE CACHING — Defensa contra picos de 40,000+ usuarios
  // Las páginas públicas de cotización son servidas por CDN
  // ═══════════════════════════════════════════════════════
  async headers() {
    return [
      {
        // Páginas públicas de cotización — cacheable por CDN (5 min + 1h stale)
        source: "/q/:token*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // Assets estáticos — cache agresivo 1 año (inmutables por hash)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // APIs privadas — nunca cachear (datos de usuario, billing, auth)
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        // Panel de admin — no cachear nunca
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, private",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
