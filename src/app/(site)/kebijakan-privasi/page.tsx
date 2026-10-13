import { Breadcrumb } from "@/components/Breadcrumb";
import { ORG } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Kebijakan Privasi",
  description: "Cara AYS Science Academy mengumpulkan, menggunakan, dan melindungi data yang Anda kirim melalui situs ini.",
  path: "/kebijakan-privasi",
});

/**
 * Factual description of what this website does with data. Must be reviewed by
 * AYS / legal counsel against UU No. 27/2022 (PDP) before launch.
 */
export default function PrivacyPage() {
  return (
    <>
      <section className="subpage-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Kebijakan privasi", path: "/kebijakan-privasi" }]} />
          <h1>Kebijakan privasi</h1>
          <p>Ringkasan tentang data yang kami kumpulkan melalui situs aysacademy.id dan cara kami menggunakannya.</p>
        </div>
      </section>
      <article className="page-content">
        <div className="wrap article-body prose">
          <h2>Data yang kami kumpulkan</h2>
          <p>
            Saat Anda mengisi formulir konsultasi, kami menyimpan nama, peran (siswa, orang tua, atau guru), jenjang,
            bidang yang diminati, nomor WhatsApp, serta email, asal sekolah, dan pesan bila Anda mengisinya. Kami juga
            mencatat halaman asal formulir dan parameter kampanye (UTM) bila ada.
          </p>
          <p>
            Untuk mencegah penyalahgunaan, kami menyimpan alamat IP dalam bentuk hash satu arah, sehingga alamat IP asli
            tidak tersimpan.
          </p>
          <h2>Tujuan penggunaan</h2>
          <p>
            Data formulir hanya digunakan oleh tim {ORG.name} untuk menghubungi Anda terkait konsultasi dan informasi
            program. Kami tidak menjual atau membagikan data Anda kepada pihak lain untuk kepentingan pemasaran.
          </p>
          <h2>Data siswa di bawah umur</h2>
          <p>
            Sebagian besar siswa kami berusia di bawah 18 tahun. Jika Anda siswa, sebaiknya isi formulir bersama orang tua
            atau wali. Kami hanya meminta data yang diperlukan untuk menghubungi Anda.
          </p>
          <h2>Analitik</h2>
          <p>
            Situs ini dapat menggunakan Google Analytics untuk memahami cara pengunjung menggunakan situs, misalnya halaman
            yang paling sering dibaca. Data ini bersifat agregat dan alamat IP dianonimkan.
          </p>
          <h2>Hak Anda</h2>
          <p>
            Anda dapat meminta salinan, perbaikan, atau penghapusan data Anda dengan menghubungi{" "}
            <a href={`mailto:${ORG.email}`}>{ORG.email}</a>.
          </p>
          <h2>Layanan lain</h2>
          <p>
            Tes Diagnostik (diagnostik.aysacademy.id) dan Tryout (tryout.aysacademy.id) adalah aplikasi terpisah dengan
            pengelolaan data masing-masing.
          </p>
        </div>
      </article>
    </>
  );
}
