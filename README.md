# ToraStream

Platform anime dan manga berbahasa Indonesia. Jelajahi katalog anime terlengkap, baca manga terbaru, semua gratis.

## Fitur

- **Anime** — Jelajahi anime musim ini, terpopuler, dan yang akan datang
- **Manga** — Baca manga terbaru dari MangaDex dengan dukungan chapter berbahasa Indonesia & Inggris
- **Pencarian** — Cari anime dan manga berdasarkan judul
- **Genre** — Filter anime dan manga berdasarkan genre
- **Detail** — Lihat informasi lengkap termasuk skor, studio, jumlah episode/chapter, dan rekomendasi
- **Dark Mode** — Tampilan gelap bawaan
- **Responsif** — Optimal di desktop dan mobile

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui + Base UI
- **API Anime:** [Jikan API (MyAnimeList)](https://docs.api.jikan.moe/)
- **API Manga:** [MangaDex API](https://api.mangadex.org/)
- **Database:** Neon PostgreSQL (via Prisma)
- **Font:** Geist

## Struktur Proyek

```
src/
├── app/
│   ├── anime/[id]/     — Detail anime
│   ├── browse/          — Jelajahi anime (filter season, genre, dll)
│   ├── genres/          — Halaman genre
│   ├── manga/           — Katalog manga
│   │   ├── [id]/        — Detail manga (Jikan)
│   │   ├── mangadex/[id]/ — Detail manga (MangaDex)
│   │   └── read/[mangaId]/[chapterId]/ — Baca chapter
│   ├── layout.tsx
│   └── page.tsx         — Beranda
├── components/          — UI components
│   └── ui/              — shadcn/ui primitives
└── lib/
    ├── jikan.ts         — Jikan API client
    ├── mangadex.ts      — MangaDex API client
    └── utils.ts         — Utility functions
```

## Mulai

1. Install dependencies:

```bash
npm install
```

2. Jalankan development server:

```bash
npm run dev
```

3. Buka [http://localhost:3000](http://localhost:3000) di browser.

## Scripts

| Perintah       | Deskripsi                  |
| -------------- | -------------------------- |
| `npm run dev`  | Jalankan development server |
| `npm run build`| Build untuk produksi        |
| `npm run start`| Jalankan server produksi    |
| `npm run lint` | Jalankan ESLint             |

## API yang Digunakan

- **[Jikan API](https://docs.api.jikan.moe/)** — Data anime dan manga dari MyAnimeList (tidak perlu API key)
- **[MangaDex API](https://api.mangadex.org/)** — Data manga, chapter, dan halaman baca (tidak perlu API key)

## Deploy

Cara termudah untuk deploy adalah menggunakan [Vercel Platform](https://vercel.com/new).

Lihat [dokumentasi deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) untuk detail lebih lanjut.
