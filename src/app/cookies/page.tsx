import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Cookie",
  description: "Informasi mengenai penggunaan cookie di ToraStream.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Kebijakan Cookie"
      lastUpdated="22 Juni 2026"
      intro="Kebijakan ini menjelaskan bagaimana ToraStream menggunakan cookie dan teknologi pelacakan serupa."
      sections={[
        {
          heading: "1. Apa Itu Cookie",
          body: (
            <p>Cookie adalah file teks kecil yang disimpan di perangkat Anda saat mengunjungi sebuah situs web. Cookie memungkinkan situs mengingat preferensi dan tindakan Anda selama dan setelah kunjungan.</p>
          ),
        },
        {
          heading: "2. Jenis Cookie yang Kami Gunakan",
          body: (
            <>
              <p><strong>Cookie Esensial</strong> — diperlukan untuk fungsi dasar situs. Tidak dapat dimatikan.</p>
              <p><strong>Cookie Preferensi</strong> — menyimpan pilihan Anda seperti tema gelap/terang dan persetujuan cookie.</p>
              <p><strong>Cookie Analitik</strong> — membantu kami memahami bagaimana pengunjung menggunakan situs (agregat, anonim).</p>
              <p><strong>Cookie Iklan</strong> — jika iklan diaktifkan, mitra iklan (Adsterra) mungkin menggunakan cookie untuk menayangkan iklan yang relevan.</p>
            </>
          ),
        },
        {
          heading: "3. Cookie Pihak Ketiga",
          body: (
            <>
              <p>Layanan berikut mungkin menetapkan cookie saat Anda menggunakan ToraStream:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>Adsterra</strong> — jaringan iklan (jika diaktifkan)</li>
                <li><strong>Vercel Analytics</strong> — analitik agregat</li>
                <li><strong>Cloudflare</strong> — keamanan dan caching</li>
              </ul>
            </>
          ),
        },
        {
          heading: "4. Mengelola Cookie",
          body: (
            <>
              <p>Anda dapat mengelola atau menghapus cookie kapan saja melalui pengaturan browser:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pengaturan cookie Chrome</a></li>
                <li><a href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pengaturan cookie Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pengaturan cookie Safari</a></li>
              </ul>
              <p>Catatan: memblokir cookie esensial dapat memengaruhi fungsi situs.</p>
            </>
          ),
        },
        {
          heading: "5. Penyimpanan Lokal",
          body: (
            <p>Selain cookie, kami menggunakan localStorage untuk menyimpan preferensi UI (seperti tema dan status persetujuan cookie). Data ini tersimpan di perangkat Anda dan tidak dikirim ke server.</p>
          ),
        },
      ]}
    />
  );
}
