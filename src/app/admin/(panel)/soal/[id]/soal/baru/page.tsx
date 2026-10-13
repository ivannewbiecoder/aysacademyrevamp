import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/QuestionForms";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Soal baru" };

export default async function NewQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser("questions:write");
  const setId = Number((await params).id);
  if (!Number.isInteger(setId) || setId <= 0) notFound();
  const db = getDb();
  const [set] = await db.select().from(schema.questionSets).where(eq(schema.questionSets.id, setId)).limit(1);
  if (!set) notFound();
  const [last] = await db
    .select({ number: schema.questions.number })
    .from(schema.questions)
    .where(eq(schema.questions.setId, setId))
    .orderBy(desc(schema.questions.number))
    .limit(1);
  return (
    <>
      <p className="breadcrumb">
        <Link href={`/admin/soal/${set.id}`}>← {set.title}</Link>
      </p>
      <h1>Soal baru</h1>
      <QuestionForm setId={set.id} nextNumber={(last?.number ?? 0) + 1} />
    </>
  );
}
