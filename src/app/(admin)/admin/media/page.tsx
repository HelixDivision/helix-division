import type { Metadata } from "next";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { listMedia, listMediaFolders } from "@/server/services/media";

export const metadata: Metadata = {
  title: "Media Library | Admin | Helix Division",
};

interface MediaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export default async function AdminMediaPage({ searchParams }: MediaPageProps) {
  const params = await searchParams;
  const kindParam = param(params.kind);
  const folders = await listMediaFolders();
  const { assets, total, page, pageSize } = await listMedia({
    kind: kindParam === "IMAGE" || kindParam === "PDF" ? kindParam : undefined,
    folder: param(params.folder),
    search: param(params.q),
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Media Library
        </h2>
        <p className="text-foreground-muted mt-1 text-sm">
          Upload once, reuse anywhere — product images, category banners, homepage graphics,
          research/newsletter images, and COA PDFs all draw from here.
        </p>
      </div>

      <AdminToolbar
        searchPlaceholder="Search filename or alt text..."
        filters={[
          {
            param: "kind",
            label: "Type",
            allLabel: "All types",
            options: [
              { value: "IMAGE", label: "Images" },
              { value: "PDF", label: "PDFs" },
            ],
          },
          ...(folders.length > 0
            ? [
                {
                  param: "folder",
                  label: "Folder",
                  allLabel: "All folders",
                  options: folders.map((f) => ({ value: f, label: f })),
                },
              ]
            : []),
        ]}
      />

      <MediaLibrary
        folders={folders}
        assets={assets.map((a) => ({
          id: a.id,
          url: a.url,
          originalName: a.originalName,
          kind: a.kind,
          folder: a.folder,
          alt: a.alt,
          sizeBytes: a.sizeBytes,
          createdAt: a.createdAt.toISOString(),
        }))}
      />

      <AdminPagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
