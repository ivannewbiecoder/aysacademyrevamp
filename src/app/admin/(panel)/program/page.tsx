import { asc } from "drizzle-orm";
import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Program" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminProgramsPage({ searchParams }: Props) {
  await requirePageUser("content:write");
  const rows = await getDb().select().from(schema.programs).orderBy(asc(schema.programs.sortOrder), asc(schema.programs.id));
  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="admin-toolbar">
        <div>
          <h1>Program Training Camp</h1>
          <p className="admin-lede">Halaman /program/[slug] untuk keyword komersial seperti “pelatihan OSN [bidang]”.</p>
        </div>
        <Link className="button" href="/admin/program/baru">
          + Program baru
        </Link>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Urutan</th>
              <th>Program</th>
              <th>Jenjang</th>
              <th>Materi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.sortOrder}</td>
                <td>
                  <Link href={`/admin/program/${p.id}`}>
                    {p.code} – {p.name}
                  </Link>
                  <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>/program/{p.slug}</div>
                </td>
                <td>{p.level}</td>
                <td>{p.topics.length} kelas</td>
                <td>
                  <span className={p.published ? "badge badge--ok" : "badge badge--muted"}>{p.published ? "tampil" : "tersembunyi"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
