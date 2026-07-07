import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

/**
 * Dynamic Open Graph / social-preview image (Prototype Launch). Generated at
 * request time so there's no missing static asset, branded to match the site
 * (dark base, metallic wordmark, crimson accent). Next auto-wires this into the
 * page metadata for OG + Twitter cards.
 */
export const alt = "Helix Division — Premium Research Materials";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0B",
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(179,18,27,0.22), transparent 55%)",
      }}
    >
      <div
        style={{
          fontSize: 128,
          fontWeight: 700,
          letterSpacing: 24,
          color: "#EDEDEB",
          display: "flex",
        }}
      >
        HELIX
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 40,
          color: "#B3121B",
          marginTop: 8,
          display: "flex",
        }}
      >
        DIVISION
      </div>
      <div
        style={{
          width: 80,
          height: 4,
          background: "#B3121B",
          marginTop: 32,
        }}
      />
      <div
        style={{
          fontSize: 28,
          letterSpacing: 8,
          color: "#9A9A9E",
          marginTop: 32,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        {siteConfig.tagline}
      </div>
    </div>,
    { ...size },
  );
}
