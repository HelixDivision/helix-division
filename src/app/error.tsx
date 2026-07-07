"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary (Prototype Launch) — catches render/data errors in
 * the page tree and offers recovery, instead of a blank crash. The root layout
 * (header/footer) still renders around it.
 */
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // In production this is where a Sentry/monitoring hook would report.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center px-6 py-24 text-center sm:px-8">
      <p className="font-heading text-accent-crimson text-sm tracking-[0.25em] uppercase">
        Something went wrong
      </p>
      <h1 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
        An Unexpected Error Occurred
      </h1>
      <p className="text-foreground-muted mt-4 max-w-sm text-sm">
        We hit a snag loading this page. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> Try Again
        </Button>
        <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
