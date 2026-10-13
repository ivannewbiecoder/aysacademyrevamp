import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ORG } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tes Diagnostik OSN Gratis",
  description:
    "Kenali kesiapan awal untuk olimpiade sains lewat tes diagnostik gratis 5–10 menit. Tim AYS menghubungi dalam 1–2 hari kerja untuk membahas jalur belajar.",
  path: "/diagnostik",
});

export default function DiagnostikPage() {
  return (
    <>
      <section className="subpage-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Tes Diagnostik", path: "/diagnostik" }]} />
          <p className="eyebrow">Langkah pertama belajar OSN</p>
          <h1>
            Seberapa siap kamu untuk <em>olimpiade sains?</em>
          </h1>
          <p>
            Jawab tes singkat untuk membantu mengenali kesiapan awalmu. Tim mentor AYS akan membantu memilih program sesuai
            level siswa.
          </p>
          <a className="button" href={ORG.diagnostikUrl} rel="noopener">
            Mulai tes gratis <span className="arrow" aria-hidden="true">↗</span>
          </a>
          <p className="reassurance">
            Tes memerlukan sekitar 5–10 menit. Setelah selesai, tim AYS menghubungi dalam 1–2 hari kerja untuk konsultasi.
          </p>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          <div className="page-intro">
            <p className="eyebrow">Apa yang terjadi setelah tes?</p>
            <h2>Hasil diagnostik menjadi awal percakapan.</h2>
            <p>Tes membantu tim AYS memahami kebutuhan siswa sebelum membahas bidang dan jalur belajar.</p>
          </div>
          <ol className="diagnostic-steps" role="list">
            <li className="diagnostic-step">
              <strong>01</strong>
              <span>Kerjakan tes</span>
              <p>Ikuti diagnostik gratis sekitar 5–10 menit di halaman resmi AYS.</p>
            </li>
            <li className="diagnostic-step">
              <strong>02</strong>
              <span>Tim AYS meninjau kesiapan</span>
              <p>Tim menghubungi dalam 1–2 hari kerja untuk membahas hasil dan kebutuhan siswa.</p>
            </li>
            <li className="diagnostic-step">
              <strong>03</strong>
              <span>Diskusikan pilihan program</span>
              <p>Bandingkan bidang, durasi, format, dan biaya sebelum menentukan langkah berikutnya.</p>
            </li>
          </ol>
          <div className="split-content" style={{ marginTop: 54 }}>
            <div className="page-intro">
              <h2>Belum tahu bidang yang cocok?</h2>
              <p>Lihat pilihan Training Camp, lalu tanyakan apa yang paling sesuai untuk jenjang dan minat siswa.</p>
            </div>
            <div className="info-panel">
              <h2>Jelajahi bidang belajar</h2>
              <p>Biologi, Fisika, Kimia, Matematika, Informatika, IPA SMP, dan bidang lain untuk SMP dan SMA.</p>
              <Link className="button" href="/program">
                Bandingkan program <span className="arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <p className="notice">
            Tes resmi terbuka di aplikasi Diagnostik AYS (diagnostik.aysacademy.id). Lebih suka ngobrol dulu?{" "}
            <Link href="/konsultasi">Minta dihubungi tim AYS</Link>.
          </p>
        </div>
      </section>
      <section className="final-cta">
        <div className="wrap final-inner">
          <div>
            <p className="eyebrow">Tes gratis · 5–10 menit</p>
            <h2>Mulai dengan memahami kesiapanmu.</h2>
            <p>Kerjakan tes diagnostik, lalu bicarakan pilihan program dengan tim AYS.</p>
          </div>
          <a className="button" href={ORG.diagnostikUrl} rel="noopener">
            Mulai tes gratis <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </>
  );
}
