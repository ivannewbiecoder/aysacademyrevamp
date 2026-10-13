import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ActionButton } from "@/components/admin/ActionButton";
import { Flash } from "@/components/admin/Flash";
import { can, requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";
import { deleteLead, updateLeadStatus } from "../../actions";

export const metadata = { title: "Lead konsultasi" };

const STATUSES = ["baru", "dihubungi", "selesai", "spam"] as const;
const ROLE_LABEL: Record<string, string> = { siswa: "Siswa", orang_tua: "Orang tua", guru: "Guru", lainnya: "Lainnya" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LeadsPage({ searchParams }: Props) {
  const user = await requirePageUser("leads:read");
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? null;
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(schema.leads)
      .where(status ? eq(schema.leads.status, status) : undefined)
      .orderBy(desc(schema.leads.createdAt))
      .limit(300),
    db.select({ status: schema.leads.status, n: count() }).from(schema.leads).groupBy(schema.leads.status),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;

  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="admin-toolbar">
        <div>
          <h1>Lead konsultasi</h1>
          <p className="admin-lede">Data pribadi calon siswa. Akses dan ekspor tercatat di audit log.</p>
        </div>
        {/* Plain anchor on purpose: this is a file download from a route handler, not a page. */}
        <a className="button" href="/admin/leads/export" download>
          Ekspor CSV
        </a>
      </div>
      <nav className="filter-bar" aria-label="Filter status">
        <Link className="filter-button" href="/admin/leads" aria-current={!status ? "page" : undefined}>
          Semua
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} className="filter-button" href={`/admin/leads?status=${s}`} aria-current={status === s ? "page" : undefined}>
            {s} ({countOf(s)})
          </Link>
        ))}
      </nav>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Masuk</th>
              <th>Kontak</th>
              <th>Profil</th>
              <th>Pesan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {l.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}
                  <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>{l.sourcePath}</div>
                </td>
                <td>
                  <strong>{l.name}</strong>
                  <div>
                    <a href={`https://wa.me/${l.whatsapp}`} target="_blank" rel="noopener noreferrer">
                      +{l.whatsapp}
                    </a>
                  </div>
                  {l.email && <div>{l.email}</div>}
                </td>
                <td>
                  {ROLE_LABEL[l.role]} · {l.level}
                  {l.programSlug && <div>{l.programSlug}</div>}
                  {l.school && <div style={{ color: "var(--ink-soft)" }}>{l.school}</div>}
                  {l.utm.utm_source && (
                    <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>
                      {l.utm.utm_source}/{l.utm.utm_medium ?? "-"}/{l.utm.utm_campaign ?? "-"}
                    </div>
                  )}
                </td>
                <td style={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{l.message ?? "—"}</td>
                <td>
                  <span className={l.status === "baru" ? "badge badge--warn" : "badge"}>{l.status}</span>
                  <div className="admin-actions" style={{ marginTop: 6 }}>
                    {STATUSES.filter((s) => s !== l.status).map((s) => (
                      <ActionButton key={s} action={updateLeadStatus} fields={{ id: l.id, status: s }} label={`→ ${s}`} />
                    ))}
                    {can(user, "users:manage") && (
                      <ActionButton
                        action={deleteLead}
                        fields={{ id: l.id }}
                        label="Hapus"
                        className="button button--danger button--small"
                        confirm="Hapus data lead ini secara permanen (mis. atas permintaan pemilik data)?"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>Belum ada lead.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
