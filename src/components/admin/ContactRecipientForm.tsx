"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveContactRecipientAction } from "@/server/actions/admin-contact";

/** Admin control for the contact-form recipient email (Prototype Launch). */
export function ContactRecipientForm({ current }: { current: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(current);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const result = await saveContactRecipientAction({ email });
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not save.");
      return;
    }
    toast.success("Recipient updated.");
    router.refresh();
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recipient">Contact form recipient email</Label>
        <Input
          id="recipient"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-foreground-muted text-xs">
          Where contact-form submissions are emailed. Submissions are also always saved under
          Messages.
        </p>
      </div>
      <Button className="w-fit" onClick={save} disabled={busy}>
        {busy ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
