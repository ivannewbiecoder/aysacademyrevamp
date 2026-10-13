import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "editor", "mentor"]);
export const educationLevel = pgEnum("education_level", ["SMP", "SMA"]);
export const contentStatus = pgEnum("content_status", ["draft", "published"]);
export const articleType = pgEnum("article_type", ["artikel", "berita"]);
export const questionStage = pgEnum("question_stage", [
  "osn-k",
  "osn-p",
  "osn",
  "internasional",
  "latihan",
]);
export const leadRole = pgEnum("lead_role", ["siswa", "orang_tua", "guru", "lainnya"]);
export const leadStatus = pgEnum("lead_status", ["baru", "dihubungi", "selesai", "spam"]);

export type FaqItem = { q: string; a: string };
export type Choice = { label: string; text: string };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("editor"),
  active: boolean("active").notNull().default(true),
  /** Set for admin-issued temporary passwords; the user must change it before using the panel. */
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

/** Session ids are stored as SHA-256 hashes; the raw token only lives in the cookie. */
export const sessions = pgTable(
  "sessions",
  {
    idHash: text("id_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  level: educationLevel("level").notNull(),
  /** Visual accent key used by the design system (biology, physics, ...). */
  accent: text("accent").notNull(),
  summary: text("summary").notNull(),
  intro: text("intro"),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  faq: jsonb("faq").$type<FaqItem[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    type: articleType("type").notNull().default("artikel"),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    /** Free-form subject filter: strategi, matematika, biologi, ... */
    subject: text("subject"),
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    authorName: text("author_name"),
    reviewerName: text("reviewer_name"),
    relatedProgramSlug: text("related_program_slug"),
    faq: jsonb("faq").$type<FaqItem[]>().notNull().default([]),
    status: contentStatus("status").notNull().default("draft"),
    noindex: boolean("noindex").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (t) => [index("articles_listing_idx").on(t.status, t.type, t.publishedAt)],
);

export const questionSets = pgTable(
  "question_sets",
  {
    id: serial("id").primaryKey(),
    /** Bank Soal subject slug, e.g. "kimia", "matematika-smp" (see BANK_SUBJECTS). */
    subjectSlug: text("subject_slug").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    stage: questionStage("stage").notNull(),
    year: integer("year"),
    description: text("description").notNull().default(""),
    /** Source / license note shown under the set (required for third-party problems). */
    sourceNote: text("source_note").notNull().default(""),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (t) => [uniqueIndex("question_sets_subject_slug_uq").on(t.subjectSlug, t.slug)],
);

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    setId: integer("set_id")
      .notNull()
      .references(() => questionSets.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    body: text("body").notNull(),
    choices: jsonb("choices").$type<Choice[]>().notNull().default([]),
    answer: text("answer").notNull().default(""),
    explanation: text("explanation").notNull().default(""),
    mentorReviewed: boolean("mentor_reviewed").notNull().default(false),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("questions_set_number_uq").on(t.setId, t.number)],
);

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    role: leadRole("role").notNull(),
    level: text("level").notNull(),
    programSlug: text("program_slug"),
    whatsapp: text("whatsapp").notNull(),
    email: text("email"),
    school: text("school"),
    message: text("message"),
    consent: boolean("consent").notNull(),
    sourcePath: text("source_path"),
    utm: jsonb("utm").$type<Record<string, string>>().notNull().default({}),
    status: leadStatus("status").notNull().default("baru"),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [index("leads_created_idx").on(t.createdAt)],
);

export const redirects = pgTable("redirects", {
  id: serial("id").primaryKey(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  hits: integer("hits").notNull().default(0),
  note: text("note"),
  ...timestamps,
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type QuestionSet = typeof questionSets.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
