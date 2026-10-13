import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { FinalCta } from "@/components/site/cards";
import { findBankSubject, STAGE_LABEL } from "@/content/site";
import { getProgram, getQuestionSet, getQuestionSets } from "@/lib/content";
import { markdownToPlainText } from "@/lib/markdown";
import { redirectOrNotFound } from "@/lib/missing";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bidang: string; set: string }> };

async function load(bidang: string, setSlug: string) {
  const subject = findBankSubject(bidang);
  if (!subject) return null;
  const sets = await getQuestionSets(subject.slug);
  if (!sets.some((s) => s.slug === setSlug)) return { subject, set: null, sets };
  return { subject, set: await getQuestionSet(subject.slug, setSlug), sets };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bidang, set: setSlug } = await params;
  const data = await load(bidang, setSlug);
  if (!data?.set) return { title: "Halaman tidak ditemukan", robots: { index: false } };
  const { subject, set } = data;
  const fallbackTitle = `Soal ${set.title} + Pembahasan`;
  return pageMetadata({
    title: set.seoTitle || fallbackTitle,
    exactTitle: !!set.seoTitle,
    description:
      set.seoDescription ||
      markdownToPlainText(set.description, 155) ||
      `${set.questionCount} soal ${set.title} lengkap dengan kunci jawaban dan pembahasan dari mentor AYS. Latihan OSN ${subject.name} ${subject.level}.`,
    path: `/soal-osn/${subject.slug}/${set.slug}`,
    // A set without reviewed problems is thin content; keep it out of the index.
    noindex: set.questionCount === 0,
  });
}

export default async function QuestionSetPage({ params }: Props) {
  const { bidang, set: setSlug } = await params;
  const data = await load(bidang, setSlug);
  if (!data?.set) {
    return redirectOrNotFound(
      `/soal-osn/${bidang}/${setSlug}`,
      data ? { slug: setSlug, candidates: data.sets.map((s) => s.slug), toPath: (s) => `/soal-osn/${data.subject.slug}/${s}` } : undefined,
    );
  }
  const { subject, set } = data;
  const program = await getProgram(subject.programSlug);
  const path = `/soal-osn/${subject.slug}/${set.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: set.title,
          learningResourceType: "Practice problems",
          educationalLevel: subject.level,
          inLanguage: "id-ID",
          isAccessibleForFree: true,
          about: `Olimpiade Sains Nasional ${subject.name}`,
          dateModified: set.updatedAt,
        }}
      />
      <section className="subpage-hero editorial-hero article-hero">
        <div className="wrap">
          <Breadcrumb
            items={[
              { name: "Bank Soal", path: "/soal-osn" },
              { name: subject.name, path: `/soal-osn/${subject.slug}` },
              { name: set.title, path },
            ]}
          />
          <p className="eyebrow">
            {STAGE_LABEL[set.stage]}
            {set.year ? ` · ${set.year}` : ""}
          </p>
          <h1>Soal {set.title} dan pembahasan</h1>
          <p>
            {set.questionCount} soal dengan kunci jawaban dan pembahasan yang ditinjau mentor AYS. Coba kerjakan sendiri
            dulu sebelum membuka pembahasan.
          </p>
        </div>
      </section>

      <section className="page-content">
        <div className="wrap article-layout">
          <div>
            <Markdown source={set.description} />
            {set.questions.length ? (
              <ol className="question-list">
                {set.questions.map((q) => (
                  <li className="question" id={`soal-${q.number}`} key={q.number}>
                    <div className="question-head">
                      <span>Soal {q.number}</span>
                      <a href={`#soal-${q.number}`} aria-label={`Tautan ke soal ${q.number}`}>
                        #
                      </a>
                    </div>
                    <Markdown source={q.body} />
                    {q.choices.length > 0 && (
                      <ul className="choices">
                        {q.choices.map((c) => (
                          <li key={c.label}>
                            <b>{c.label}.</b>
                            <Markdown source={c.text} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {(q.answer || q.explanation) && (
                      <details className="solution">
                        <summary>Lihat jawaban &amp; pembahasan</summary>
                        {q.answer && <p className="answer">Jawaban: {q.answer}</p>}
                        <Markdown source={q.explanation} />
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-note">Soal pada set ini sedang ditinjau mentor dan akan segera tampil.</p>
            )}
            {set.sourceNote && <p className="notice source-note">Sumber: {set.sourceNote}</p>}
          </div>
          <aside>
            <div className="aside-cta">
              {program ? (
                <>
                  <strong>Ingin dibimbing mentor {subject.name}?</strong>
                  <p>Bedah soal seperti ini menjadi bagian fase After Class di {program.code}.</p>
                  <Link className="button" href={`/program/${program.slug}`}>
                    Lihat {program.code} <span aria-hidden="true">↗</span>
                  </Link>
                </>
              ) : (
                <>
                  <strong>Ukur kesiapanmu</strong>
                  <p>Tes diagnostik gratis memetakan topik yang perlu diperkuat.</p>
                  <Link className="button" href="/diagnostik">
                    Tes diagnostik <span aria-hidden="true">↗</span>
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
