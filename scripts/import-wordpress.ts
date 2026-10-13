import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { closeDb, getDb, schema } from "../src/lib/db";
import { isValidSlug } from "../src/lib/slug";
import { convertWpPost, type ImportedArticle, type WpPost } from "../src/lib/wp-import";
import { arg, flag, loadEnv } from "./env";

loadEnv();

/**
 * Import published WordPress posts into the articles table, keeping slugs so
 * every indexed /artikel/{slug} URL keeps working after the switch.
 *
 *   npm run import:wp -- --url https://aysacademy.id            # dry run (default)
 *   npm run import:wp -- --url https://aysacademy.id --write    # write to DB
 *   npm run import:wp -- --file posts.json --write              # from a saved REST export
 *   --overwrite        update articles that already exist (default: skip)
 *   --download-media   copy images from the old site into public/uploads/wp
 *
 * Run this BEFORE pointing the domain at the new app, while WordPress is still live.
 */
const MEDIA_DIR = path.join("public", "uploads", "wp");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function fetchJson<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return { data: (await res.json()) as T, totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1) };
}

async function loadPosts(): Promise<WpPost[]> {
  const file = arg("file");
  if (file) return JSON.parse(await readFile(file, "utf8")) as WpPost[];
  const base = (arg("url") || "").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(base)) throw new Error("Gunakan --url https://domain-wordpress atau --file export.json");
  const posts: WpPost[] = [];
  for (let page = 1; ; page++) {
    const { data, totalPages } = await fetchJson<WpPost[]>(`${base}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=1&status=publish`);
    posts.push(...data);
    console.log(`  halaman ${page}/${totalPages}: ${data.length} post`);
    if (page >= totalPages) break;
  }
  return posts;
}

/** Download an image from the old site and return its new local path. */
async function downloadImage(url: string, sourceHost: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== sourceHost || !parsed.pathname.includes("/wp-content/uploads/")) return null;
  const relative = parsed.pathname.split("/wp-content/uploads/")[1];
  if (!relative || relative.includes("..")) return null;
  const target = path.join(MEDIA_DIR, relative);
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) return null;
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > MAX_IMAGE_BYTES) return null;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return `/uploads/wp/${relative}`;
}

async function localiseMedia(article: ImportedArticle, sourceHost: string): Promise<ImportedArticle> {
  let { content, coverImageUrl } = article;
  for (const url of article.images) {
    const local = await downloadImage(url, sourceHost).catch(() => null);
    if (!local) continue;
    content = content.split(url).join(local);
    if (coverImageUrl === url) coverImageUrl = local;
  }
  return { ...article, content, coverImageUrl };
}

async function main() {
  const write = flag("write");
  const overwrite = flag("overwrite");
  const download = flag("download-media");
  console.log(`Impor WordPress → artikel (${write ? "MENULIS ke database" : "dry run, tambahkan --write untuk menyimpan"})`);

  const posts = await loadPosts();
  const sourceHost = arg("url") ? new URL(arg("url")!).hostname : "";
  let written = 0;
  let skipped = 0;
  const problems: string[] = [];
  const db = getDb();

  for (const post of posts) {
    let article = convertWpPost(post);
    if (!isValidSlug(article.slug)) {
      problems.push(`slug tidak valid, dilewati: ${article.slug}`);
      skipped++;
      continue;
    }
    if (download && sourceHost && write) article = await localiseMedia(article, sourceHost);

    const values = {
      slug: article.slug,
      type: article.type,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      subject: article.subject,
      coverImageUrl: article.coverImageUrl,
      coverImageAlt: article.coverImageAlt,
      authorName: article.authorName,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      status: "published" as const,
      publishedAt: article.publishedAt ?? new Date(),
      // Keep WordPress' modified date so dateModified in JSON-LD stays truthful.
      updatedAt: article.updatedAt ?? new Date(),
    };
    console.log(`  ${article.type === "berita" ? "[berita] " : ""}${article.slug} (${article.content.length} karakter)`);
    if (!write) continue;

    const result = overwrite
      ? await db
          .insert(schema.articles)
          .values(values)
          .onConflictDoUpdate({ target: schema.articles.slug, set: values })
          .returning({ id: schema.articles.id })
      : await db.insert(schema.articles).values(values).onConflictDoNothing({ target: schema.articles.slug }).returning({ id: schema.articles.id });
    if (result.length) written++;
    else skipped++;

    if (article.legacyPath) {
      await db
        .insert(schema.redirects)
        .values({ fromPath: article.legacyPath, toPath: `/artikel/${article.slug}`, note: "Impor WordPress: permalink lama" })
        .onConflictDoNothing({ target: schema.redirects.fromPath });
    }
  }

  console.log(`\nSelesai: ${posts.length} post dibaca · ${written} ditulis · ${skipped} dilewati (sudah ada / slug tidak valid)`);
  for (const p of problems) console.log(`  ! ${p}`);
  if (!write) console.log("Dry run: tidak ada yang disimpan.");
}

main()
  .catch((error) => {
    console.error("✗ Impor gagal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
