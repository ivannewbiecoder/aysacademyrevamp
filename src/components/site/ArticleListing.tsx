import Link from "next/link";
import { ARTICLE_SUBJECTS } from "@/content/site";
import { getArticleList, PAGE_SIZE } from "@/lib/content";
import { ArticleCard, Pagination } from "./cards";

type Params = { bidang?: string | string[]; q?: string | string[]; page?: string | string[] };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseListingParams(sp: Params) {
  const bidangRaw = first(sp.bidang);
  const subject = ARTICLE_SUBJECTS.some((s) => s.value === bidangRaw) ? bidangRaw! : null;
  const q = first(sp.q)?.trim().slice(0, 80) || null;
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.min(pageNum, 500) : 1;
  return { subject, q, page };
}

/** Filtered/searched/paginated listings are noindex; only the clean first page is canonical. */
export function isFilteredListing(p: ReturnType<typeof parseListingParams>) {
  return !!(p.subject || p.q || p.page > 1);
}

export async function ArticleListing({
  type,
  basePath,
  params,
  showSubjects,
}: {
  type: "artikel" | "berita";
  basePath: string;
  params: ReturnType<typeof parseListingParams>;
  showSubjects: boolean;
}) {
  const { items, total } = await getArticleList({ type, subject: params.subject, q: params.q, page: params.page });

  const href = (next: { bidang?: string | null; page?: number }) => {
    const sp = new URLSearchParams();
    const bidang = next.bidang === undefined ? params.subject : next.bidang;
    if (bidang) sp.set("bidang", bidang);
    if (params.q) sp.set("q", params.q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <>
      <form className="search-form" action={basePath} method="get" role="search">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Cari topik, bidang, atau judul"
            aria-label={type === "berita" ? "Cari berita" : "Cari artikel"}
            maxLength={80}
          />
        </label>
        {params.subject && <input type="hidden" name="bidang" value={params.subject} />}
        <button type="submit">Cari</button>
      </form>

      {showSubjects && (
        <nav className="filter-bar" aria-label="Filter bidang">
          <Link className="filter-button" href={href({ bidang: null })} aria-current={!params.subject ? "page" : undefined}>
            Semua bidang
          </Link>
          {ARTICLE_SUBJECTS.map((s) => (
            <Link
              key={s.value}
              className="filter-button"
              href={href({ bidang: s.value })}
              aria-current={params.subject === s.value ? "page" : undefined}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      )}

      {params.q && (
        <p className="result-count" role="status">
          {total} hasil untuk “{params.q}”
        </p>
      )}

      {items.length ? (
        <div className="resource-grid">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <p className="empty-note">
          Belum ada {type === "berita" ? "berita" : "artikel"} yang cocok. Coba kata kunci atau bidang lain.
        </p>
      )}

      <Pagination page={params.page} total={total} pageSize={PAGE_SIZE} hrefFor={(page) => href({ page })} />
    </>
  );
}
