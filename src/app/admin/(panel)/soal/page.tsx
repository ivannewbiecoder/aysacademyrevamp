import { asc, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { findBankSubject, STAGE_LABEL } from "@/content/site";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Bank soal" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminQuestionSetsPage({ searchParams }: Props) {
  await requirePageUser("questions:write");
  const rows = await getDb()
    .select({
      id: schema.questionSets.id,
      subjectSlug: schema.questionSets.subjectSlug,
      slug: schema.questionSets.slug,
      title: schema.questionSets.title,
      stage: schema.questionSets.stage,
      year: schema.questionSets.year,
      status: schema.questionSets.status,
      total: sql<number>`count(${schema.questions.id})`.mapWith(Number),
      reviewed: sql<number>`count(${schema.questions.id}) filter (where ${schema.questions.mentorReviewed})`.mapWith(Number),
    })
    .from(schema.questionSets)
    .leftJoin(schema.questions, eq(schema.questions.setId, schema.questionSets.id))
    .groupBy(schema.questionSets.id)
    .orderBy(asc(schema.questionSets.subjectSlug), desc(schema.questionSets.year));

  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="admin-toolbar">
        <div>
          <h1>Bank soal</h1>
          <p className="admin-lede">
            Set hanya bisa terbit setelah semua soalnya ditandai <strong>sudah dicek mentor</strong>. Hanya soal yang sudah
            dicek yang tampil di situs.
          </p>
        </div>
        <Link className="button" href="/admin/soal/baru">
          + Set soal baru
        </Link>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Bidang</th>
              <th>Tahap</th>
              <th>Soal dicek</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/soal/${s.id}`}>{s.title}</Link>
                  <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>
                    /soal-osn/{s.subjectSlug}/{s.slug}
                  </div>
                </td>
                <td>{findBankSubject(s.subjectSlug)?.name ?? s.subjectSlug}</td>
                <td>
                  {STAGE_LABEL[s.stage]}
                  {s.year ? ` · ${s.year}` : ""}
                </td>
                <td>
                  <span className={s.total > 0 && s.reviewed === s.total ? "badge badge--ok" : "badge badge--warn"}>
                    {s.reviewed}/{s.total}
                  </span>
                </td>
                <td>
                  <span className={s.status === "published" ? "badge badge--ok" : "badge badge--muted"}>{s.status}</span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>
                  Belum ada set soal. Mulai dari set yang sudah punya URL lama, mis. kimia/osp-2024 dan matematika-sma/osp-2023.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
