import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/ActionButton";
import { QuestionForm } from "@/components/admin/QuestionForms";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";
import { deleteQuestion } from "../../../../../actions";

export const metadata = { title: "Edit soal" };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string; qid: string }> }) {
  await requirePageUser("questions:write");
  const p = await params;
  const setId = Number(p.id);
  const id = Number(p.qid);
  if (![setId, id].every((n) => Number.isInteger(n) && n > 0)) notFound();
  const db = getDb();
  const [question] = await db
    .select()
    .from(schema.questions)
    .where(and(eq(schema.questions.id, id), eq(schema.questions.setId, setId)))
    .limit(1);
  if (!question) notFound();
  const [set] = await db.select().from(schema.questionSets).where(eq(schema.questionSets.id, setId)).limit(1);

  return (
    <>
      <p className="breadcrumb">
        <Link href={`/admin/soal/${setId}`}>← {set?.title ?? "Set soal"}</Link>
      </p>
      <div className="admin-toolbar">
        <h1>Soal {question.number}</h1>
        <ActionButton
          action={deleteQuestion}
          fields={{ id: question.id, setId }}
          label="Hapus soal"
          className="button button--danger button--small"
          confirm="Hapus soal ini?"
        />
      </div>
      <QuestionForm setId={setId} question={question} />
    </>
  );
}
