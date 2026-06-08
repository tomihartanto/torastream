"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  variant?: "banner" | "rectangle";
  className?: string;
}

const AD_SIZES = {
  banner: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
};

export default function AdSlot({
  variant = "banner",
  className,
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bannerKey = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY;
  const rectangleKey = process.env.NEXT_PUBLIC_ADSTERRA_RECTANGLE_KEY;

  const keyMap: Record<string, string | undefined> = {
    banner: bannerKey,
    rectangle: rectangleKey,
  };

  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  if (!adsEnabled) return null;

  const key = keyMap[variant];
  const { width, height } = AD_SIZES[variant];

  useEffect(() => {
    if (!key || !containerRef.current) return;

    const container = containerRef.current;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '${key}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
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
  }, [key, width, height]);

  if (!key) return null;

  return (
    <div className={cn("flex w-full items-center justify-center py-4", className)}>
      <div ref={containerRef} style={{ minWidth: width, minHeight: height }} />
    </div>
  );
}
