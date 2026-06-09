export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-red-500 ${className}`}>
      <svg className="h-4 w-4 text-white" viewBox="0 0 100 100" fill="none">
        {/* Tiger stripes */}
        <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9">
          <path d="M28 28 Q24 50 28 72" />
          <path d="M42 26 Q37 50 42 74" />
          <path d="M56 30 Q52 50 56 70" />
        </g>
        {/* Play triangle */}
        <path d="M62 34L62 66L86 50Z" fill="currentColor" opacity="0.95" />
      </svg>
    </div>
  );
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className || ""}`}>
      <LogoIcon />
      <span className="text-base font-bold text-white">
        Tora<span className="text-red-500">Stream</span>
      </span>
    </span>
  );
}
