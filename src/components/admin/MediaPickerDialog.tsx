"use client";

import { FileText, Search, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  browseMediaAction,
  uploadMediaAction,
  type PickerAsset,
} from "@/server/actions/admin-media";

/**
 * Reusable Media Library picker (Phase 9.5) — the single "choose or upload an
 * asset" control shared by product images, COA uploads, category images/banners,
 * and the article/newsletter editors. Browses existing assets (so anything in
 * the library is reusable everywhere) and can upload a new one inline, calling
 * `onSelect` with the chosen asset's url + alt. `kind` restricts to images or
 * PDFs; `folder` tags new uploads for organization.
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  kind,
  folder = "general",
  title = "Select Media",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { url: string; alt: string | null }) => void;
  kind?: "IMAGE" | "PDF";
  folder?: string;
  title?: string;
}) {
  const [assets, setAssets] = useState<PickerAsset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh(searchTerm: string) {
    setLoading(true);
    const result = await browseMediaAction({ kind, search: searchTerm || undefined });
    setAssets(result.assets);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch the library when the dialog opens (external-sync effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) refresh(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    const result = await uploadMediaAction(fd);
    setUploading(false);
    if (!result.success || !result.asset) {
      toast.error(result.error ?? "Upload failed.");
      return;
    }
    toast.success("Uploaded.");
    onSelect({ url: result.asset.url, alt: result.asset.alt });
    onOpenChange(false);
  }

  const accept =
    kind === "PDF" ? "application/pdf" : kind === "IMAGE" ? "image/*" : "image/*,application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="border-border focus-within:border-accent-gunmetal relative flex h-9 flex-1 items-center gap-2 rounded-md border bg-transparent px-3">
              <Search className="text-foreground-muted size-4 shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refresh(search)}
                placeholder="Search library..."
                className="text-foreground-primary placeholder:text-foreground-muted h-full w-full bg-transparent text-sm outline-none"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" /> {uploading ? "Uploading..." : "Upload New"}
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-foreground-muted py-8 text-center text-sm">Loading...</p>
            ) : assets.length === 0 ? (
              <p className="text-foreground-muted py-8 text-center text-sm">
                No {kind === "PDF" ? "PDFs" : kind === "IMAGE" ? "images" : "assets"} yet — upload
                one above.
              </p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {assets.map((asset) => (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({ url: asset.url, alt: asset.alt });
                        onOpenChange(false);
                      }}
                      className={cn(
                        "border-border hover:border-accent-crimson group flex w-full flex-col overflow-hidden rounded-md border text-left transition-colors",
                      )}
                    >
                      <span className="bg-background-raised relative flex aspect-square items-center justify-center">
                        {asset.kind === "IMAGE" ? (
                          <Image
                            src={asset.url}
                            alt={asset.alt ?? ""}
                            fill
                            sizes="120px"
                            className="object-contain"
                          />
                        ) : (
                          <FileText className="text-foreground-muted size-8" />
                        )}
                      </span>
                      <span className="text-foreground-muted truncate p-1.5 text-xs">
                        {asset.originalName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
