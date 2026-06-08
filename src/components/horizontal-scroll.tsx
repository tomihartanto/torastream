import { cn } from "@/lib/utils";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
        className
      )}
    >
      {children}
    </div>
  );
}
