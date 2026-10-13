import Link from "next/link";
import type { ArticleCardDTO, ProgramDTO } from "@/lib/content";
import { ProgramIcon } from "../ProgramIcon";

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

export function formatDate(iso: string | null): string | null {
  return iso ? dateFormat.format(new Date(iso)) : null;
}

/** Program card used on the home page list. */
export function ProgramListItem({ program, index }: { program: ProgramDTO; index: number }) {
  return (
    <Link className={`program-item program-item--${program.accent}`} href={`/program/${program.slug}`}>
      <span className="program-code">
        {String(index + 1).padStart(2, "0")} / {program.code}
      </span>
      <span className="program-copy">
        <span className="program-title">{program.name}</span>
        <span className="program-icon" aria-hidden="true">
          <ProgramIcon accent={program.accent} />
        </span>
        <span className="program-topics">{program.summary}</span>
      </span>
      <span className="program-meta">
        <span>{program.level} · Fundamental</span>
        <span>Lihat detail ↗</span>
      </span>
    </Link>
  );
}

/** Program card used on the catalogue page. */
export function ProgramCard({ program, index }: { program: ProgramDTO; index: number }) {
  return (
    <Link className={`subject-card subject-card--${program.accent}`} href={`/program/${program.slug}`}>
      <span className="subject-card__top">
        <span>
          {String(index + 1).padStart(2, "0")} / {program.code}
        </span>
        <span>{program.level}</span>
      </span>
      <span className="subject-card__icon" aria-hidden="true">
        <ProgramIcon accent={program.accent} />
      </span>
      <h3>{program.name}</h3>
      <p className="subject-card__topics">{program.summary}</p>
      <span className="subject-card__bottom">
        <span>{program.level} · Fundamental</span>
        <span>Lihat materi ↗</span>
      </span>
    </Link>
  );
}

const SUBJECT_LABEL: Record<string, string> = {
  strategi: "Strategi",
  matematika: "Matematika",
  biologi: "Biologi",
  fisika: "Fisika",
  kimia: "Kimia",
  ipa: "IPA",
  informatika: "Informatika",
};

export function ArticleCard({ article, headingLevel = "h2" }: { article: ArticleCardDTO; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const label = article.type === "berita" ? "Berita" : (article.subject && SUBJECT_LABEL[article.subject]) || "Artikel";
  const date = formatDate(article.publishedAt);
  return (
    <Link className="resource-card" href={`/artikel/${article.slug}`}>
      <span className="card-type">{label}</span>
      <div>
        <Heading>{article.title}</Heading>
        {article.excerpt && <p>{article.excerpt}</p>}
      </div>
      <span className="card-meta">
        <span>{date && <time dateTime={article.publishedAt ?? undefined}>{date}</time>}</span>
        <span>{article.type === "berita" ? "Buka berita ↗" : "Baca artikel ↗"}</span>
      </span>
    </Link>
  );
}

export function Pagination({ page, total, pageSize, hrefFor }: { page: number; total: number; pageSize: number; hrefFor: (page: number) => string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Halaman">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev">
          ← Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <span>
        Halaman {page} dari {pages}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} rel="next">
          Berikutnya →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details className="faq-item" key={item.q}>
          <summary>{item.q}</summary>
          <div className="faq-answer">
            <p>{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function FinalCta({
  eyebrow = "Mulai dari kesiapanmu",
  title = "Kenali levelmu sebelum memilih program.",
  text = "Ikuti tes diagnostik gratis. Tim AYS akan membahas hasilnya dan membantu menentukan langkah belajar berikutnya.",
}: {
  eyebrow?: string;
  title?: string;
  text?: string;
}) {
  return (
    <section className="final-cta">
      <div className="wrap final-inner">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <Link className="button" href="/diagnostik">
          Ikuti diagnostik gratis <span className="arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
