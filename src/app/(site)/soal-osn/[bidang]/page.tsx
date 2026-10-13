import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FinalCta } from "@/components/site/cards";
import { BANK_SUBJECTS, findBankSubject, STAGE_LABEL } from "@/content/site";
import { getProgram, getQuestionSets } from "@/lib/content";
import { redirectOrNotFound } from "@/lib/missing";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bidang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bidang } = await params;
  const subject = findBankSubject(bidang);
  if (!subject) return { title: "Halaman tidak ditemukan", robots: { index: false } };
  return pageMetadata({
    title: `Soal OSN ${subject.name} dan Pembahasan`,
    description: `Kumpulan soal OSN ${subject.name} ${subject.level} dari OSN-K, OSN-P, hingga OSN nasional, lengkap dengan kunci jawaban dan pembahasan yang ditinjau mentor AYS.`,
    path: `/soal-osn/${subject.slug}`,
  });
}

export default async function BankSubjectPage({ params }: Props) {
  const { bidang } = await params;
  const subject = findBankSubject(bidang);
  if (!subject) {
    return redirectOrNotFound(`/soal-osn/${bidang}`, {
      slug: bidang,
      candidates: BANK_SUBJECTS.map((s) => s.slug),
      toPath: (s) => `/soal-osn/${s}`,
    });
  }
  const [sets, program] = await Promise.all([getQuestionSets(subject.slug), getProgram(subject.programSlug)]);

  return (
    <>
      <section className="subpage-hero editorial-hero">
        <div className="wrap">
          <Breadcrumb
            items={[
              { name: "Bank Soal", path: "/soal-osn" },
              { name: subject.name, path: `/soal-osn/${subject.slug}` },
            ]}
          />
          <p className="eyebrow">Bank Soal · {subject.level}</p>
          <h1>
            Soal OSN {subject.name} <em>dan pembahasan.</em>
          </h1>
          <p>
            Latihan soal {subject.name} per tahun dan tahap seleksi. Kerjakan dulu, lalu buka pembahasan untuk melihat
            cara berpikirnya.
          </p>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          <div className="page-intro">
            <h2>Arsip soal</h2>
          </div>
          {sets.length ? (
            <div className="set-list">
              {sets.map((set) => (
                <Link className="set-row" key={set.slug} href={`/soal-osn/${subject.slug}/${set.slug}`}>
                  <div>
                    <strong>{set.title}</strong>
                    <span>
                      {STAGE_LABEL[set.stage]}
                      {set.year ? ` · ${set.year}` : ""} · {set.questionCount} soal
                    </span>
                  </div>
                  <span className="arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              Set soal {subject.name} sedang disiapkan dan ditinjau mentor. Sementara itu, ikuti tes diagnostik untuk
              mengetahui titik awal belajarmu.
            </p>
          )}
          {program && (
            <p className="notice">
              Ingin belajar {subject.name} lebih terarah? Lihat program{" "}
              <Link href={`/program/${program.slug}`}>
                {program.code} – Pelatihan OSN {program.name}
              </Link>
              .
            </p>
          )}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
