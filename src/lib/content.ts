import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "./db";
import type { FaqItem } from "./db/schema";

/**
 * Public read model. Everything here only ever returns *published* content and
 * is cached under the "content" tag, which admin mutations invalidate.
 * Dates are returned as ISO strings because cached values are serialised.
 */
export const CONTENT_TAG = "content";
const CACHE_SECONDS = 3600;

const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { tags: [CONTENT_TAG], revalidate: CACHE_SECONDS });

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export type ProgramDTO = {
  slug: string;
  code: string;
  name: string;
  level: "SMP" | "SMA";
  accent: string;
  summary: string;
  intro: string | null;
  topics: string[];
  faq: FaqItem[];
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

function toProgramDTO(p: typeof schema.programs.$inferSelect): ProgramDTO {
  return {
    slug: p.slug,
    code: p.code,
    name: p.name,
    level: p.level,
    accent: p.accent,
    summary: p.summary,
    intro: p.intro,
    topics: p.topics,
    faq: p.faq,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const getPrograms = cached(async (): Promise<ProgramDTO[]> => {
  const rows = await getDb()
    .select()
    .from(schema.programs)
    .where(eq(schema.programs.published, true))
    .orderBy(asc(schema.programs.sortOrder), asc(schema.programs.id));
  return rows.map(toProgramDTO);
}, "programs:all");

export const getProgram = cached(async (slug: string): Promise<ProgramDTO | null> => {
  const rows = await getDb()
    .select()
    .from(schema.programs)
    .where(and(eq(schema.programs.slug, slug), eq(schema.programs.published, true)))
    .limit(1);
  return rows[0] ? toProgramDTO(rows[0]) : null;
}, "programs:one");

// ---------------------------------------------------------------------------
// Articles & news
// ---------------------------------------------------------------------------

export type ArticleCardDTO = {
  slug: string;
  type: "artikel" | "berita";
  title: string;
  excerpt: string;
  subject: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
};

export type ArticleDTO = ArticleCardDTO & {
  content: string;
  authorName: string | null;
  reviewerName: string | null;
  relatedProgramSlug: string | null;
  faq: FaqItem[];
  noindex: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

const cardColumns = {
  slug: schema.articles.slug,
  type: schema.articles.type,
  title: schema.articles.title,
  excerpt: schema.articles.excerpt,
  subject: schema.articles.subject,
  coverImageUrl: schema.articles.coverImageUrl,
  coverImageAlt: schema.articles.coverImageAlt,
  publishedAt: schema.articles.publishedAt,
};

const isPublished = and(
  eq(schema.articles.status, "published"),
  sql`${schema.articles.publishedAt} <= now()`,
) as SQL;

function toCard(row: { publishedAt: Date | null } & Omit<ArticleCardDTO, "publishedAt">): ArticleCardDTO {
  return { ...row, publishedAt: iso(row.publishedAt) };
}

export const PAGE_SIZE = 12;

async function queryArticles(type: "artikel" | "berita", subject: string | null, page: number, q: string | null) {
  const db = getDb();
  const filters: SQL[] = [isPublished, eq(schema.articles.type, type)];
  if (subject) filters.push(eq(schema.articles.subject, subject));
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    filters.push(or(ilike(schema.articles.title, pattern), ilike(schema.articles.excerpt, pattern)) as SQL);
  }
  const where = and(...filters);
  const [items, totalRows] = await Promise.all([
    db
      .select(cardColumns)
      .from(schema.articles)
      .where(where)
      .orderBy(desc(schema.articles.publishedAt), desc(schema.articles.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(schema.articles).where(where),
  ]);
  return { items: items.map(toCard), total: Number(totalRows[0]?.value ?? 0) };
}

const queryArticlesCached = cached(
  (type: "artikel" | "berita", subject: string | null, page: number) => queryArticles(type, subject, page, null),
  "articles:list",
);

/** Free-text searches are not cached to keep arbitrary input out of the shared cache. */
export function getArticleList(opts: {
  type: "artikel" | "berita";
  subject?: string | null;
  page?: number;
  q?: string | null;
}) {
  const page = Math.max(1, Math.min(500, opts.page ?? 1));
  const q = opts.q?.trim().slice(0, 80) || null;
  return q
    ? queryArticles(opts.type, opts.subject ?? null, page, q)
    : queryArticlesCached(opts.type, opts.subject ?? null, page);
}

export const getLatestArticles = cached(async (limit: number): Promise<ArticleCardDTO[]> => {
  const rows = await getDb()
    .select(cardColumns)
    .from(schema.articles)
    .where(isPublished)
    .orderBy(desc(schema.articles.publishedAt))
    .limit(Math.min(limit, 12));
  return rows.map(toCard);
}, "articles:latest");

export const getArticle = cached(async (slug: string): Promise<ArticleDTO | null> => {
  const rows = await getDb()
    .select()
    .from(schema.articles)
    .where(and(eq(schema.articles.slug, slug), isPublished))
    .limit(1);
  const a = rows[0];
  if (!a) return null;
  return {
    slug: a.slug,
    type: a.type,
    title: a.title,
    excerpt: a.excerpt,
    subject: a.subject,
    coverImageUrl: a.coverImageUrl,
    coverImageAlt: a.coverImageAlt,
    publishedAt: iso(a.publishedAt),
    content: a.content,
    authorName: a.authorName,
    reviewerName: a.reviewerName,
    relatedProgramSlug: a.relatedProgramSlug,
    faq: a.faq,
    noindex: a.noindex,
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
    updatedAt: a.updatedAt.toISOString(),
  };
}, "articles:one");

export const getRelatedArticles = cached(
  async (slug: string, subject: string | null, limit: number): Promise<ArticleCardDTO[]> => {
    const filters: SQL[] = [isPublished, ne(schema.articles.slug, slug)];
    if (subject) filters.push(eq(schema.articles.subject, subject));
    const rows = await getDb()
      .select(cardColumns)
      .from(schema.articles)
      .where(and(...filters))
      .orderBy(desc(schema.articles.publishedAt))
      .limit(limit);
    return rows.map(toCard);
  },
  "articles:related",
);

export const getPublishedArticleSlugs = cached(async (): Promise<string[]> => {
  const rows = await getDb().select({ slug: schema.articles.slug }).from(schema.articles).where(isPublished);
  return rows.map((r) => r.slug);
}, "articles:slugs");

// ---------------------------------------------------------------------------
// Bank Soal
// ---------------------------------------------------------------------------

export type QuestionSetCardDTO = {
  subjectSlug: string;
  slug: string;
  title: string;
  stage: "osn-k" | "osn-p" | "osn" | "internasional" | "latihan";
  year: number | null;
  questionCount: number;
};

export type QuestionDTO = {
  number: number;
  body: string;
  choices: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

export type QuestionSetDTO = QuestionSetCardDTO & {
  description: string;
  sourceNote: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
  questions: QuestionDTO[];
};

const reviewedCount = sql<number>`(
  SELECT count(*) FROM ${schema.questions}
  WHERE ${schema.questions.setId} = ${schema.questionSets.id} AND ${schema.questions.mentorReviewed} = true
)`.mapWith(Number);

export const getQuestionSets = cached(async (subjectSlug: string): Promise<QuestionSetCardDTO[]> => {
  return getDb()
    .select({
      subjectSlug: schema.questionSets.subjectSlug,
      slug: schema.questionSets.slug,
      title: schema.questionSets.title,
      stage: schema.questionSets.stage,
      year: schema.questionSets.year,
      questionCount: reviewedCount,
    })
    .from(schema.questionSets)
    .where(and(eq(schema.questionSets.subjectSlug, subjectSlug), eq(schema.questionSets.status, "published")))
    .orderBy(desc(schema.questionSets.year), asc(schema.questionSets.title));
}, "sets:bySubject");

export const getQuestionSetCounts = cached(async (): Promise<Record<string, number>> => {
  const rows = await getDb()
    .select({ subjectSlug: schema.questionSets.subjectSlug, value: count() })
    .from(schema.questionSets)
    .where(eq(schema.questionSets.status, "published"))
    .groupBy(schema.questionSets.subjectSlug);
  return Object.fromEntries(rows.map((r) => [r.subjectSlug, Number(r.value)]));
}, "sets:counts");

export const getQuestionSet = cached(async (subjectSlug: string, slug: string): Promise<QuestionSetDTO | null> => {
  const db = getDb();
  const sets = await db
    .select()
    .from(schema.questionSets)
    .where(
      and(
        eq(schema.questionSets.subjectSlug, subjectSlug),
        eq(schema.questionSets.slug, slug),
        eq(schema.questionSets.status, "published"),
      ),
    )
    .limit(1);
  const set = sets[0];
  if (!set) return null;
  // Only mentor-reviewed problems are ever shown publicly.
  const qs = await db
    .select({
      number: schema.questions.number,
      body: schema.questions.body,
      choices: schema.questions.choices,
      answer: schema.questions.answer,
      explanation: schema.questions.explanation,
    })
    .from(schema.questions)
    .where(and(eq(schema.questions.setId, set.id), eq(schema.questions.mentorReviewed, true)))
    .orderBy(asc(schema.questions.number));
  return {
    subjectSlug: set.subjectSlug,
    slug: set.slug,
    title: set.title,
    stage: set.stage,
    year: set.year,
    questionCount: qs.length,
    description: set.description,
    sourceNote: set.sourceNote,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    publishedAt: iso(set.publishedAt),
    updatedAt: set.updatedAt.toISOString(),
    questions: qs,
  };
}, "sets:one");

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export const getSitemapData = cached(async () => {
  const db = getDb();
  const [articles, programs, sets] = await Promise.all([
    db
      .select({ slug: schema.articles.slug, updatedAt: schema.articles.updatedAt })
      .from(schema.articles)
      .where(and(isPublished, eq(schema.articles.noindex, false))),
    db
      .select({ slug: schema.programs.slug, updatedAt: schema.programs.updatedAt })
      .from(schema.programs)
      .where(eq(schema.programs.published, true)),
    db
      .select({
        subjectSlug: schema.questionSets.subjectSlug,
        slug: schema.questionSets.slug,
        updatedAt: schema.questionSets.updatedAt,
      })
      .from(schema.questionSets)
      .where(eq(schema.questionSets.status, "published")),
  ]);
  return {
    articles: articles.map((a) => ({ slug: a.slug, updatedAt: a.updatedAt.toISOString() })),
    programs: programs.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt.toISOString() })),
    sets: sets.map((s) => ({ subjectSlug: s.subjectSlug, slug: s.slug, updatedAt: s.updatedAt.toISOString() })),
  };
}, "sitemap");

// ---------------------------------------------------------------------------
// Redirects (looked up only on 404 paths, never cached so new rules apply at once)
// ---------------------------------------------------------------------------

export async function findRedirect(paths: string[]): Promise<string | null> {
  const unique = [...new Set(paths)].filter((p) => p.length <= 500);
  if (!unique.length) return null;
  const db = getDb();
  const rows = await db
    .select({ id: schema.redirects.id, fromPath: schema.redirects.fromPath, toPath: schema.redirects.toPath })
    .from(schema.redirects)
    .where(inArray(schema.redirects.fromPath, unique))
    .limit(unique.length);
  const hit = unique.map((p) => rows.find((r) => r.fromPath === p)).find(Boolean);
  if (!hit) return null;
  await db
    .update(schema.redirects)
    .set({ hits: sql`${schema.redirects.hits} + 1` })
    .where(eq(schema.redirects.id, hit.id))
    .catch(() => undefined);
  return hit.toPath;
}
