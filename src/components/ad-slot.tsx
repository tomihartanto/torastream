"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  variant?: "banner" | "rectangle" | "native";
  className?: string;
}

const AD_SIZES: Record<string, { width: number; height: number }> = {
  banner: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  native: { width: 728, height: 90 },
};

export default function AdSlot({
  variant = "banner",
  className,
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const keyMap: Record<string, string | undefined> = {
    banner: process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY,
    rectangle: process.env.NEXT_PUBLIC_ADSTERRA_RECTANGLE_KEY,
    native: process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY,
  };

  const key = keyMap[variant];
  const size = AD_SIZES[variant] || AD_SIZES.banner;

  useEffect(() => {
    if (!adsEnabled || !key || !containerRef.current) return;

    const container = containerRef.current;

    const optionsScript = document.createElement("script");
    optionsScript.textContent = `
      atOptions = {
        'key' : '${key}',
        'format' : 'iframe',
        'height' : ${size.height},
        'width' : ${size.width},
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `https://www.highperformanceformat.com/${key}/invoke.js`;
    invokeScript.async = true;

    container.appendChild(optionsScript);
    container.appendChild(invokeScript);

    return () => {
      container.innerHTML = "";
    };
  }, [adsEnabled, key, size.height, size.width]);

  if (!adsEnabled || !key) return null;

  return (
    <div className={cn("flex w-full items-center justify-center py-4", className)}>
      <div ref={containerRef} style={{ minWidth: size.width, minHeight: size.height }} />
    </div>
  );
}
