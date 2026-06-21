import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi ToraStream mengenai pengumpulan dan penggunaan data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      lastUpdated="22 Juni 2026"
      intro={`ToraStream ("Kami") menghormati privasi pengunjung. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda atas data tersebut.`}
      sections={[
        {
          heading: "1. Data yang Kami Kumpulkan",
          body: (
            <>
              <p>ToraStream adalah platform read-only yang tidak memerlukan pendaftaran akun. Kami tidak meminta nama, email, atau informasi pribadi Anda.</p>
              <p>Data yang dikumpulkan secara otomatis meliputi:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Alamat IP (untuk keamanan, rate limiting, dan analitik agregat)</li>
                <li>User-Agent dan jenis browser (untuk kompatibilitas)</li>
                <li>Halaman yang dikunjungi dan waktu kunjungan (log server)</li>
                <li>Data cookie dan local storage (lihat Kebijakan Cookie)</li>
              </ul>
            </>
          ),
        },
        {
          heading: "2. Bagaimana Kami Menggunakan Data",
          body: (
            <>
              <p>Data tersebut digunakan untuk:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Mengoperasikan dan memelihara layanan</li>
                <li>Mencegah penyalahgunaan, spam, dan serangan (rate limiting)</li>
                <li>Menganalisis trafik secara agregat untuk meningkatkan pengalaman</li>
                <li>Menayangkan iklan dari pihak ketiga (jika diaktifkan)</li>
              </ul>
            </>
          ),
        },
        {
          heading: "3. Layanan Pihak Ketiga",
          body: (
            <>
              <p>Kami menggunakan layanan pihak ketiga yang mungkin mengumpulkan data:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>Vercel</strong> — hosting dan analytics agregat</li>
                <li><strong>Adsterra</strong> — jaringan iklan (jika diaktifkan)</li>
                <li><strong>Cloudflare / Upstash</strong> — caching dan rate limiting</li>
                <li><strong>MyAnimeList, MangaDex</strong> — sumber data katalog</li>
              </ul>
              <p>Masing-masing pihak ketiga memiliki kebijakan privasi sendiri yang kami sarankan untuk dibaca.</p>
            </>
          ),
        },
        {
          heading: "4. Penyimpanan dan Keamanan Data",
          body: (
            <>
              <p>Log server disimpan sementara (maksimal 30 hari) untuk tujuan keamanan. Data tidak ditransfer atau dijual ke pihak ketiga mana pun.</p>
              <p>Kami menerapkan praktik keamanan standar industri: koneksi HTTPS wajib, Content-Security-Policy, dan rate limiting untuk mencegah penyalahgunaan.</p>
            </>
          ),
        },
        {
          heading: "5. Hak Anda",
          body: (
            <>
              <p>Sesuai peraturan perlindungan data yang berlaku (termasuk UU PDP No. 27/2022 Indonesia), Anda berhak untuk:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Mengetahui data apa yang kami kumpulkan</li>
                <li>Meminta penghapusan data pribadi Anda</li>
                <li>Menolak pemrosesan data tertentu</li>
              </ul>
              <p>Karena kami tidak menyimpan akun pengguna, sebagian besar data bersifat anonim dan agregat. Untuk permintaan terkait data, hubungi kami melalui halaman DMCA.</p>
            </>
          ),
        },
        {
          heading: "6. Perubahan Kebijakan",
          body: (
            <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal di atas menunjukkan revisi terakhir. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan terhadap kebijakan baru.</p>
          ),
        },
      ]}
    />
  );
}
