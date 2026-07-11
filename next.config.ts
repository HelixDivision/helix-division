import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin media uploads post the file through a Server Action; Next's default
      // body limit is 1 MB, which rejected any real image with HTTP 413 before the
      // media service (8 MB images / 25 MB PDFs) ever ran. Raise it to cover images.
      // NOTE: Vercel's serverless platform caps request bodies at ~4.5 MB, so on
      // production this is the effective ceiling for Server-Action uploads; files
      // larger than that would need client-direct-to-Blob (@vercel/blob/client) —
      // a future enhancement, not needed for typical product photography.
      bodySizeLimit: "8mb",
    },
  },
  images: {
    // Product/media images can be uploaded as SVG (see server/services/media.ts's
    // allowed types) — next/image refuses to optimize SVG unless explicitly
    // allowed, which otherwise renders those uploads as broken images. Sandboxed
    // + attachment CSP is the framework-recommended safe way to permit them.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // The product-image manager also accepts external image URLs; without this,
    // next/image throws "hostname not configured" at render time for any of them.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
