import { Download, FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CatalogDocument } from "@/types/catalog";

/** Prominent COA card — a real download per document when present, an honest fallback message when not. */
export function CertificateCard({ documents }: { documents?: CatalogDocument[] }) {
  const coaDocs = documents?.filter((doc) => doc.kind === "coa") ?? [];

  return (
    <div className="border-border bg-background-raised flex flex-col gap-3 rounded-lg border p-5">
      <div className="flex items-center gap-2">
        <FileCheck2 className="text-accent-gunmetal size-5" strokeWidth={1.5} />
        <span className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Certificate of Analysis
        </span>
      </div>

      {coaDocs.length > 0 ? (
        <div className="flex flex-col gap-2">
          {coaDocs.map((doc) => (
            <Button
              key={doc.id}
              variant="outline"
              size="sm"
              className="w-fit"
              render={<a href={doc.url} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
            >
              <Download />
              {doc.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-foreground-muted text-sm">
          Certificate of Analysis available upon request.
        </p>
      )}
    </div>
  );
}
