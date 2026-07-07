"use client";

/**
 * Global error boundary (Prototype Launch) — the last resort for errors in the
 * root layout itself. Must render its own <html>/<body> because it replaces the
 * root layout. Kept dependency-free for maximum resilience.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0A0A0B",
          color: "#F2F2F0",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#9A9A9E", marginTop: "0.5rem", maxWidth: "24rem" }}>
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            border: "1px solid #B3121B",
            color: "#F2F2F0",
            background: "transparent",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
