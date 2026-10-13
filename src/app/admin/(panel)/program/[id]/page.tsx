import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/Flash";
import { ProgramForm } from "@/components/admin/ProgramForm";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Edit program" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditProgramPage({ params, searchParams }: Props) {
  await requirePageUser("content:write");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [program] = await getDb().select().from(schema.programs).where(eq(schema.programs.id, id)).limit(1);
  if (!program) notFound();
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>
        {program.code} – {program.name}
      </h1>
      <ProgramForm program={program} />
    </>
  );
}
