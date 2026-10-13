import { Breadcrumb } from "@/components/Breadcrumb";
import { LeadForm } from "@/components/site/LeadForm";
import { ORG, whatsappLink } from "@/content/site";
import { getPrograms } from "@/lib/content";
import { formIssuedAt } from "@/lib/form-time";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Konsultasi Persiapan OSN Gratis",
  description:
    "Ceritakan kebutuhan belajar OSN siswa SMP atau SMA. Tim AYS Science Academy menghubungi via WhatsApp dalam 1–2 hari kerja untuk konsultasi gratis.",
  path: "/konsultasi",
});

export default async function KonsultasiPage() {
  const programs = await getPrograms();
  return (
    <>
      <section className="subpage-hero editorial-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Konsultasi", path: "/konsultasi" }]} />
          <p className="eyebrow">Konsultasi gratis</p>
          <h1>
            Diskusikan persiapan OSN <em>bersama tim AYS.</em>
          </h1>
          <p>Untuk siswa, orang tua, maupun guru pembina. Isi data singkat dan kami akan menghubungi Anda.</p>
        </div>
      </section>
      <section className="lead-section">
        <div className="wrap lead-layout">
          <div className="section-heading">
            <h2>Apa yang dibahas saat konsultasi?</h2>
            <ul className="lead-points">
              <li>Bidang OSN yang paling sesuai dengan minat dan kemampuan siswa</li>
              <li>Tahapan program Fundamental, Intermediate, dan Advanced</li>
              <li>Jadwal kelas online dan pilihan pembayaran, termasuk cicilan</li>
              <li>Langkah persiapan menuju seleksi OSN-K berikutnya</li>
            </ul>
            <p style={{ marginTop: 24 }}>
              Lebih cepat lewat chat? Hubungi{" "}
              <a href={whatsappLink("Halo AYS, saya ingin konsultasi persiapan OSN.")} rel="noopener">
                WhatsApp {ORG.whatsappDisplay}
              </a>
              .
            </p>
          </div>
          <LeadForm
            programs={programs.map((p) => ({ slug: p.slug, code: p.code, name: p.name, level: p.level }))}
            sourcePath="/konsultasi"
            issuedAt={formIssuedAt()}
          />
        </div>
      </section>
    </>
  );
}
