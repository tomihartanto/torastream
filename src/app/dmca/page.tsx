import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "DMCA & Penghapusan Konten",
  description: "Prosedur pengajuan permintaan penghapusan konten yang melanggar hak cipta.",
};

export default function DmcaPage() {
  return (
    <LegalPage
      title="DMCA & Penghapusan Konten"
      lastUpdated="22 Juni 2026"
      intro="ToraStream menghormati hak kekayaan intelektual orang lain dan berkomitmen untuk menanggapi laporan pelanggaran hak cipta dengan cepat."
      sections={[
        {
          heading: "1. Posisi Kami Terkait Hak Cipta",
          body: (
            <>
              <p>ToraStream adalah agregator metadata. Kami:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Tidak menyimpan, menghosting, atau mengunggah file video/audio/gambar apa pun di server kami</li>
                <li>Tidak bertanggung jawab atas keaslian atau legalitas konten di situs pihak ketiga</li>
                <li>Hanya menampilkan tautan dan metadata dari sumber publik</li>
                <li>Menghormati hak cipta pemilik karya yang sah</li>
              </ul>
              <p>Jika Anda merasa konten tertentu melanggar hak cipta Anda, permintaan harus ditujukan ke sumber aslinya, namun kami juga akan menghapus tautan dari indeks kami.</p>
            </>
          ),
        },
        {
          heading: "2. Cara Mengajukan Permintaan Takedown",
          body: (
            <>
              <p>Kirim pemberitahuan DMCA dalam format tertulis yang mencakup:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Identifikasi karya berhak cipta yang diklaim dilanggar</li>
                <li>URL spesifik di ToraStream yang menampilkan tautan bermasalah</li>
                <li>Identitas dan kontak Anda (nama, email, alamat)</li>
                <li>Pernyataan bahwa Anda pemilik hak atau diotorisasi untuk bertindak atas nama pemilik</li>
                <li>Pernyataan dengan itikad baik bahwa penggunaan tersebut tidak diizinkan</li>
                <li>Tanda tangan (fisik atau elektronik) dari pemohon</li>
              </ul>
              <p>Kirim permintaan ke: <strong>dmca@torastream.example</strong> (ganti dengan email resmi Anda setelah deployment).</p>
            </>
          ),
        },
        {
          heading: "3. Proses Penanganan",
          body: (
            <>
              <p>Setelah permintaan sah kami terima, kami akan:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Mengkonfirmasi penerimaan dalam waktu 1–3 hari kerja</li>
                <li>Menghapus tautan bermasalah dari indeks dalam waktu 7 hari kerja</li>
                <li>Mengirimkan konfirmasi setelah penghapusan</li>
              </ul>
            </>
          ),
        },
        {
          heading: "4. Pencegahan Abuse",
          body: (
            <p>Permintaan takedown yang tidak lengkap, tidak jelas, atau terindikasi spam/abuse tidak akan ditindaklanjuti. Klaim palsu dapat berakibat sengketa hukum terhadap pengaju.</p>
          ),
        },
        {
          heading: "5. Repeat Infringer Policy",
          body: (
            <p>Sesuai Digital Millennium Copyright Act (DMCA) Section 512, kami berkomitmen untuk menghentikan akun pengguna yang terbukti berulang kali melanggar hak cipta (jika fitur akun tersedia di masa depan).</p>
          ),
        },
        {
          heading: "6. Kontak Lain",
          body: (
            <p>Untuk pertanyaan umum, kemitraan, atau hal lain, hubungi: <strong>contact@torastream.example</strong> (ganti dengan email resmi Anda).</p>
          ),
        },
      ]}
    />
  );
}
