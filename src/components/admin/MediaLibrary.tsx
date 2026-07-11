"use client";

import { Copy, FileText, MoreHorizontal, Pencil, RefreshCw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteMediaAction,
  replaceMediaAction,
  updateMediaAction,
  uploadMediaAction,
} from "@/server/actions/admin-media";

export interface MediaAssetView {
  id: string;
  url: string;
  originalName: string;
  kind: "IMAGE" | "PDF";
  folder: string;
  alt: string | null;
  sizeBytes: number;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Media Library management grid (Phase 9.5) — upload, replace, delete, edit
 * (alt + folder for organization), and copy-URL for reuse. Assets arrive as
 * props from the server page (which reads the URL-driven filters); mutations
 * call the role-checked admin-media actions and refresh.
 */
export function MediaLibrary({ assets, folders }: { assets: MediaAssetView[]; folders: string[] }) {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [uploadFolder, setUploadFolder] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaAssetView | null>(null);
  const [deleting, setDeleting] = useState<MediaAssetView | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", uploadFolder || "general");
    const result = await uploadMediaAction(fd);
    setUploading(false);
    // TEMP DIAGNOSTIC — surface the server-side trace in the browser console and
    // toast, so the exact upload path/failure is visible without Vercel logs.
    console.log("[HELIX upload trace]", result.trace, result);
    if (!result.success) {
      toast.error(
        `${result.error ?? "Upload failed."} — trace: ${(result.trace ?? []).join(" | ")}`,
      );
      return;
    }
    toast.success(`Uploaded. trace: ${(result.trace ?? []).join(" | ")}`);
    router.refresh();
  }

  async function onReplace(file: File) {
    if (!replacingId) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const result = await replaceMediaAction(replacingId, fd);
    setReplacingId(null);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Replace failed.");
      return;
    }
    toast.success("File replaced.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteMediaAction(deleting.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Delete failed.");
      return;
    }
    toast.success("Asset deleted.");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="upload-folder">Folder</Label>
          <Input
            id="upload-folder"
            list="media-folders"
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="w-40"
            placeholder="general"
          />
          <datalist id="media-folders">
            {folders.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <Button disabled={uploading} onClick={() => uploadRef.current?.click()}>
          <Upload className="size-4" /> {uploading ? "Uploading..." : "Upload Image or PDF"}
        </Button>
        <p className="text-foreground-muted text-xs">Images up to 8 MB · PDFs up to 25 MB</p>
      </div>

      <input
        ref={replaceRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onReplace(file);
          e.target.value = "";
        }}
      />

      {assets.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No assets match these filters.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="border-border flex flex-col overflow-hidden rounded-lg border"
            >
              <div className="bg-background-raised relative flex aspect-square items-center justify-center">
                {asset.kind === "IMAGE" ? (
                  <Image
                    src={asset.url}
                    alt={asset.alt ?? ""}
                    fill
                    sizes="200px"
                    className="object-contain"
                  />
                ) : (
                  <FileText className="text-foreground-muted size-10" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="text-foreground-primary truncate text-xs">{asset.originalName}</p>
                  <p className="text-foreground-muted mt-0.5 text-xs">
                    {asset.folder} · {formatBytes(asset.sizeBytes)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" aria-label="Asset actions" />}
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(asset.url);
                        toast.success("URL copied.");
                      }}
                    >
                      <Copy /> Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<a href={asset.url} target="_blank" rel="noopener noreferrer" />}
                    >
                      <FileText /> Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditing(asset)}>
                      <Pencil /> Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setReplacingId(asset.id);
                        replaceRef.current?.click();
                      }}
                    >
                      <RefreshCw /> Replace file
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(asset)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EditMediaDialog
        asset={editing}
        folders={folders}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            Delete “{deleting?.originalName}”? Anything still referencing its URL will show a broken
            link until re-pointed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditMediaDialog({
  asset,
  folders,
  onClose,
  onSaved,
}: {
  asset: MediaAssetView | null;
  folders: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [alt, setAlt] = useState("");
  const [folder, setFolder] = useState("general");
  const [busy, setBusy] = useState(false);

  // Sync local state when a new asset opens the dialog.
  const [lastId, setLastId] = useState<string | null>(null);
  if (asset && asset.id !== lastId) {
    setLastId(asset.id);
    setAlt(asset.alt ?? "");
    setFolder(asset.folder);
  }

  async function save() {
    if (!asset) return;
    setBusy(true);
    const result = await updateMediaAction(asset.id, { alt, folder });
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Save failed.");
      return;
    }
    toast.success("Details saved.");
    onSaved();
  }

  return (
    <Dialog open={asset !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Asset Details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-alt">Alt text</Label>
            <Input id="edit-alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-folder">Folder</Label>
            <Input
              id="edit-folder"
              list="media-folders-edit"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
            <datalist id="media-folders-edit">
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
