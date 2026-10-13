import { Breadcrumb } from "@/components/Breadcrumb";
import { ORG } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tryout OSN Online dengan Analisis per Topik",
  description:
    "Simulasi soal setara OSN-K, OSN-P, dan OSN dengan timer, simpan otomatis, dan analisis hasil per topik. Paket tryout diarahkan oleh mentor AYS.",
  path: "/tryout",
});

const SAMPLE = [
  { topic: "Genetika", score: 92 },
  { topic: "Ekologi", score: 78 },
  { topic: "Sel & molekuler", score: 64 },
];

export default function TryoutPage() {
  return (
    <>
      <section className="subpage-hero">
        <div className="wrap tryout-layout">
          <div>
            <Breadcrumb items={[{ name: "Tryout", path: "/tryout" }]} />
            <p className="eyebrow">Simulasi Olimpiade Sains</p>
            <h1>
              Latihan, lalu pahami <em>hasilnya.</em>
            </h1>
            <p>
              Tryout AYS menghadirkan simulasi soal setara OSN-K, OSN-P, dan OSN. Setelah mengerjakan, siswa dapat melihat
              skor, analisis per topik, dan saran belajar.
            </p>
            <a className="button" href={ORG.tryoutUrl} rel="noopener">
              Masuk ke Tryout AYS <span className="arrow" aria-hidden="true">↗</span>
            </a>
            <p className="reassurance">Paket tryout yang tersedia ditentukan melalui arahan mentor AYS.</p>
          </div>
          <aside className="sample-result" aria-label="Contoh tampilan analisis tryout">
            <p className="eyebrow">Contoh tampilan hasil</p>
            <h2>Biologi · OSN-K</h2>
            <p>Contoh analisis yang ditampilkan aplikasi Tryout AYS.</p>
            <div className="sample-score">
              <strong>82</strong>
              <span>skor · 12 jawaban benar · P85</span>
            </div>
            <div className="topic-score">
              {SAMPLE.map((s) => (
                <div key={s.topic}>
                  <span>{s.topic}</span>
                  <b>{s.score}%</b>
                  <span className="score-track">
                    <i style={{ width: `${s.score}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          <div className="page-intro">
            <p className="eyebrow">Selama dan setelah latihan</p>
            <h2>Tryout membantu siswa melihat bagian yang perlu dilatih.</h2>
          </div>
          <div className="resource-grid">
            <article className="resource-card">
              <span className="card-type">Akses paket</span>
              <div>
                <h3>Token sekali pakai</h3>
                <p>Paket latihan menggunakan token dan pemantauan anti-curang otomatis.</p>
              </div>
              <span className="card-meta">
                <span>Masuk dengan akun AYS</span>
                <span>01</span>
              </span>
            </article>
            <article className="resource-card">
              <span className="card-type">Pengerjaan</span>
              <div>
                <h3>Timer dan simpan otomatis</h3>
                <p>Waktu pengerjaan tercatat. Jawaban tersimpan otomatis dan sistem mengirim jawaban saat waktu habis.</p>
              </div>
              <span className="card-meta">
                <span>Siapkan waktu fokus</span>
                <span>02</span>
              </span>
            </article>
            <article className="resource-card">
              <span className="card-type">Tinjau hasil</span>
              <div>
                <h3>Analisis per topik</h3>
                <p>Lihat topik yang sudah kuat, bagian yang masih perlu latihan, dan rekomendasi belajar.</p>
              </div>
              <span className="card-meta">
                <span>Diskusikan dengan mentor</span>
                <span>03</span>
              </span>
            </article>
          </div>
          <p className="notice">
            Angka pada panel hasil adalah contoh tampilan aplikasi AYS, bukan hasil milik pengunjung halaman ini.
          </p>
        </div>
      </section>
      <section className="final-cta">
        <div className="wrap final-inner">
          <div>
            <p className="eyebrow">Siap berlatih?</p>
            <h2>Lanjutkan ke ruang Tryout AYS.</h2>
            <p>Masuk untuk melihat paket yang telah diarahkan mentor.</p>
          </div>
          <a className="button" href={ORG.tryoutUrl} rel="noopener">
            Masuk ke Tryout <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </>
  );
}
