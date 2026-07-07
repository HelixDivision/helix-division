"use client";

import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
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
import {
  deleteProductAction,
  duplicateProductAction,
  setProductFeaturedAction,
  setProductStatusAction,
} from "@/server/actions/admin-products";

/** Per-row product actions (Phase 9): edit link, duplicate, feature toggle, archive/activate, delete (confirmed). Each mutation delegates to a role-checked Server Action and refreshes the server-rendered table. */
export function ProductRowActions({
  productId,
  status,
  featured,
}: {
  productId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
}) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => Promise<{ success: boolean; error?: string }>,
    doneMessage: string,
  ) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(doneMessage);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Product actions" />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem render={<Link href={`/admin/products/${productId}`} />}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await duplicateProductAction(productId);
                if (result.success && result.productId) {
                  router.push(`/admin/products/${result.productId}`);
                }
                return result;
              }, "Product duplicated — you're editing the copy.")
            }
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onClick={() =>
              run(
                () => setProductFeaturedAction(productId, !featured),
                featured
                  ? "Removed from homepage featured rail."
                  : "Added to homepage featured rail.",
              )
            }
          >
            {featured ? <StarOff /> : <Star />}
            {featured ? "Unfeature" : "Feature on homepage"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === "ARCHIVED" ? (
            <DropdownMenuItem
              disabled={busy}
              onClick={() =>
                run(() => setProductStatusAction(productId, "ACTIVE"), "Product re-activated.")
              }
            >
              <ArchiveRestore /> Activate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={busy}
              onClick={() =>
                run(
                  () => setProductStatusAction(productId, "ARCHIVED"),
                  "Product archived — removed from the storefront.",
                )
              }
            >
              <Archive /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmingDelete} onOpenChange={(open) => !open && setConfirmingDelete(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            This permanently deletes the product, its variants, and its images. Products that have
            ever been ordered can&apos;t be deleted — archive those instead.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(() => deleteProductAction(productId), "Product deleted.").then(() =>
                  setConfirmingDelete(false),
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
