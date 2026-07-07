import Image from "next/image";

import { LogoMark } from "@/branding/logo/LogoMark";
import { cn } from "@/lib/utils";

/**
 * Hero media composition for About/Contact — recreates the mockups' "large HD
 * crest above the HELIX / DIVISION wordmark on a dark tech backdrop", with an
 * optional product bottle to the side. Built from the existing LogoMark crest
 * + real wordmark text (not a baked composite), so it stays crisp/responsive
 * and consistent with the header lockup.
 */
export function CrestShowcase({
  product = true,
  className,
}: {
  product?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-background-raised relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_45%_38%,rgba(179,18,27,0.14),transparent_62%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05]"
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        <LogoMark size={172} className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]" />
        <span className="font-heading text-foreground-primary mt-2 text-2xl tracking-[0.35em] uppercase sm:text-3xl">
          Helix
        </span>
        <span className="font-heading text-accent-crimson mt-1 text-sm tracking-[0.5em] uppercase">
          Division
        </span>
        <span className="text-foreground-muted mt-2 text-[0.6rem] tracking-[0.3em] uppercase">
          Research Materials
        </span>
      </div>

      {product && (
        <div className="absolute right-4 bottom-4 hidden aspect-square w-24 sm:block lg:w-28">
          <Image
            src="/products/bpc-157.png"
            alt="Helix Division research peptide vial"
            fill
            sizes="112px"
            className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
          />
        </div>
      )}
    </div>
  );
}
