import { z } from "zod";
import { SLUG_PATTERN } from "./slug";

/** Normalise Indonesian WhatsApp numbers to 62xxxxxxxxxx; returns null if invalid. */
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return /^62[1-9]\d{7,12}$/.test(digits) ? digits : null;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.null(), z.undefined()])
  .transform((v) => v === "on" || v === "true" || v === "1");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Slug wajib diisi.")
  .max(120, "Slug maksimal 120 karakter.")
  .regex(SLUG_PATTERN, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.");

/** FAQ entered in admin as "T: pertanyaan" / "J: jawaban" blocks separated by blank lines. */
export function parseFaqText(text: string): { q: string; a: string }[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const q = block.match(/^\s*T\s*:\s*(.+)$/im)?.[1]?.trim();
      const a = block.match(/^\s*J\s*:\s*([\s\S]+)$/im)?.[1]?.trim();
      return q && a ? { q, a } : null;
    })
    .filter((x): x is { q: string; a: string } => x !== null)
    .slice(0, 20);
}

export function faqToText(faq: { q: string; a: string }[]): string {
  return faq.map((f) => `T: ${f.q}\nJ: ${f.a}`).join("\n\n");
}

const faqField = z
  .string()
  .max(20_000)
  .optional()
  .transform((v) => parseFaqText(v ?? ""));

// ---------------------------------------------------------------------------
// Public lead form
// ---------------------------------------------------------------------------

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
  role: z.enum(["siswa", "orang_tua", "guru", "lainnya"], { error: "Pilih peran Anda." }),
  level: z.enum(["SD", "SMP", "SMA", "lainnya"], { error: "Pilih jenjang." }),
  programSlug: optionalText(60),
  whatsapp: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const normalized = normalizeWhatsapp(v);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxx." });
        return z.NEVER;
      }
      return normalized;
    }),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.email("Format email tidak valid.").nullable()),
  school: optionalText(150),
  message: optionalText(1000),
  consent: checkbox.refine((v) => v, "Mohon setujui pemrosesan data agar tim AYS bisa menghubungi Anda."),
  sourcePath: optionalText(300),
});

export type LeadInput = z.infer<typeof leadSchema>;

// ---------------------------------------------------------------------------
// Admin forms
// ---------------------------------------------------------------------------

export const articleFormSchema = z.object({
  title: z.string().trim().min(5, "Judul minimal 5 karakter.").max(200),
  slug: slugSchema,
  type: z.enum(["artikel", "berita"]),
  excerpt: z.string().trim().max(400, "Ringkasan maksimal 400 karakter."),
  content: z.string().max(200_000, "Konten terlalu panjang."),
  subject: optionalText(40),
  coverImageUrl: optionalText(500).refine(
    (v) => v === null || /^\/(?!\/)/.test(v) || /^https:\/\//.test(v),
    "Gunakan path lokal (/images/...) atau URL https.",
  ),
  coverImageAlt: optionalText(200),
  authorName: optionalText(120),
  reviewerName: optionalText(120),
  relatedProgramSlug: optionalText(60),
  faq: faqField,
  status: z.enum(["draft", "published"]),
  noindex: checkbox,
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  publishedAt: optionalText(40),
});

export const programFormSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(80),
  level: z.enum(["SMP", "SMA"]),
  accent: z.enum(["biology", "physics", "chemistry", "math", "informatics", "geography", "economics", "science"]),
  summary: z.string().trim().min(5).max(300),
  intro: optionalText(2000),
  topics: z
    .string()
    .max(10_000)
    .transform((v) =>
      v
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 60),
    ),
  faq: faqField,
  sortOrder: z.coerce.number().int().min(0).max(999),
  published: checkbox,
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
});

export const questionSetFormSchema = z.object({
  subjectSlug: z.enum(["biologi", "fisika", "kimia", "matematika-sma", "ipa-smp", "matematika-smp"]),
  slug: slugSchema,
  title: z.string().trim().min(5).max(200),
  stage: z.enum(["osn-k", "osn-p", "osn", "internasional", "latihan"]),
  year: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(1990).max(2100).nullable()),
  description: z.string().max(20_000),
  sourceNote: z.string().trim().max(1000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
});

export const questionFormSchema = z.object({
  number: z.coerce.number().int().min(1).max(500),
  body: z.string().trim().min(1, "Isi soal wajib diisi.").max(50_000),
  choices: z
    .string()
    .max(10_000)
    .optional()
    .transform((v) =>
      (v ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const m = line.match(/^([A-Ea-e])[.)]\s*(.+)$/);
          return m ? { label: m[1].toUpperCase(), text: m[2] } : null;
        })
        .filter((c): c is { label: string; text: string } => c !== null)
        .slice(0, 8),
    ),
  answer: z.string().trim().max(2000),
  explanation: z.string().max(50_000),
});

export const redirectFormSchema = z.object({
  fromPath: z
    .string()
    .trim()
    .max(500)
    .regex(/^\/[^\s?#]*$/, "Path asal harus diawali / dan tanpa query string."),
  toPath: z
    .string()
    .trim()
    .max(500)
    .regex(/^(\/[^\s]*|https:\/\/[^\s]+)$/, "Tujuan harus path (/...) atau URL https."),
  note: optionalText(300),
});

export const userFormSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Format email tidak valid.")),
  name: z.string().trim().min(2).max(100),
  role: z.enum(["admin", "editor", "mentor"]),
});

/** Flatten zod issues into a { field: message } map for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= issue.message;
  }
  return out;
}
