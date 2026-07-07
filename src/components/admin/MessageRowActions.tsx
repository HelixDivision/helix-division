"use client";

import { Archive, MailOpen, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteMessageAction, setMessageStatusAction } from "@/server/actions/admin-contact";

/** Per-row contact-message actions (Prototype Launch): mark read/archived, delete. */
export function MessageRowActions({
  id,
  status,
}: {
  id: string;
  status: "NEW" | "READ" | "ARCHIVED";
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ success: boolean; error?: string }>, done: string) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(done);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Message actions" />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {status !== "READ" && (
            <DropdownMenuItem
              onClick={() => run(() => setMessageStatusAction(id, "READ"), "Marked as read.")}
            >
              <MailOpen /> Mark as read
            </DropdownMenuItem>
          )}
          {status !== "ARCHIVED" && (
            <DropdownMenuItem
              onClick={() => run(() => setMessageStatusAction(id, "ARCHIVED"), "Archived.")}
            >
              <Archive /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirming} onOpenChange={(open) => !open && setConfirming(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">This permanently deletes the message.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(() => deleteMessageAction(id), "Message deleted.").then(() =>
                  setConfirming(false),
                )
              }
            >
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
