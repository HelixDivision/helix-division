"use client";

import { motion as fm, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { motion as motionTokens } from "@/branding/tokens/motion";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds, e.g. for staggered reveals composed manually. */
  delay?: number;
  /** Reveal on scroll into view rather than on mount. */
  whileInView?: boolean;
}

/**
 * The single scroll-reveal/entrance primitive for the app — see
 * DESIGN_SYSTEM.md#motion-system and COMPONENT_GUIDELINES.md#motion.
 * Nothing outside components/motion should import framer-motion directly.
 */
export function FadeIn({ children, className, delay = 0, whileInView = true }: FadeInProps) {
  const reduceMotion = useReducedMotion();
  const distance = reduceMotion ? 0 : motionTokens.distance.fadeUp;

  const viewProps = whileInView
    ? { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } }
    : { initial: "hidden", animate: "visible" };

  return (
    <fm.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: motionTokens.duration.base,
            delay,
            ease: motionTokens.easing.enter,
          },
        },
      }}
      {...viewProps}
    >
      {children}
    </fm.div>
  );
}
