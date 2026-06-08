import { cn } from "@/lib/utils";

interface AdSlotProps {
  variant?: "banner" | "rectangle" | "native" | "responsive";
  className?: string;
}

export default function AdSlot({
  variant = "responsive",
  className,
}: AdSlotProps) {
  const bannerId = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_ID;
  const nativeId = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_ID;
  const rectangleId = process.env.NEXT_PUBLIC_ADSTERRA_RECTANGLE_ID;

  const adIdMap: Record<string, string | undefined> = {
    banner: bannerId,
    rectangle: rectangleId,
    native: nativeId,
    responsive: bannerId,
  };

  const sizes: Record<string, string> = {
    banner: "min-h-[90px]",
    rectangle: "min-h-[250px]",
    native: "min-h-[120px]",
    responsive: "min-h-[100px]",
  };

  const adId = adIdMap[variant];

  if (adId) {
    return (
      <div className={cn("flex w-full items-center justify-center py-4", className)}>
        <div
          id={`adsterra-${variant}-${adId}`}
          className={cn("w-full max-w-[728px]", sizes[variant])}
        >
          <script
            type="text/javascript"
            src={`//www.topcreativeformat.com/${adId}/invoke.js`}
            async
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-center justify-center py-4", className)}>
      <div
        className={cn(
          "flex w-full max-w-[728px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50",
          sizes[variant]
        )}
      >
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">
          Ad Slot
        </span>
        <span className="mt-1 text-xs text-zinc-700">
          {variant} - isi NEXT_PUBLIC_ADSTERRA_{variant.toUpperCase()}_ID di .env
        </span>
      </div>
    </div>
  );
}
