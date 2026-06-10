"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-[6.5rem] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/90 text-zinc-300 shadow-lg ring-1 ring-white/10 backdrop-blur-md transition-all hover:bg-zinc-700 hover:text-white md:bottom-6 md:bg-red-500 md:ring-0 md:text-white md:hover:bg-red-600",
        "opacity-100"
      )}
      aria-label="Kembali ke atas"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}
