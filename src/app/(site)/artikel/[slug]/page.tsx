import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { ArticleCard, FaqList, FinalCta, formatDate } from "@/components/site/cards";
import { getArticle, getPrograms, getPublishedArticleSlugs, getRelatedArticles } from "@/lib/content";
import { extractHeadings, markdownToPlainText } from "@/lib/markdown";
import { redirectOrNotFound } from "@/lib/missing";
import { articleJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** Check against the cached slug list first so unknown URLs never hit per-slug caches. */
async function loadArticle(slug: string) {
  const slugs = await getPublishedArticleSlugs();
  return slugs.includes(slug) ? getArticle(slug) : null;
}

function metaDescription(a: { seoDescription: string | null; excerpt: string; content: string }) {
  return a.seoDescription || a.excerpt || markdownToPlainText(a.content, 155);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) return { title: "Halaman tidak ditemukan", robots: { index: false } };
  return pageMetadata({
    title: article.seoTitle || article.title,
    exactTitle: !!article.seoTitle,
    description: metaDescription(article),
    path: `/artikel/${article.slug}`,
    image: article.coverImageUrl,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    noindex: article.noindex,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) {
    const candidates = await getPublishedArticleSlugs();
    return redirectOrNotFound(`/artikel/${slug}`, { slug, candidates, toPath: (s) => `/artikel/${s}` });
  }

  const path = `/artikel/${article.slug}`;
  const [related, programs] = await Promise.all([getRelatedArticles(article.slug, article.subject, 3), getPrograms()]);
  const program = programs.find((p) => p.slug === article.relatedProgramSlug);
  const headings = extractHeadings(article.content);
  const published = formatDate(article.publishedAt);
  const updated = formatDate(article.updatedAt);
  const isNews = article.type === "berita";

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            type: article.type,
            title: article.title,
            description: metaDescription(article),
            path,
            image: article.coverImageUrl,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            authorName: article.authorName,
          }),
          faqJsonLd(article.faq),
        ]}
      />
      <section className="subpage-hero editorial-hero article-hero">
        <div className="wrap">
          <Breadcrumb
            items={[
              isNews ? { name: "Berita", path: "/berita" } : { name: "Artikel", path: "/artikel" },
              { name: article.title, path },
            ]}
          />
          <p className="eyebrow">{isNews ? "Berita olimpiade" : "Panduan OSN"}</p>
          <h1>{article.title}</h1>
          {article.excerpt && <p>{article.excerpt}</p>}
          <p className="article-meta">
            {published && (
              <span>
                Terbit <time dateTime={article.publishedAt ?? undefined}>{published}</time>
              </span>
            )}
            {updated && updated !== published && (
              <span>
                Diperbarui <time dateTime={article.updatedAt}>{updated}</time>
              </span>
            )}
            {article.authorName && <span>Penulis: {article.authorName}</span>}
            {article.reviewerName && <span>Direview: {article.reviewerName}</span>}
          </p>
        </div>
      </section>

      <article className="page-content">
        <div className="wrap article-layout">
          <div>
            {article.coverImageUrl && (
              <figure className="article-cover">
                {article.coverImageUrl.startsWith("/") ? (
                  <Image
                    src={article.coverImageUrl}
                    alt={article.coverImageAlt ?? ""}
                    width={1200}
                    height={675}
                    sizes="(max-width: 930px) 100vw, 760px"
                    priority
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- external images imported from WordPress
                  <img src={article.coverImageUrl} alt={article.coverImageAlt ?? ""} decoding="async" />
                )}
              </figure>
            )}
            <Markdown source={article.content} />
            {(article.authorName || article.reviewerName) && (
              <div className="author-box">
                {article.authorName && (
                  <strong>
                    Ditulis oleh {article.authorName}
                  </strong>
                )}
                {article.reviewerName && <span>Ditinjau oleh {article.reviewerName}, mentor AYS Science Academy.</span>}
              </div>
            )}
            {article.faq.length > 0 && (
              <section className="article-faq" aria-labelledby="faq-title">
                <h2 id="faq-title" className="faq-heading">
                  Pertanyaan yang sering diajukan
                </h2>
                <FaqList items={article.faq} />
              </section>
            )}
          </div>
          <aside>
            {headings.length > 2 && (
              <nav className="toc" aria-label="Daftar isi">
                <h2>Daftar isi</h2>
                <ol>
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="aside-cta">
              {program ? (
                <>
                  <strong>Belajar {program.name} bersama mentor</strong>
                  <p>
                    {program.code}: {program.summary}.
                  </p>
                  <Link className="button" href={`/program/${program.slug}`}>
                    Lihat program <span aria-hidden="true">↗</span>
                  </Link>
                </>
              ) : (
                <>
                  <strong>Tidak yakin mulai dari mana?</strong>
                  <p>Tes diagnostik gratis membantu memetakan kesiapanmu sebelum memilih bidang.</p>
                  <Link className="button" href="/diagnostik">
                    Ikuti tes diagnostik <span aria-hidden="true">↗</span>
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <div className="wrap">
            <h2 id="related-title">Bacaan terkait</h2>
            <div className="resource-grid">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} headingLevel="h3" />
              ))}
            </div>
          </div>
        </section>
      )}
      <FinalCta />
    </>
  );
}
