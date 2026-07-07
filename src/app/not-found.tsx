import { Home, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/branding/logo/LogoMark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center px-6 py-24 text-center sm:px-8">
      <LogoMark size={72} className="opacity-70" />
      <p className="font-heading text-accent-crimson mt-6 text-sm tracking-[0.25em] uppercase">
        Error 404
      </p>
      <h1 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
        Page Not Found
      </h1>
      <p className="text-foreground-muted mt-4 max-w-sm text-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
        back on mission.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/" />} nativeButton={false}>
          <Home className="size-4" /> Home
        </Button>
        <Button variant="outline" render={<Link href="/shop" />} nativeButton={false}>
          <Search className="size-4" /> Browse the Catalog
        </Button>
      </div>
    </div>
  );
}
