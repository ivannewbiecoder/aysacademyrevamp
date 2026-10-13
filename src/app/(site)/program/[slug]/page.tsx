import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/site/cards";
import { LeadForm } from "@/components/site/LeadForm";
import { BANK_SUBJECTS, METHOD_STEPS, whatsappLink } from "@/content/site";
import { getProgram, getPrograms } from "@/lib/content";
import { formIssuedAt } from "@/lib/form-time";
import { redirectOrNotFound } from "@/lib/missing";
import { courseJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** Only look up slugs that exist, so random URLs never create cache entries. */
async function loadProgram(slug: string) {
  const programs = await getPrograms();
  if (!programs.some((p) => p.slug === slug)) return null;
  return getProgram(slug);
}

function description(p: { name: string; code: string; summary: string }) {
  return `Pelatihan OSN ${p.name} bersama mentor medalis. Kurikulum ${p.code}: ${p.summary.replace(/ · /g, ", ")}. Mulai dari tes diagnostik gratis.`.slice(
    0,
    158,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await loadProgram(slug);
  if (!program) return { title: "Program tidak ditemukan", robots: { index: false } };
  return pageMetadata({
    title: program.seoTitle || `Pelatihan OSN ${program.name} – ${program.code}`,
    exactTitle: !!program.seoTitle,
    description: program.seoDescription || description(program),
    path: `/program/${program.slug}`,
  });
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const [program, programs] = await Promise.all([loadProgram(slug), getPrograms()]);
  if (!program) {
    return redirectOrNotFound(`/program/${slug}`, {
      slug,
      candidates: programs.map((p) => p.slug),
      toPath: (s) => `/program/${s}`,
    });
  }

  const bank = BANK_SUBJECTS.find((b) => b.programSlug === program.slug);
  const faq = program.faq.length
    ? program.faq
    : [
        {
          q: `Siapa yang cocok mengikuti ${program.code}?`,
          a: `Siswa ${program.level} yang ingin menyiapkan OSN ${program.name}, baik yang baru mulai maupun yang sudah pernah mengikuti seleksi. Tes diagnostik gratis membantu menentukan titik awal belajar.`,
        },
        {
          q: `Bagaimana format kelas ${program.code}?`,
          a: "Training Camp berlangsung online dengan sesi langsung sekitar 2 jam per pekan, modul mingguan, pre-test, dan latihan soal per bab. Rekaman dan latihan tetap bisa diakses setelah kelas.",
        },
        {
          q: `Berapa biaya ${program.code}?`,
          a: "Biaya bergantung pada jenjang dan tahapan program. Tim AYS menyampaikan penawaran setelah konsultasi; tersedia pilihan cicilan dan beasiswa parsial.",
        },
        {
          q: "Apakah ikut program menjamin lolos OSN?",
          a: "Tidak. AYS menjanjikan proses belajar yang terarah sesuai silabus dan pendampingan mentor; hasil kompetisi dipengaruhi banyak faktor.",
        },
      ];
  const path = `/program/${program.slug}`;

  return (
    <>
      <JsonLd
        data={[
          courseJsonLd({
            name: program.name,
            code: program.code,
            description: program.seoDescription || description(program),
            path,
            level: program.level,
          }),
          faqJsonLd(faq),
        ]}
      />
      <section className="subpage-hero editorial-hero">
        <div className="wrap course-hero">
          <div>
            <Breadcrumb
              items={[
                { name: "Training Camp", path: "/program" },
                { name: program.code, path },
              ]}
            />
            <p className="eyebrow">Training Camp · {program.level}</p>
            <h1>Pelatihan OSN {program.name}.</h1>
            <p>
              {program.intro ||
                `Mempelajari materi sesuai silabus OSN ${program.name} antara lain: ${program.summary}. Lihat urutan kelas Fundamental di bawah.`}
            </p>
            <a
              className="button"
              href={whatsappLink(`Halo, saya ingin bertanya tentang program ${program.code}.`)}
              rel="noopener"
            >
              Tanyakan {program.code} <span className="arrow" aria-hidden="true">↗</span>
            </a>
          </div>
          <aside className="course-aside">
            <strong>Perlu bantuan memilih jalur?</strong>
            <p>Mulai dengan tes diagnostik gratis. Tim AYS akan membantu menentukan materi awal yang sesuai.</p>
            <Link href="/diagnostik">Lihat alur diagnostik ↗</Link>
          </aside>
        </div>
      </section>

      <section className="page-content">
        <div className="wrap">
          <div className="course-facts">
            <div className="course-fact">
              <strong>1</strong>
              <span>Pre Class</span>
            </div>
            <div className="course-fact">
              <strong>{program.topics.length}</strong>
              <span>Main Class Fundamental</span>
            </div>
            <div className="course-fact">
              <strong>2</strong>
              <span>evaluasi</span>
            </div>
          </div>

          <div className="split-content" style={{ marginTop: 56 }}>
            <div className="page-intro">
              <p className="eyebrow">Perjalanan Fundamental</p>
              <h2>Materi per kelas</h2>
              <p>
                Setiap minggu memadukan satu kelas langsung berdurasi sekitar 120 menit dengan enam hari belajar mandiri.
                Setelah Fundamental, siswa melanjutkan ke tahap Intermediate dan Advanced.
              </p>
            </div>
            <ol className="topic-list" role="list">
              {program.topics.map((topic, i) => (
                <li key={topic}>
                  <b>{String(i + 1).padStart(2, "0")}</b> {topic}
                </li>
              ))}
            </ol>
          </div>

          <div className="split-content" style={{ marginTop: 64 }}>
            <div className="page-intro">
              <p className="eyebrow">Metode 3 fase</p>
              <h2>Belajar tidak berhenti saat kelas selesai.</h2>
            </div>
            <div className="diagnostic-steps" style={{ marginTop: 0 }}>
              {METHOD_STEPS.map((step) => (
                <div className="diagnostic-step" key={step.no}>
                  <strong>{step.no}</strong>
                  <span>{step.title}</span>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {bank && (
            <p className="notice">
              Ingin mencoba soal dulu? Buka <Link href={`/soal-osn/${bank.slug}`}>Bank Soal {bank.name}</Link> untuk
              latihan dengan pembahasan.
            </p>
          )}
          <p className="notice">Jadwal batch, format sesi, dan biaya dapat ditanyakan kepada tim AYS sebelum mendaftar.</p>
        </div>
      </section>

      <section className="faq">
        <div className="wrap faq-layout">
          <div className="section-heading">
            <p className="eyebrow">Tanya jawab</p>
            <h2>Pertanyaan seputar {program.code}.</h2>
          </div>
          <FaqList items={faq} />
        </div>
      </section>

      <section className="lead-section" id="konsultasi">
        <div className="wrap lead-layout">
          <div className="section-heading">
            <p className="eyebrow">Konsultasi gratis</p>
            <h2>Diskusikan kebutuhan belajar {program.name}.</h2>
            <p>Isi data singkat, tim AYS akan menghubungi melalui WhatsApp dalam 1–2 hari kerja.</p>
          </div>
          <LeadForm
            programs={programs.map((p) => ({ slug: p.slug, code: p.code, name: p.name, level: p.level }))}
            defaultProgram={program.slug}
            sourcePath={path}
            issuedAt={formIssuedAt()}
          />
        </div>
      </section>
    </>
  );
}
