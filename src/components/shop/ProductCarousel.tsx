"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCarouselProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal scroll-snap product carousel — see DESIGN_SYSTEM.md#motion-system
 * for the easing/duration this borrows. Deliberately built on native CSS
 * scroll-snap + scrollBy rather than a carousel library: mobile swipe is free
 * (native touch scrolling), and desktop gets arrow controls that scroll by
 * ~90% of the visible width. Each child is wrapped in a fixed-width,
 * full-height snap slide so every card in a row shares the same height
 * regardless of its own content — pass ProductCard instances as children.
 */
export function ProductCarousel({ children, className }: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateArrows = () => {
      setCanScrollPrev(el.scrollLeft > 4);
      setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9 * direction, behavior: "smooth" });
  }

  return (
    <div className={cn("group/carousel relative", className)}>
      <div
        ref={scrollerRef}
        className="scrollbar-hide -mx-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-smooth px-6 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0"
      >
        {Children.map(children, (child) => (
          <div className="w-[68%] shrink-0 snap-start sm:w-[45%] lg:w-[calc(25%-12px)]">
            {child}
          </div>
        ))}
      </div>

      {/* Edge fades hint there's more to scroll — fade out once each end is reached. */}
      <div
        className={cn(
          "from-background-base pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r to-transparent transition-opacity duration-250 lg:block",
          canScrollPrev ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "from-background-base pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l to-transparent transition-opacity duration-250 lg:block",
          canScrollNext ? "opacity-100" : "opacity-0",
        )}
      />

      <Button
        variant="outline"
        size="icon"
        aria-label="Previous products"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollPrev}
        className="bg-background-raised/95 shadow-elevation-2 absolute top-1/2 -left-5 z-10 hidden -translate-y-1/2 backdrop-blur-sm transition-opacity duration-250 disabled:pointer-events-none disabled:opacity-0 lg:inline-flex"
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next products"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollNext}
        className="bg-background-raised/95 shadow-elevation-2 absolute top-1/2 -right-5 z-10 hidden -translate-y-1/2 backdrop-blur-sm transition-opacity duration-250 disabled:pointer-events-none disabled:opacity-0 lg:inline-flex"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
