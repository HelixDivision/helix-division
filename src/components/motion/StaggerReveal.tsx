"use client";

import { motion as fm, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { motion as motionTokens } from "@/branding/tokens/motion";

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Per-item stagger delay in seconds — defaults to the token range midpoint. */
  staggerDelay?: number;
}

/**
 * Wraps a list of children (e.g. product cards, feature items) and reveals
 * them with a staggered fade-up as the group scrolls into view. Each direct
 * child becomes one animated item — see DESIGN_SYSTEM.md#motion-system.
 */
export function StaggerReveal({ children, className, staggerDelay }: StaggerRevealProps) {
  const reduceMotion = useReducedMotion();
  const distance = reduceMotion ? 0 : motionTokens.distance.fadeUp;
  const stagger = staggerDelay ?? (motionTokens.stagger.min + motionTokens.stagger.max) / 2;

  return (
    <fm.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <fm.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: distance },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: motionTokens.duration.base,
                    ease: motionTokens.easing.enter,
                  },
                },
              }}
            >
              {child}
            </fm.div>
          ))
        : children}
    </fm.div>
  );
}
