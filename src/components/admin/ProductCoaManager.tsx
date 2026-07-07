"use client";

import { Download, FileCheck2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { deleteProductCoaAction, setProductCoaAction } from "@/server/actions/admin-products";

/**
 * Product Certificate of Analysis manager (Phase 9.5) — the replacement for the
 * old free-text "lab testing summary". Upload/select a COA PDF via the Media
 * Library, replace it, or remove it; the PDP renders whatever's set here as a
 * real download (CertificateCard). At most one COA per product.
 */
export function ProductCoaManager({
  productId,
  currentCoa,
}: {
  productId: string;
  currentCoa: { url: string; label: string } | null;
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function attach(url: string) {
    setBusy(true);
    const result = await setProductCoaAction(productId, url, "Certificate of Analysis");
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not save the COA.");
      return;
    }
    toast.success(currentCoa ? "COA replaced." : "COA uploaded.");
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const result = await deleteProductCoaAction(productId);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not remove the COA.");
      return;
    }
    toast.success("COA removed.");
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-heading text-foreground-primary border-border border-b pb-2 text-sm tracking-wide uppercase">
        Certificate of Analysis
      </h3>

      {currentCoa ? (
        <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <span className="text-foreground-primary inline-flex items-center gap-2 text-sm">
            <FileCheck2 className="text-state-success size-5" strokeWidth={1.5} />
            COA attached — shown as a download on the product page.
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<a href={currentCoa.url} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
            >
              <Download className="size-4" /> View
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setPickerOpen(true)}>
              <Upload className="size-4" /> Replace
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-border rounded-lg border border-dashed p-6 text-center">
          <p className="text-foreground-muted text-sm">No Certificate of Analysis uploaded yet.</p>
          <Button className="mt-3" size="sm" disabled={busy} onClick={() => setPickerOpen(true)}>
            <Upload className="size-4" /> Upload / Select COA
          </Button>
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => attach(asset.url)}
        kind="PDF"
        folder="coa"
        title="Select or Upload a COA (PDF)"
      />
    </section>
  );
}
