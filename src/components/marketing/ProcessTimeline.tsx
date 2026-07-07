import type { LucideIcon } from "lucide-react";

import { HexIcon } from "@/components/marketing/HexIcon";
import { FadeIn } from "@/components/motion/FadeIn";

export interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Numbered process timeline — the "Our Process" (About) hex-icon row connected
 * by a dotted crimson line, matching the mockup. Responsive: horizontal row on
 * desktop, stacked on mobile. Each step reveals with a small stagger.
 */
export function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="relative">
      {/* Connecting line, behind the steps, desktop only. */}
      <div
        aria-hidden
        className="via-accent-crimson/40 absolute top-8 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-transparent to-transparent lg:block"
      />
      <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => (
          <FadeIn
            key={step.title}
            delay={index * 0.08}
            className="flex flex-col items-center text-center"
          >
            <div className="bg-background-base relative px-2">
              <HexIcon icon={step.icon} size={64} />
            </div>
            <span className="text-accent-crimson font-heading mt-3 text-sm tracking-widest">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-heading text-foreground-primary mt-1 text-sm tracking-wide uppercase">
              {step.title}
            </h3>
            <p className="text-foreground-muted mt-2 max-w-[14rem] text-sm leading-relaxed">
              {step.description}
            </p>
          </FadeIn>
        ))}
      </ol>
    </div>
  );
}
