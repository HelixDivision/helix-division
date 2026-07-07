"use client";

import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
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
import { deleteNewsletterAction } from "@/server/actions/admin-newsletters";

/** Per-row newsletter actions (Phase 9.5): edit, view public, delete (confirmed). */
export function NewsletterRowActions({
  newsletterId,
  slug,
  isPublic,
}: {
  newsletterId: string;
  slug: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    const result = await deleteNewsletterAction(newsletterId);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Delete failed.");
      return;
    }
    toast.success("Newsletter deleted.");
    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Newsletter actions" />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem render={<Link href={`/admin/newsletters/${newsletterId}`} />}>
            <Pencil /> Edit
          </DropdownMenuItem>
          {isPublic && (
            <DropdownMenuItem
              render={<a href={`/newsletter/${slug}`} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink /> View public
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
            <DialogTitle>Delete Newsletter</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">This permanently deletes the newsletter.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
