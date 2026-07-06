"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { CatalogImage } from "@/types/catalog";

interface ProductGalleryProps {
  images: CatalogImage[];
  productName: string;
}

/**
 * Main image + thumbnail strip. Architected for N images from day one
 * (primary/gallery/label-closeup/packaging/lifestyle/coa-preview, see
 * CatalogImage.kind) — today most products only have 1 real render, so the
 * thumbnail strip simply doesn't render, but adding packaging/lifestyle
 * shots later is just more array entries, no component changes.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const active = sorted.find((img) => img.id === activeId) ?? sorted[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-background-raised border-border relative aspect-square overflow-hidden rounded-lg border">
        {active && (
          <Image
            src={active.url}
            alt={active.alt || productName}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2">
          {sorted.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveId(image.id)}
              aria-label={`Show ${image.alt || productName}`}
              aria-current={image.id === active?.id}
              className={cn(
                "border-border relative size-16 shrink-0 overflow-hidden rounded-md border transition-colors",
                image.id === active?.id && "border-accent-crimson",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
