import Image from "next/image";

import { cn } from "@/lib/utils";

// Source is a clean 1024x1536 studio render of just the crest (no wordmark),
// but it's not cropped tight and sits on a neutral gray gradient (not
// transparent, not black) — see public/branding/crest-mark.png. We crop a
// square window around the shield (~[90,930] x [260,1100] in source pixels)
// by rendering the image oversized and shifting it, then fade the
// leftover gray background to transparent with a radial mask so it
// integrates on any background color (a color blend-mode trick like
// mix-blend-screen only works against pure black — see Logo.tsx — this
// asset's backdrop is gray, so a real alpha mask is what actually works).
const WIDTH_SCALE = 1.22;
const HEIGHT_SCALE = 1.83;
const LEFT_OFFSET_PERCENT = 10.7;
const TOP_OFFSET_PERCENT = 31;

interface LogoMarkProps {
  /** Pixel height of the rendered mark. */
  size?: number;
  className?: string;
}

/** Crest-only mark (no wordmark) — compact header/footer icon and the standalone divider mark between split panels. */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        width: size,
        height: size,
        maskImage: "radial-gradient(circle, black 55%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(circle, black 55%, transparent 78%)",
      }}
    >
      <Image
        src="/branding/crest-mark.png"
        alt="Helix Division"
        width={size * WIDTH_SCALE}
        height={size * HEIGHT_SCALE}
        className="absolute max-w-none"
        style={{
          width: size * WIDTH_SCALE,
          height: size * HEIGHT_SCALE,
          left: `-${LEFT_OFFSET_PERCENT}%`,
          top: `-${TOP_OFFSET_PERCENT}%`,
        }}
      />
    </div>
  );
}
