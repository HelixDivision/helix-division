"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletterAction } from "@/server/actions/newsletter";

/**
 * Public newsletter signup (Phase 9.5). Feeds NewsletterSubscriber (and the
 * admin analytics "subscriber growth" metric). Compact single-field form for
 * the footer or newsletter archive.
 */
export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await subscribeNewsletterAction({ email, source });
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not subscribe.");
      return;
    }
    setDone(true);
    setEmail("");
    toast.success("Subscribed — thank you.");
  }

  if (done) {
    return <p className="text-foreground-muted text-sm">You&apos;re subscribed. Thank you.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@lab.com"
        aria-label="Email address"
        className="flex-1"
      />
      <Button type="submit" disabled={busy}>
        {busy ? "..." : "Subscribe"}
      </Button>
    </form>
  );
}
