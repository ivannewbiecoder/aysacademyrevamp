import { count, desc, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { can, requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Dasbor" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requirePageUser();
  const db = getDb();
  const [[newLeads], [weekLeads], [published], [drafts], [sets], [pending], recent] = await Promise.all([
    db.select({ n: count() }).from(schema.leads).where(eq(schema.leads.status, "baru")),
    db.select({ n: count() }).from(schema.leads).where(gte(schema.leads.createdAt, sql`now() - interval '7 days'`)),
    db.select({ n: count() }).from(schema.articles).where(eq(schema.articles.status, "published")),
    db.select({ n: count() }).from(schema.articles).where(eq(schema.articles.status, "draft")),
    db.select({ n: count() }).from(schema.questionSets).where(eq(schema.questionSets.status, "published")),
    db.select({ n: count() }).from(schema.questions).where(eq(schema.questions.mentorReviewed, false)),
    db
      .select({ id: schema.articles.id, title: schema.articles.title, status: schema.articles.status, updatedAt: schema.articles.updatedAt })
      .from(schema.articles)
      .orderBy(desc(schema.articles.updatedAt))
      .limit(6),
  ]);

  const stats = [
    ...(can(user, "leads:read")
      ? [
          { n: newLeads.n, label: "lead baru belum dihubungi", href: "/admin/leads?status=baru" },
          { n: weekLeads.n, label: "lead 7 hari terakhir", href: "/admin/leads" },
        ]
      : []),
    { n: pending.n, label: "soal menunggu cek mentor", href: "/admin/soal" },
    { n: published.n, label: `artikel terbit (${drafts.n} draf)`, href: "/admin/artikel" },
  ];

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>Halo, {user.name}</h1>
      <p className="admin-lede">Ringkasan konten dan lead situs aysacademy.id. {sets.n} set soal sudah terbit.</p>
      <div className="stat-grid">
        {stats.map((s) => (
          <Link className="stat" href={s.href} key={s.label} style={{ textDecoration: "none" }}>
            <strong>{s.n}</strong>
            <span>{s.label}</span>
          </Link>
        ))}
      </div>
      <h2 style={{ fontSize: 20 }}>Terakhir diubah</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Status</th>
              <th>Diubah</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/artikel/${a.id}`}>{a.title}</Link>
                </td>
                <td>
                  <span className={a.status === "published" ? "badge badge--ok" : "badge badge--muted"}>{a.status}</span>
                </td>
                <td>{a.updatedAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</td>
              </tr>
            ))}
            {!recent.length && (
              <tr>
                <td colSpan={3}>Belum ada artikel. Mulai dengan impor dari WordPress atau tulis artikel baru.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
