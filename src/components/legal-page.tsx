import type { ReactNode } from "react";

/**
 * Layout konsisten untuk semua halaman legal (Privacy, ToS, Cookie, DMCA).
 * Menampilkan judul, tanggal update, dan prose yang mudah dibaca.
 */
export default function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: { heading: string; body: ReactNode }[];
}) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Terakhir diperbarui: {lastUpdated}
      </p>
      {intro && (
        <p className="mt-6 leading-relaxed text-zinc-300">{intro}</p>
      )}
      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold text-white">{s.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-zinc-300">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
