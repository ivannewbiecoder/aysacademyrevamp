import { and, eq, inArray, like } from "drizzle-orm";
import { closeDb, getDb, schema } from "../src/lib/db";
import { loadEnv } from "./env";

loadEnv();

/**
 * End-to-end smoke test against a running server (production build).
 *   BASE_URL=http://127.0.0.1:3100 npm run smoke
 * Creates fixtures prefixed "qa-smoke-", purges the content cache through
 * /api/revalidate, checks SEO, security, redirects and content rules, then
 * removes every fixture it created.
 */
const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3100").replace(/\/+$/, "");
const MONEY_SLUG = "silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma";

let failures = 0;
let passes = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${!ok && detail ? ` — ${detail}` : ""}`);
}

async function get(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", ...init });
  const type = res.headers.get("content-type") ?? "";
  const body = /text|json|xml/.test(type) ? await res.text() : "";
  return { res, body };
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const titleOf = (html: string) => decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
const metaOf = (html: string, name: string) =>
  html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${name}"`))?.[1] ??
  null;
const canonicalOf = (html: string) => html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1] ?? null;
const h1Count = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;
const jsonLdBlocks = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);

async function purgeCache() {
  const res = await fetch(`${BASE}/api/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.REVALIDATE_SECRET ?? ""}` },
  });
  if (!res.ok) throw new Error(`Gagal purge cache (${res.status}). Set REVALIDATE_SECRET untuk server dan skrip.`);
}

async function main() {
  const db = getDb();
  console.log(`Smoke test → ${BASE}\n`);

  // ---------------------------------------------------------------- fixtures
  const createdMoney = (
    await db
      .insert(schema.articles)
      .values({
        slug: MONEY_SLUG,
        title: "Silabus OSN Matematika 2026: Materi Lengkap untuk SD, SMP, dan SMA",
        seoTitle: "Silabus OSN Matematika 2026: Materi SD, SMP & SMA",
        seoDescription: "Silabus OSN Matematika 2026 untuk SD, SMP, dan SMA: daftar topik per jenjang dan cara memakainya untuk menyusun rencana belajar.",
        excerpt: "Fixture smoke test.",
        content: "## Silabus SD\n\nIsi.\n\n## Silabus SMP\n\nIsi.\n\n## Silabus SMA\n\nRumus $a^2+b^2=c^2$.",
        subject: "matematika",
        status: "published",
        publishedAt: new Date(Date.now() - 60_000),
      })
      .onConflictDoNothing({ target: schema.articles.slug })
      .returning({ id: schema.articles.id })
  )[0];
  await db.insert(schema.articles).values([
    {
      slug: "qa-smoke-xss",
      title: "QA smoke XSS",
      excerpt: "x",
      content: '<script>alert("x")</script>\n\n[klik](javascript:alert(1))\n\n<img src=x onerror=alert(1)>\n\nAman.',
      status: "published",
      publishedAt: new Date(Date.now() - 60_000),
      faq: [{ q: "Apakah ini aman?", a: "Ya." }],
    },
    { slug: "qa-smoke-draft", title: "QA smoke draft", status: "draft" },
    { slug: "qa-smoke-future", title: "QA smoke terjadwal", status: "published", publishedAt: new Date(Date.now() + 86_400_000) },
  ]);
  const [set] = await db
    .insert(schema.questionSets)
    .values({ subjectSlug: "kimia", slug: "qa-smoke-osp-2024", title: "QA OSP Kimia 2024", stage: "osn-p", year: 2024, status: "published", publishedAt: new Date() })
    .returning({ id: schema.questionSets.id });
  await db.insert(schema.questions).values([
    { setId: set.id, number: 1, body: "Soal TERVERIFIKASI $x^2$", answer: "A", explanation: "Pembahasan", mentorReviewed: true },
    { setId: set.id, number: 2, body: "Soal BELUM-DICEK", answer: "B", mentorReviewed: false },
  ]);
  await db.insert(schema.redirects).values({ fromPath: "/qa-smoke-lama", toPath: "/program", note: "smoke" });
  await purgeCache();

  try {
    // ------------------------------------------------------------- pages & SEO
    console.log("Halaman publik & SEO");
    const pages = [
      "/",
      "/program",
      "/program/biotrac",
      "/artikel",
      "/berita",
      "/soal-osn",
      "/soal-osn/kimia",
      "/soal-osn/kimia/qa-smoke-osp-2024",
      `/artikel/${MONEY_SLUG}`,
      "/diagnostik",
      "/tryout",
      "/konsultasi",
    ];
    for (const path of pages) {
      const { res, body } = await get(path);
      const title = titleOf(body);
      const description = metaOf(body, "description") ?? "";
      const canonical = canonicalOf(body);
      const ld = jsonLdBlocks(body);
      let ldValid = true;
      for (const block of ld) {
        try {
          JSON.parse(block);
        } catch {
          ldValid = false;
        }
      }
      check(
        `${path} → 200, title ≤ 60, desc 50–160, canonical, 1×H1, og:image, JSON-LD valid`,
        res.status === 200 &&
          title.length > 0 &&
          title.length <= 60 &&
          description.length >= 50 &&
          description.length <= 160 &&
          canonical === `${process.env.SITE_URL?.replace(/\/+$/, "")}${path === "/" ? "" : path}` &&
          h1Count(body) === 1 &&
          !!metaOf(body, "og:image") &&
          ldValid,
        `status=${res.status} title(${title.length})="${title}" desc=${description.length} canonical=${canonical} h1=${h1Count(body)} og=${!!metaOf(body, "og:image")} ld=${ldValid}`,
      );
    }

    const home = await get("/");
    check("Beranda punya JSON-LD EducationalOrganization + FAQPage", /EducationalOrganization/.test(home.body) && /FAQPage/.test(home.body));
    check("Beranda tidak memuat Google Fonts eksternal", !/fonts\.googleapis\.com/.test(home.body));
    check("Beranda tidak hotlink ke aysacademy.id/hero-ays.jpg", !/aysacademy\.id\/hero-ays\.jpg/.test(home.body));
    const program = await get("/program/biotrac");
    check("Halaman program punya Course + BreadcrumbList schema", /"Course"/.test(program.body) && /BreadcrumbList/.test(program.body));
    check("Halaman program memuat form konsultasi", /name="whatsapp"/.test(program.body));

    // ------------------------------------------------------------ content rules
    console.log("\nAturan konten");
    const soal = await get("/soal-osn/kimia/qa-smoke-osp-2024");
    check("Bank Soal menampilkan soal yang sudah dicek mentor", soal.body.includes("TERVERIFIKASI"));
    check("Bank Soal menyembunyikan soal yang belum dicek", !soal.body.includes("BELUM-DICEK"));
    check("Rumus dirender KaTeX di server", /class="katex"/.test(soal.body));
    const xss = await get("/artikel/qa-smoke-xss");
    const articleBody = xss.body.split('<div class="prose">')[1]?.split("</div>")[0] ?? "";
    check("Markdown: <script> dari konten dibuang", !/<script>alert/.test(xss.body));
    check("Markdown: link javascript: dinetralkan", !/href="javascript:/i.test(xss.body));
    check("Markdown: atribut onerror dibuang", !/onerror=/i.test(articleBody));
    check("FAQ artikel → FAQPage schema", /FAQPage/.test(xss.body));
    check("Artikel draf tidak bisa diakses publik (404)", (await get("/artikel/qa-smoke-draft")).res.status === 404);
    check("Artikel terjadwal belum tampil (404)", (await get("/artikel/qa-smoke-future")).res.status === 404);
    const search = await get(`/artikel?q=${encodeURIComponent('<script>x</script>')}`);
    check("Pencarian meng-escape input dan diberi noindex", !search.body.includes("<script>x</script>") && /noindex/.test(search.body));
    const sitemap = await get("/sitemap.xml");
    check(
      "Sitemap memuat program, artikel, set soal; tanpa draf/admin",
      sitemap.body.includes("/program/biotrac") &&
        sitemap.body.includes(`/artikel/${MONEY_SLUG}`) &&
        sitemap.body.includes("/soal-osn/kimia/qa-smoke-osp-2024") &&
        !sitemap.body.includes("qa-smoke-draft") &&
        !sitemap.body.includes("/admin"),
    );

    // ---------------------------------------------------------------- redirects
    console.log("\nRedirect migrasi");
    const redirects: [string, string][] = [
      ["/list-program", "/program"],
      ["/biotrac", "/program/biotrac"],
      ["/program/biotrac-batch-3", "/program/biotrac"],
      ["/category/berita", "/artikel"],
      ["/author/aysacademy-indonesiagmail-com", "/artikel"],
      ["/2025/03", "/artikel"],
      ["/artikel?type=berita", "/berita?type=berita"],
      ["/artikel/", "/artikel"],
      [`/artikel/${MONEY_SLUG}/`, `/artikel/${MONEY_SLUG}`],
      ["/qa-smoke-lama", "/program"],
      ["/artikel/silabus-osn-matematika-2026-materi-lengkap-for-sd-smp-and-sma", `/artikel/${MONEY_SLUG}`],
      ["/artikel/silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-dan-sma", `/artikel/${MONEY_SLUG}`],
      ["/artikel/silabus-osi-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma", `/artikel/${MONEY_SLUG}`],
    ];
    for (const [from, to] of redirects) {
      const { res } = await get(from);
      const location = res.headers.get("location") ?? "";
      const target = location.startsWith("http") ? new URL(location).pathname + new URL(location).search : location;
      check(`${from} → ${to} (permanen)`, [301, 308].includes(res.status) && target === to, `status=${res.status} location=${location}`);
    }
    for (const path of [
      "/artikel/silabus-osn-fisika-2026-materi-lengkap-untuk-sma",
      "/artikel/qa-tidak-ada-sama-sekali",
      "/halaman-ngawur",
      "/soal-osn/astronomi",
      "/program/tidak-ada",
    ]) {
      const { res } = await get(path);
      check(`${path} → 404 (tidak di-redirect sembarangan)`, res.status === 404, `status=${res.status} location=${res.headers.get("location")}`);
    }

    // ----------------------------------------------------------------- security
    console.log("\nKeamanan");
    const h = home.res.headers;
    check("CSP publik aktif (object-src none, frame-ancestors none)", /object-src 'none'/.test(h.get("content-security-policy") ?? "") && /frame-ancestors 'none'/.test(h.get("content-security-policy") ?? ""));
    check("X-Content-Type-Options nosniff", h.get("x-content-type-options") === "nosniff");
    check("X-Frame-Options DENY", h.get("x-frame-options") === "DENY");
    check("Referrer-Policy", h.get("referrer-policy") === "strict-origin-when-cross-origin");
    check("Permissions-Policy", /camera=\(\)/.test(h.get("permissions-policy") ?? ""));
    check("Header X-Powered-By tidak ada", !h.get("x-powered-by"));
    const admin = await get("/admin");
    check("/admin tanpa sesi → redirect ke login", [302, 307].includes(admin.res.status) && (admin.res.headers.get("location") ?? "").endsWith("/admin/login"));
    const login = await get("/admin/login");
    const adminCsp = login.res.headers.get("content-security-policy") ?? "";
    check("Admin: CSP nonce + strict-dynamic", /'nonce-[^']+'/.test(adminCsp) && /'strict-dynamic'/.test(adminCsp));
    check("Admin: no-store & X-Robots-Tag noindex", login.res.headers.get("cache-control")?.includes("no-store") === true && /noindex/.test(login.res.headers.get("x-robots-tag") ?? ""));
    const nonce = adminCsp.match(/'nonce-([^']+)'/)?.[1] ?? "";
    const scripts = [...login.body.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    check("Admin: semua <script> membawa nonce", scripts.length > 0 && scripts.every((s) => s.includes(`nonce="${nonce}"`)), `${scripts.filter((s) => !s.includes("nonce")).length} tanpa nonce`);
    const exportRes = await get("/admin/leads/export");
    check("Ekspor CSV lead tanpa sesi ditolak", exportRes.res.status !== 200 || !exportRes.body.includes("whatsapp"));
    const forged = await get("/admin/leads/export", { headers: { Cookie: "ays_admin=palsu; __Host-ays_admin=palsu" } });
    check("Ekspor CSV dengan cookie palsu ditolak (403)", forged.res.status === 403);
    const revalidate = await fetch(`${BASE}/api/revalidate`, { method: "POST", headers: { Authorization: "Bearer salah" } });
    check("/api/revalidate menolak token salah", revalidate.status === 401);
    const robots = await get("/robots.txt");
    check("robots.txt menutup /admin atau seluruh situs non-produksi", /Disallow: \/admin|Disallow: \/$/m.test(robots.body));
  } finally {
    // ------------------------------------------------------------------ cleanup
    await db.delete(schema.questionSets).where(eq(schema.questionSets.id, set.id));
    await db.delete(schema.articles).where(like(schema.articles.slug, "qa-smoke-%"));
    if (createdMoney) await db.delete(schema.articles).where(and(eq(schema.articles.id, createdMoney.id)));
    await db.delete(schema.redirects).where(inArray(schema.redirects.fromPath, ["/qa-smoke-lama"]));
    await purgeCache().catch(() => undefined);
  }

  console.log(`\n${passes} lolos, ${failures} gagal`);
  if (failures) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("✗ Smoke test error:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
