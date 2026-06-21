import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <svg className="h-16 w-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 className="text-lg font-semibold text-white">Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-zinc-400">Halaman yang Anda cari tidak tersedia.</p>
      <Link
        href="/"
        className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
