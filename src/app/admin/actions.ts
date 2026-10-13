"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/admin/AdminForm";
import { logAudit } from "@/lib/audit";
import { AuthError, requireActionUser, type Capability } from "@/lib/auth/guards";
import { getDummyHash, hashPassword, passwordProblems, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessionsForUser, destroySession, getSessionUser } from "@/lib/auth/session";
import { CONTENT_TAG } from "@/lib/content";
import { getDb, schema } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { renderMarkdown } from "@/lib/markdown";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders, hashIp } from "@/lib/request";
import { normalizePath } from "@/lib/slug-match";
import {
  articleFormSchema,
  fieldErrors,
  programFormSchema,
  questionFormSchema,
  questionSetFormSchema,
  redirectFormSchema,
  userFormSchema,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const idSchema = z.coerce.number().int().positive();

function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  }
  return out;
}

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/** Run an admin mutation with auth, uniform error handling and cache invalidation. */
async function guarded(
  capability: Capability,
  run: (user: Awaited<ReturnType<typeof requireActionUser>>) => Promise<ActionState | void>,
): Promise<ActionState> {
  let user;
  try {
    user = await requireActionUser(capability);
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.message };
    throw error;
  }
  const result = await run(user);
  return result ?? { ok: true, message: "Tersimpan." };
}

function invalidateContent() {
  updateTag(CONTENT_TAG);
}

function generateTempPassword(): string {
  // 16 chars from an unambiguous alphabet, always containing letters and digits.
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${body.slice(0, 14)}${2 + (bytes[0] % 8)}a`;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().max(200),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, message: "Email atau password salah." };
  const { email, password } = parsed.data;

  const env = serverEnv();
  const ipHash = hashIp(clientIpFromHeaders(await headers(), env.TRUSTED_PROXY_COUNT), env.IP_HASH_SALT);
  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`login-ip:${ipHash}`, 20, 900),
    consumeRateLimit(`login-email:${email}`, 5, 900),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return { ok: false, message: "Terlalu banyak percobaan masuk. Tunggu 15 menit lalu coba lagi." };
  }

  const rows = await getDb().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const user = rows[0];
  // Always run argon2 so response time does not reveal whether the email exists.
  const valid = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password);
  if (!user || !valid || !user.active) {
    await logAudit(user?.id ?? null, "login_failed", "user", user?.id, { email });
    return { ok: false, message: "Email atau password salah." };
  }

  await createSession(user.id);
  await getDb().update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await resetRateLimit(`login-email:${email}`);
  await logAudit(user.id, "login", "user", user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const user = await getSessionUser();
  await destroySession();
  if (user) await logAudit(user.id, "logout", "user", user.id);
  redirect("/admin/login");
}

export async function changeOwnPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan masuk kembali." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordProblems(next);
  if (problem) return { ok: false, errors: { next: problem } };
  if (next !== confirm) return { ok: false, errors: { confirm: "Konfirmasi password tidak sama." } };

  const rows = await getDb().select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!rows[0] || !(await verifyPassword(rows[0].passwordHash, current))) {
    return { ok: false, errors: { current: "Password saat ini salah." } };
  }
  await getDb()
    .update(schema.users)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(schema.users.id, user.id));
  // Sign out every other device, then start a fresh session here.
  await destroyAllSessionsForUser(user.id);
  await createSession(user.id);
  await logAudit(user.id, "password_changed", "user", user.id);
  return { ok: true, message: "Password berhasil diganti. Sesi di perangkat lain sudah dikeluarkan." };
}

// ---------------------------------------------------------------------------
// Markdown preview
// ---------------------------------------------------------------------------

export async function previewMarkdown(markdown: string): Promise<string> {
  await requireActionUser("questions:write");
  return renderMarkdown(String(markdown).slice(0, 200_000));
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function saveArticle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("content:write", async (user): Promise<ActionState | void> => {
    const raw = formObject(formData);
    const id = raw.id ? idSchema.parse(raw.id) : null;
    const parsed = articleFormSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
    const data = parsed.data;

    // datetime-local values carry no zone; the form is in WIB (UTC+7).
    const localInput = data.publishedAt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.publishedAt);
    let publishedAt: Date | null = data.publishedAt
      ? new Date(localInput ? `${data.publishedAt}:00+07:00` : data.publishedAt)
      : null;
    if (publishedAt && Number.isNaN(publishedAt.getTime())) {
      return { ok: false, errors: { publishedAt: "Tanggal terbit tidak valid." } };
    }
    if (data.status === "published" && !publishedAt) publishedAt = new Date();

    const values = { ...data, publishedAt };
    const db = getDb();
    try {
      if (id) {
        const before = (await db.select().from(schema.articles).where(eq(schema.articles.id, id)).limit(1))[0];
        if (!before) return { ok: false, message: "Artikel tidak ditemukan." };
        await db.update(schema.articles).set(values).where(eq(schema.articles.id, id));
        // Keep old links alive when a published article's slug changes.
        if (before.slug !== data.slug && before.status === "published") {
          await db
            .insert(schema.redirects)
            .values({ fromPath: `/artikel/${before.slug}`, toPath: `/artikel/${data.slug}`, note: "Otomatis: slug artikel diganti" })
            .onConflictDoUpdate({ target: schema.redirects.fromPath, set: { toPath: `/artikel/${data.slug}` } });
        }
        await logAudit(user.id, "update", "article", id, { slug: data.slug, status: data.status });
      } else {
        const inserted = await db.insert(schema.articles).values(values).returning({ id: schema.articles.id });
        await logAudit(user.id, "create", "article", inserted[0].id, { slug: data.slug });
        invalidateContent();
        redirect(`/admin/artikel/${inserted[0].id}?saved=1`);
      }
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false, errors: { slug: "Slug sudah dipakai artikel lain." } };
      throw error;
    }
    invalidateContent();
    return { ok: true, message: data.status === "published" ? "Tersimpan dan terbit." : "Draf tersimpan." };
  });
}

export async function deleteArticle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("content:write", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    await getDb().delete(schema.articles).where(eq(schema.articles.id, id));
    await logAudit(user.id, "delete", "article", id);
    invalidateContent();
    redirect("/admin/artikel?deleted=1");
  });
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export async function saveProgram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("content:write", async (user): Promise<ActionState | void> => {
    const raw = formObject(formData);
    const id = raw.id ? idSchema.parse(raw.id) : null;
    const parsed = programFormSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
    const db = getDb();
    if (id) {
      await db.update(schema.programs).set(parsed.data).where(eq(schema.programs.id, id));
      await logAudit(user.id, "update", "program", id);
    } else {
      const slug = z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .safeParse(raw.slug);
      if (!slug.success) return { ok: false, errors: { slug: "Slug hanya huruf kecil, angka, dan tanda hubung." } };
      try {
        const inserted = await db
          .insert(schema.programs)
          .values({ ...parsed.data, slug: slug.data })
          .returning({ id: schema.programs.id });
        await logAudit(user.id, "create", "program", inserted[0].id);
        invalidateContent();
        redirect(`/admin/program/${inserted[0].id}?saved=1`);
      } catch (error) {
        if (isUniqueViolation(error)) return { ok: false, errors: { slug: "Slug sudah dipakai." } };
        throw error;
      }
    }
    invalidateContent();
  });
}

// ---------------------------------------------------------------------------
// Bank Soal
// ---------------------------------------------------------------------------

async function unreviewedCount(setId: number): Promise<{ total: number; unreviewed: number }> {
  const rows = await getDb()
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      unreviewed: sql<number>`count(*) filter (where ${schema.questions.mentorReviewed} = false)`.mapWith(Number),
    })
    .from(schema.questions)
    .where(eq(schema.questions.setId, setId));
  return rows[0] ?? { total: 0, unreviewed: 0 };
}

export async function saveQuestionSet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("questions:write", async (user): Promise<ActionState | void> => {
    const raw = formObject(formData);
    const id = raw.id ? idSchema.parse(raw.id) : null;
    const parsed = questionSetFormSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
    const db = getDb();
    try {
      if (id) {
        await db.update(schema.questionSets).set(parsed.data).where(eq(schema.questionSets.id, id));
        await logAudit(user.id, "update", "question_set", id);
      } else {
        const inserted = await db.insert(schema.questionSets).values(parsed.data).returning({ id: schema.questionSets.id });
        await logAudit(user.id, "create", "question_set", inserted[0].id);
        redirect(`/admin/soal/${inserted[0].id}?saved=1`);
      }
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false, errors: { slug: "Slug sudah dipakai di bidang ini." } };
      throw error;
    }
    invalidateContent();
  });
}

export async function setQuestionSetStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("questions:review", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    const publish = formData.get("status") === "published";
    if (publish) {
      const { total, unreviewed } = await unreviewedCount(id);
      if (total === 0) return { ok: false, message: "Tambahkan minimal satu soal sebelum menerbitkan set." };
      if (unreviewed > 0) {
        return { ok: false, message: `${unreviewed} soal belum ditandai "sudah dicek mentor". Semua soal wajib dicek sebelum terbit.` };
      }
    }
    await getDb()
      .update(schema.questionSets)
      .set({ status: publish ? "published" : "draft", publishedAt: publish ? new Date() : null })
      .where(eq(schema.questionSets.id, id));
    await logAudit(user.id, publish ? "publish" : "unpublish", "question_set", id);
    invalidateContent();
    return { ok: true, message: publish ? "Set soal terbit." : "Set soal dikembalikan ke draf." };
  });
}

export async function deleteQuestionSet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("content:write", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    await getDb().delete(schema.questionSets).where(eq(schema.questionSets.id, id));
    await logAudit(user.id, "delete", "question_set", id);
    invalidateContent();
    redirect("/admin/soal?deleted=1");
  });
}

export async function saveQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("questions:write", async (user): Promise<ActionState | void> => {
    const raw = formObject(formData);
    const setId = idSchema.parse(raw.setId);
    const id = raw.id ? idSchema.parse(raw.id) : null;
    const parsed = questionFormSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
    const db = getDb();
    try {
      if (id) {
        const before = (await db.select().from(schema.questions).where(eq(schema.questions.id, id)).limit(1))[0];
        if (!before || before.setId !== setId) return { ok: false, message: "Soal tidak ditemukan." };
        const contentChanged =
          before.body !== parsed.data.body ||
          before.answer !== parsed.data.answer ||
          before.explanation !== parsed.data.explanation ||
          JSON.stringify(before.choices) !== JSON.stringify(parsed.data.choices);
        // Any change to the problem invalidates the mentor review.
        await db
          .update(schema.questions)
          .set({ ...parsed.data, ...(contentChanged ? { mentorReviewed: false, reviewedBy: null, reviewedAt: null } : {}) })
          .where(eq(schema.questions.id, id));
        await logAudit(user.id, "update", "question", id, { contentChanged });
        invalidateContent();
        return {
          ok: true,
          message: contentChanged && before.mentorReviewed ? "Tersimpan. Status cek mentor direset karena isi soal berubah." : "Tersimpan.",
        };
      }
      const inserted = await db
        .insert(schema.questions)
        .values({ ...parsed.data, setId })
        .returning({ id: schema.questions.id });
      await logAudit(user.id, "create", "question", inserted[0].id, { setId });
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false, errors: { number: "Nomor soal sudah dipakai di set ini." } };
      throw error;
    }
    invalidateContent();
    redirect(`/admin/soal/${setId}?saved=1`);
  });
}

export async function reviewQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("questions:review", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    const reviewed = formData.get("reviewed") === "1";
    await getDb()
      .update(schema.questions)
      .set(
        reviewed
          ? { mentorReviewed: true, reviewedBy: user.id, reviewedAt: new Date() }
          : { mentorReviewed: false, reviewedBy: null, reviewedAt: null },
      )
      .where(eq(schema.questions.id, id));
    await logAudit(user.id, reviewed ? "review" : "unreview", "question", id);
    invalidateContent();
    return { ok: true, message: reviewed ? "Ditandai sudah dicek mentor." : "Tanda cek mentor dicabut." };
  });
}

export async function deleteQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("questions:write", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    const setId = idSchema.parse(formData.get("setId"));
    await getDb()
      .delete(schema.questions)
      .where(and(eq(schema.questions.id, id), eq(schema.questions.setId, setId)));
    await logAudit(user.id, "delete", "question", id);
    invalidateContent();
    redirect(`/admin/soal/${setId}?deleted=1`);
  });
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

const leadStatusSchema = z.enum(["baru", "dihubungi", "selesai", "spam"]);

export async function updateLeadStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("leads:read", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    const status = leadStatusSchema.parse(formData.get("status"));
    await getDb().update(schema.leads).set({ status }).where(eq(schema.leads.id, id));
    await logAudit(user.id, "update_status", "lead", id, { status });
    return { ok: true, message: "Status diperbarui." };
  });
}

export async function deleteLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("users:manage", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    await getDb().delete(schema.leads).where(eq(schema.leads.id, id));
    await logAudit(user.id, "delete", "lead", id);
    redirect("/admin/leads?deleted=1");
  });
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

export async function saveRedirect(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("redirects:write", async (user): Promise<ActionState | void> => {
    const parsed = redirectFormSchema.safeParse(formObject(formData));
    if (!parsed.success) return { ok: false, message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
    const fromPath = normalizePath(parsed.data.fromPath);
    if (fromPath === "/" || fromPath.startsWith("/admin") || fromPath.startsWith("/_next")) {
      return { ok: false, errors: { fromPath: "Path ini tidak boleh dialihkan." } };
    }
    if (normalizePath(parsed.data.toPath) === fromPath) return { ok: false, errors: { toPath: "Tujuan sama dengan asal." } };
    // Prevent simple loops: A -> B while B -> A exists.
    const loop = await getDb()
      .select({ id: schema.redirects.id })
      .from(schema.redirects)
      .where(and(eq(schema.redirects.fromPath, normalizePath(parsed.data.toPath)), eq(schema.redirects.toPath, fromPath)))
      .limit(1);
    if (loop.length) return { ok: false, errors: { toPath: "Akan membuat redirect berputar (loop)." } };

    await getDb()
      .insert(schema.redirects)
      .values({ fromPath, toPath: parsed.data.toPath, note: parsed.data.note })
      .onConflictDoUpdate({ target: schema.redirects.fromPath, set: { toPath: parsed.data.toPath, note: parsed.data.note } });
    await logAudit(user.id, "upsert", "redirect", fromPath, { toPath: parsed.data.toPath });
    return { ok: true, message: `Redirect ${fromPath} → ${parsed.data.toPath} tersimpan.` };
  });
}

export async function deleteRedirect(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("redirects:write", async (user): Promise<ActionState | void> => {
    const id = idSchema.parse(formData.get("id"));
    await getDb().delete(schema.redirects).where(eq(schema.redirects.id, id));
    await logAudit(user.id, "delete", "redirect", id);
    return { ok: true, message: "Redirect dihapus." };
  });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("users:manage", async (user): Promise<ActionState | void> => {
    const parsed = userFormSchema.safeParse(formObject(formData));
    if (!parsed.success) return { ok: false, message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
    const tempPassword = generateTempPassword();
    try {
      const inserted = await getDb()
        .insert(schema.users)
        .values({ ...parsed.data, passwordHash: await hashPassword(tempPassword) })
        .returning({ id: schema.users.id });
      await logAudit(user.id, "create", "user", inserted[0].id, { email: parsed.data.email, role: parsed.data.role });
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false, errors: { email: "Email sudah terdaftar." } };
      throw error;
    }
    return {
      ok: true,
      message: `Akun ${parsed.data.email} dibuat. Password sementara (tampil sekali): ${tempPassword} — minta pengguna menggantinya di menu Akun.`,
    };
  });
}

export async function setUserActive(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("users:manage", async (user): Promise<ActionState | void> => {
    const id = z.uuid().parse(formData.get("id"));
    const active = formData.get("active") === "1";
    if (id === user.id) return { ok: false, message: "Anda tidak bisa menonaktifkan akun sendiri." };
    if (!active) {
      const admins = await getDb()
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.role, "admin"), eq(schema.users.active, true), ne(schema.users.id, id)));
      if (!admins.length) return { ok: false, message: "Minimal harus ada satu admin aktif." };
    }
    await getDb().update(schema.users).set({ active }).where(eq(schema.users.id, id));
    if (!active) await destroyAllSessionsForUser(id);
    await logAudit(user.id, active ? "activate" : "deactivate", "user", id);
    return { ok: true, message: active ? "Akun diaktifkan." : "Akun dinonaktifkan dan semua sesinya dikeluarkan." };
  });
}

export async function resetUserPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("users:manage", async (user): Promise<ActionState | void> => {
    const id = z.uuid().parse(formData.get("id"));
    const tempPassword = generateTempPassword();
    await getDb()
      .update(schema.users)
      .set({ passwordHash: await hashPassword(tempPassword) })
      .where(eq(schema.users.id, id));
    await destroyAllSessionsForUser(id);
    await logAudit(user.id, "reset_password", "user", id);
    return { ok: true, message: `Password sementara baru (tampil sekali): ${tempPassword}` };
  });
}
