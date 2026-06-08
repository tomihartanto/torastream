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
    <div className="mb-4 flex items-center justify-between px-4 md:px-0">
      <h2 className="text-lg font-bold text-white md:text-xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-medium text-red-500 transition-colors hover:text-red-400 md:text-sm"
        >
          {hrefLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
