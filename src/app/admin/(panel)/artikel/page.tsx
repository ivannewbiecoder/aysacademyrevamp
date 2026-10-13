import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Artikel & berita" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminArticlesPage({ searchParams }: Props) {
  await requirePageUser("content:write");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : null;

  const filters: SQL[] = [];
  if (status) filters.push(eq(schema.articles.status, status));
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    filters.push(or(ilike(schema.articles.title, pattern), ilike(schema.articles.slug, pattern)) as SQL);
  }
  const rows = await getDb()
    .select({
      id: schema.articles.id,
      title: schema.articles.title,
      slug: schema.articles.slug,
      type: schema.articles.type,
      status: schema.articles.status,
      noindex: schema.articles.noindex,
      updatedAt: schema.articles.updatedAt,
    })
    .from(schema.articles)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(schema.articles.updatedAt))
    .limit(200);

  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="admin-toolbar">
        <div>
          <h1>Artikel &amp; berita</h1>
          <p className="admin-lede">URL publik: /artikel/[slug]. Berita tampil di /berita.</p>
        </div>
        <Link className="button" href="/admin/artikel/baru">
          + Tulis artikel
        </Link>
      </div>
      <form className="search-form" method="get">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input name="q" type="search" defaultValue={q} placeholder="Cari judul atau slug" aria-label="Cari artikel" />
        </label>
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="filter-button">
          <option value="">Semua status</option>
          <option value="published">Terbit</option>
          <option value="draft">Draf</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jenis</th>
              <th>Status</th>
              <th>Diubah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/artikel/${a.id}`}>{a.title}</Link>
                  <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>/artikel/{a.slug}</div>
                </td>
                <td>{a.type}</td>
                <td>
                  <span className={a.status === "published" ? "badge badge--ok" : "badge badge--muted"}>{a.status}</span>{" "}
                  {a.noindex && <span className="badge badge--warn">noindex</span>}
                </td>
                <td>{a.updatedAt.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4}>Tidak ada artikel yang cocok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
