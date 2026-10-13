import { asc } from "drizzle-orm";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";

export const metadata = { title: "Artikel baru" };

export default async function NewArticlePage() {
  await requirePageUser("content:write");
  const programs = await getDb()
    .select({ slug: schema.programs.slug, code: schema.programs.code, name: schema.programs.name })
    .from(schema.programs)
    .orderBy(asc(schema.programs.sortOrder));
  return (
    <>
      <h1>Artikel baru</h1>
      <p className="admin-lede">Ikuti brief SEO: keyword utama di judul, H2 untuk tiap subtopik, FAQ, dan CTA yang relevan.</p>
      <ArticleForm programs={programs} />
    </>
  );
}
