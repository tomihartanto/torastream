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
- **API Manga:** [MangaDex API](https://api.mangadex.org/) + [Comick](https://api.comick.fun) (fallback)
- **API Streaming:** [Consumet](https://github.com/consumet/consumet.ts) (lihat [Self-host Consumet](#self-host-consumet-api))
- **Cache & Rate Limit:** [Upstash Redis](https://upstash.com) (opsional, ada fallback in-memory)
- **Font:** Geist

## Konfigurasi (`.env`)

Salin `.env.example` ke `.env.local` lalu isi sesuai kebutuhan.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Tidak | URL REST Upstash Redis. Jika kosong, fallback ke in-memory cache & rate limit (cukup untuk dev). |
| `UPSTASH_REDIS_REST_TOKEN` | Tidak | Token REST Upstash Redis. |
| `AI_API_KEY` | Tidak | API key untuk translate sinopsis en→id. Tanpa ini, sinopsis Inggris ditampilkan apa adanya. |
| `AI_API_URL` | Tidak | Endpoint chat completions (default OpenAI-compatible). Contoh: `https://open.bigmodel.cn/api/paas/v4/chat/completions`. |
| `AI_MODEL` | Tidak | Model untuk translate. Default: `glm-4.6`. |
| `CONSUMET_API_URL` | Tidak | URL instance Consumet. Default `https://api.consumet.org` (sering down). Sangat disarankan untuk self-host. |
| `NEXT_PUBLIC_MANGADEX_BASE_URL` | Tidak | Bisa diarahkan ke Cloudflare Worker proxy. |
| `NEXT_PUBLIC_ADS_ENABLED` | Tidak | Set `true` untuk mengaktifkan Adsterra. |
| `NEXT_PUBLIC_ADSTERRA_*` | Tidak | URL script Adsterra (popunder, social bar, banner, rectangle). |

## Self-host Consumet API

Endpoint publik Consumet (`api.consumet.org`) sering mengalami downtime dan
rate-limit ketat. Untuk stabilitas watch page, deploy instance sendiri.

1. **Via Docker (paling mudah):**

   ```bash
   docker run -d \
     --name consumet \
     -p 3000:3000 \
     -e CORS_ALLOW_ORIGINS=* \
     ghcr.io/consumet/consumet.ts:latest
   ```

2. **Via Vercel/Render** (gratis untuk pemakaian kecil):
   - Fork https://github.com/consumet/consumet.ts
   - Deploy ke platform pilihan, ikuti panduan di repo upstream.

3. **Set env di ToraStream:**

   ```
   CONSUMET_API_URL=https://your-consumet.example.com
   ```

4. **Verifikasi:**

   ```bash
   curl https://your-consumet.example.com/meta/anilist/info/21
   ```

   Harus mengembalikan JSON info One Piece.

## Cloudflare Worker untuk Proxy MangaDex

Folder `workers/mangadex-proxy/` berisi Cloudflare Worker sederhana untuk
me-proxy request ke MangaDex (berguna jika MangaDex diblokir di region Anda
atau untuk konsolidasi IP rate-limit).

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/): `npm i -g wrangler`
2. Login: `wrangler login`
3. Deploy dari folder `workers/mangadex-proxy`:

   ```bash
   wrangler deploy
   ```

4. Set env di ToraStream:

   ```
   NEXT_PUBLIC_MANGADEX_BASE_URL=https://mangadex-proxy.your-subdomain.workers.dev
   ```

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
- **[Comick API](https://api.comick.fun)** — Sumber cadangan untuk chapter manga (otomatis dipakai saat MangaDex kosong/rate-limited)
- **[Consumet API](https://github.com/consumet/consumet.ts)** — Streaming source anime (sebaiknya self-host, lihat di atas)
- **[Upstash Redis](https://upstash.com)** — Cache distribusi + rate limiter (opsional)

## Deploy

Cara termudah untuk deploy adalah menggunakan [Vercel Platform](https://vercel.com/new).

Lihat [dokumentasi deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) untuk detail lebih lanjut.
