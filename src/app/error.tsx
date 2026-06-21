"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <svg className="h-16 w-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 className="text-lg font-semibold text-white">Terjadi Kesalahan</h2>
      <p className="text-sm text-zinc-400">Terjadi kesalahan yang tidak terduga. Silakan coba lagi.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}
