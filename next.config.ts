import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
