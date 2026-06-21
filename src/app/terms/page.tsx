import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan",
  description: "Syarat dan ketentuan penggunaan layanan ToraStream.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat dan Ketentuan Penggunaan"
      lastUpdated="22 Juni 2026"
      intro="Dengan mengakses ToraStream, Anda menyetujui syarat dan ketentuan berikut. Mohon dibaca dengan saksama."
      sections={[
        {
          heading: "1. Definisi Layanan",
          body: (
            <p>ToraStream adalah platform agregator yang menampilkan metadata anime dan manga dari sumber publik (MyAnimeList, MangaDex, dan lainnya). Kami tidak menyimpan, menghosting, atau mendistribusikan file video atau gambar di server kami.</p>
          ),
        },
        {
          heading: "2. Penerimaan Ketentuan",
          body: (
            <p>Dengan menggunakan layanan ini, Anda menyatakan bahwa Anda berusia minimal 13 tahun (atau lebih sesuai hukum yang berlaku di wilayah Anda) dan menyetujui untuk terikat oleh ketentuan ini.</p>
          ),
        },
        {
          heading: "3. Sifat Layanan",
          body: (
            <>
              <p>Layanan disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apa pun. Kami tidak menjamin bahwa:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Layanan akan tersedia tanpa gangguan atau error</li>
                <li>Data yang ditampilkan selalu akurat, lengkap, atau terbaru</li>
                <li>Link ke sumber pihak ketiga akan selalu berfungsi</li>
              </ul>
            </>
          ),
        },
        {
          heading: "4. Hak Kekayaan Intelektual",
          body: (
            <>
              <p>Semua konten anime, manga, gambar, video, dan merek dagang yang ditampilkan adalah milik pemilik hak cipta masing-masing. ToraStream hanya bertindak sebagai agregator metadata dan tidak mengklaim kepemilikan atas konten tersebut.</p>
              <p>Logo, nama &quot;ToraStream&quot;, dan desain antarmuka adalah milik kami dan dilindungi hukum.</p>
            </>
          ),
        },
        {
          heading: "5. Penggunaan yang Dilarang",
          body: (
            <>
              <p>Anda setuju untuk tidak:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Menggunakan layanan untuk tujuan ilegal</li>
                <li>Melakukan upaya reverse engineering, scraping, atau automated access berlebihan</li>
                <li>Mencoba mengganggu keamanan atau integritas server</li>
                <li>Menyalahgunakan API publik dengan melewati rate limit</li>
                <li>Mendistribusikan ulang konten dengan cara yang melanggar hak cipta</li>
              </ul>
            </>
          ),
        },
        {
          heading: "6. Batasan Tanggung Jawab",
          body: (
            <p>ToraStream tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan layanan, termasuk namun tidak terbatas pada kehilangan data, kerugian finansial, atau pelanggaran hak cipta yang terjadi karena tindakan pengguna.</p>
          ),
        },
        {
          heading: "7. Tautan ke Pihak Ketiga",
          body: (
            <p>Layanan ini mungkin menampilkan atau mengarahkan ke situs pihak ketiga. Kami tidak bertanggung jawab atas konten, kebijakan privasi, atau praktik situs tersebut. Penggunaan tautan pihak ketiga adalah risiko Anda sendiri.</p>
          ),
        },
        {
          heading: "8. Perubahan Layanan dan Ketentuan",
          body: (
            <p>Kami berhak mengubah atau menghentikan layanan kapan saja. Ketentuan ini juga dapat diperbarui; penggunaan berlanjut setelah perubahan menandakan persetujuan.</p>
          ),
        },
      ]}
    />
  );
}
