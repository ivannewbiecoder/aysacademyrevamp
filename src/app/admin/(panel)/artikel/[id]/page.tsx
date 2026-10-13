import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/ActionButton";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { Flash } from "@/components/admin/Flash";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";
import { deleteArticle } from "../../../actions";

export const metadata = { title: "Edit artikel" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditArticlePage({ params, searchParams }: Props) {
  await requirePageUser("content:write");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const db = getDb();
  const [article] = await db.select().from(schema.articles).where(eq(schema.articles.id, id)).limit(1);
  if (!article) notFound();
  const programs = await db
    .select({ slug: schema.programs.slug, code: schema.programs.code, name: schema.programs.name })
    .from(schema.programs)
    .orderBy(asc(schema.programs.sortOrder));

  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="admin-toolbar">
        <h1>Edit artikel</h1>
        <ActionButton
          action={deleteArticle}
          fields={{ id: article.id }}
          label="Hapus artikel"
          className="button button--danger button--small"
          confirm={`Hapus "${article.title}"? URL-nya akan menjadi 404. Untuk menyembunyikan sementara, ubah status ke Draf.`}
        />
      </div>
      <ArticleForm article={article} programs={programs} />
    </>
  );
}
