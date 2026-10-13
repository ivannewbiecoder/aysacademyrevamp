import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/ActionButton";
import { Flash } from "@/components/admin/Flash";
import { QuestionSetForm } from "@/components/admin/QuestionForms";
import { can, requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";
import { markdownToPlainText } from "@/lib/markdown";
import { deleteQuestionSet, reviewQuestion, setQuestionSetStatus } from "../../../actions";

export const metadata = { title: "Edit set soal" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditQuestionSetPage({ params, searchParams }: Props) {
  const user = await requirePageUser("questions:write");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const db = getDb();
  const [set] = await db.select().from(schema.questionSets).where(eq(schema.questionSets.id, id)).limit(1);
  if (!set) notFound();
  const questions = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.setId, id))
    .orderBy(asc(schema.questions.number));
  const canReview = can(user, "questions:review");
  const reviewed = questions.filter((q) => q.mentorReviewed).length;

  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="admin-toolbar">
        <div>
          <h1>{set.title}</h1>
          <p className="admin-lede">
            Status: <span className={set.status === "published" ? "badge badge--ok" : "badge badge--muted"}>{set.status}</span> ·{" "}
            {reviewed}/{questions.length} soal sudah dicek mentor
          </p>
        </div>
        <div className="admin-actions">
          {canReview &&
            (set.status === "published" ? (
              <ActionButton action={setQuestionSetStatus} fields={{ id: set.id, status: "draft" }} label="Kembalikan ke draf" />
            ) : (
              <ActionButton
                action={setQuestionSetStatus}
                fields={{ id: set.id, status: "published" }}
                label="Terbitkan set"
                className="button button--small"
              />
            ))}
          {set.status === "published" && (
            <a className="button button--light button--small" href={`/soal-osn/${set.subjectSlug}/${set.slug}`} target="_blank" rel="noopener">
              Lihat ↗
            </a>
          )}
          {can(user, "content:write") && (
            <ActionButton
              action={deleteQuestionSet}
              fields={{ id: set.id }}
              label="Hapus set"
              className="button button--danger button--small"
              confirm={`Hapus set "${set.title}" beserta ${questions.length} soalnya?`}
            />
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 20 }}>Soal</h2>
      <div className="admin-toolbar">
        <span className="admin-lede" style={{ margin: 0 }}>
          {canReview ? "Anda dapat menandai soal yang sudah dicek." : "Mentor atau admin yang menandai soal sebagai sudah dicek."}
        </span>
        <Link className="button button--small" href={`/admin/soal/${set.id}/soal/baru`}>
          + Tambah soal
        </Link>
      </div>
      <div className="table-scroll" style={{ marginBottom: 32 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Cuplikan</th>
              <th>Kunci</th>
              <th>Cek mentor</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td>{q.number}</td>
                <td>
                  <Link href={`/admin/soal/${set.id}/soal/${q.id}`}>{markdownToPlainText(q.body, 90) || "(kosong)"}</Link>
                </td>
                <td>{q.answer || "—"}</td>
                <td>
                  {q.mentorReviewed ? <span className="badge badge--ok">sudah dicek</span> : <span className="badge badge--warn">belum</span>}{" "}
                  {canReview && (
                    <ActionButton
                      action={reviewQuestion}
                      fields={{ id: q.id, reviewed: q.mentorReviewed ? "0" : "1" }}
                      label={q.mentorReviewed ? "Batalkan" : "Tandai sudah dicek"}
                    />
                  )}
                </td>
              </tr>
            ))}
            {!questions.length && (
              <tr>
                <td colSpan={4}>Belum ada soal.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 20 }}>Pengaturan set</h2>
      <QuestionSetForm set={set} />
    </>
  );
}
