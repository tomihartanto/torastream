import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  hrefLabel?: string;
}

export default function SectionHeader({
  title,
  href,
  hrefLabel = "Lihat Semua",
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-white md:text-xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white md:text-sm"
        >
          {hrefLabel}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
