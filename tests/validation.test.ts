import { describe, expect, it } from "vitest";
import { articleFormSchema, faqToText, leadSchema, normalizeWhatsapp, parseFaqText, programFormSchema, questionFormSchema } from "@/lib/validation";

describe("normalizeWhatsapp", () => {
  it.each([
    ["0812-3456-7890", "6281234567890"],
    ["+62 812 3456 7890", "6281234567890"],
    ["6281234567890", "6281234567890"],
    ["81234567890", "6281234567890"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeWhatsapp(input)).toBe(expected);
  });
  it.each(["123", "0000000000", "+1 555 123 4567", "08abc", ""])("rejects %s", (input) => {
    expect(normalizeWhatsapp(input)).toBeNull();
  });
});

describe("leadSchema", () => {
  const valid = {
    name: "Ayu Lestari",
    role: "orang_tua",
    level: "SMP",
    whatsapp: "081234567890",
    consent: "on",
  };
  it("accepts a minimal valid lead and normalises fields", () => {
    const r = leadSchema.parse({ ...valid, email: "", school: "  ", programSlug: "" });
    expect(r.whatsapp).toBe("6281234567890");
    expect(r.email).toBeNull();
    expect(r.school).toBeNull();
    expect(r.programSlug).toBeNull();
    expect(r.consent).toBe(true);
  });
  it("requires consent", () => {
    expect(leadSchema.safeParse({ ...valid, consent: null }).success).toBe(false);
  });
  it("rejects unknown roles and bad emails", () => {
    expect(leadSchema.safeParse({ ...valid, role: "admin" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, email: "bukan-email" }).success).toBe(false);
  });
  it("caps message length", () => {
    expect(leadSchema.safeParse({ ...valid, message: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("FAQ text format", () => {
  it("round-trips", () => {
    const faq = [
      { q: "Apa itu OSN?", a: "Olimpiade Sains Nasional." },
      { q: "Kapan OSN-K?", a: "Belum diumumkan.\nPantau Puspresnas." },
    ];
    expect(parseFaqText(faqToText(faq))).toEqual(faq);
  });
  it("ignores incomplete blocks", () => {
    expect(parseFaqText("T: tanpa jawaban\n\nJ: tanpa pertanyaan")).toEqual([]);
  });
});

describe("questionFormSchema choices", () => {
  it("parses lettered choices and ignores junk lines", () => {
    const r = questionFormSchema.parse({
      number: "3",
      body: "Berapa $1+1$?",
      choices: "A. 1\nb) 2\nbukan pilihan\nC. $\\sqrt{4}$",
      answer: "B",
      explanation: "",
    });
    expect(r.choices).toEqual([
      { label: "A", text: "1" },
      { label: "B", text: "2" },
      { label: "C", text: "$\\sqrt{4}$" },
    ]);
  });
});

describe("admin forms with unchecked checkboxes (absent from FormData)", () => {
  it("article form saves without the noindex key", () => {
    const r = articleFormSchema.safeParse({
      title: "Silabus OSN SMP 2026",
      slug: "silabus-osn-smp",
      type: "artikel",
      excerpt: "",
      content: "## Isi",
      status: "draft",
      coverImageUrl: "",
    });
    expect(r.success).toBe(true);
    expect(r.success && r.data.noindex).toBe(false);
  });
  it("article form rejects protocol-relative or http cover images", () => {
    const base = { title: "Judul artikel", slug: "judul", type: "artikel", excerpt: "", content: "", status: "draft" };
    expect(articleFormSchema.safeParse({ ...base, coverImageUrl: "//evil.example/x.png" }).success).toBe(false);
    expect(articleFormSchema.safeParse({ ...base, coverImageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(articleFormSchema.safeParse({ ...base, coverImageUrl: "/uploads/wp/a.png" }).success).toBe(true);
  });
  it("program form treats a missing 'published' box as hidden", () => {
    const r = programFormSchema.safeParse({
      code: "BIOTRAC",
      name: "Biologi",
      level: "SMA",
      accent: "biology",
      summary: "Sel · genetika",
      topics: "Sel\nGenetika",
      sortOrder: "1",
    });
    expect(r.success).toBe(true);
    expect(r.success && r.data.published).toBe(false);
    expect(r.success && r.data.topics).toEqual(["Sel", "Genetika"]);
  });
});
