"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollIndicators = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener("scroll", updateScrollIndicators, { passive: true });
    window.addEventListener("resize", updateScrollIndicators);
    return () => {
      el.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, [children]);

  return (
    <div className="group/scroll relative -mx-4 sm:mx-0 md:static">
      {/* Left fade */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-zinc-950 to-transparent transition-opacity duration-200 sm:hidden",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />

      <div
        ref={containerRef}
        className={cn(
          "scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-4 sm:px-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
          className
        )}
      >
        {children}
      </div>

      {/* Right fade */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-950 to-transparent transition-opacity duration-200 sm:hidden",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
    </div>
  );
}
