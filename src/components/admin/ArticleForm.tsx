"use client";

import { saveArticle } from "@/app/admin/actions";
import { ARTICLE_SUBJECTS } from "@/content/site";
import type { Article } from "@/lib/db/schema";
import { slugify } from "@/lib/slug";
import { faqToText } from "@/lib/validation";
import { AdminForm, SubmitButton } from "./AdminForm";
import { Checkbox, Select, TextArea, TextField } from "./fields";
import { MarkdownField } from "./MarkdownField";

type ProgramOption = { slug: string; code: string; name: string };

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  // datetime-local in Asia/Jakarta (UTC+7)
  const local = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function ArticleForm({ article, programs }: { article?: Article; programs: ProgramOption[] }) {
  return (
    <AdminForm action={saveArticle}>
      {article && <input type="hidden" name="id" value={article.id} />}
      <fieldset>
        <legend>Konten</legend>
        <div className="form-grid">
          <TextField name="title" label="Judul (H1)" defaultValue={article?.title} wide required maxLength={200} />
          <SlugField defaultValue={article?.slug} />
          <Select
            name="type"
            label="Jenis"
            defaultValue={article?.type ?? "artikel"}
            options={[
              { value: "artikel", label: "Artikel (panduan, tips, silabus)" },
              { value: "berita", label: "Berita (jadwal, pengumuman)" },
            ]}
          />
          <Select
            name="subject"
            label="Bidang"
            defaultValue={article?.subject ?? ""}
            options={[{ value: "", label: "Umum" }, ...ARTICLE_SUBJECTS]}
          />
          <TextArea
            name="excerpt"
            label="Ringkasan"
            hint="Tampil di kartu artikel dan di bawah judul. Maks 400 karakter."
            defaultValue={article?.excerpt}
            rows={3}
          />
        </div>
        <MarkdownField
          name="content"
          label="Isi artikel (Markdown)"
          hint="Gunakan ## untuk subjudul (H2), ### untuk H3. Rumus: $x^2$ atau $$...$$. HTML mentah tidak diizinkan."
          defaultValue={article?.content}
          rows={24}
        />
      </fieldset>

      <fieldset>
        <legend>SEO</legend>
        <div className="form-grid">
          <TextField
            name="seoTitle"
            label="Title tag"
            hint="Kosongkan untuk memakai judul. Ideal ≤ 60 karakter."
            defaultValue={article?.seoTitle}
            maxLength={70}
            wide
          />
          <TextArea
            name="seoDescription"
            label="Meta description"
            hint="Ideal ≤ 155 karakter. Kosongkan untuk memakai ringkasan."
            defaultValue={article?.seoDescription}
            rows={2}
          />
          <TextArea
            name="faq"
            label="FAQ (untuk FAQPage schema)"
            hint={'Format per blok: "T: pertanyaan" lalu baris "J: jawaban", pisahkan blok dengan baris kosong.'}
            defaultValue={article ? faqToText(article.faq) : ""}
            rows={6}
          />
          <Checkbox name="noindex" label="Jangan indeks halaman ini (noindex)" defaultChecked={article?.noindex} />
        </div>
      </fieldset>

      <fieldset>
        <legend>E-E-A-T &amp; tautan</legend>
        <div className="form-grid">
          <TextField name="authorName" label="Penulis" defaultValue={article?.authorName} maxLength={120} />
          <TextField
            name="reviewerName"
            label="Direview oleh (mentor)"
            hint="Nama dan medali mentor yang sudah diverifikasi internal."
            defaultValue={article?.reviewerName}
            maxLength={120}
          />
          <Select
            name="relatedProgramSlug"
            label="Program terkait (CTA samping)"
            defaultValue={article?.relatedProgramSlug ?? ""}
            options={[{ value: "", label: "Tidak ada (CTA tes diagnostik)" }, ...programs.map((p) => ({ value: p.slug, label: `${p.code} – ${p.name}` }))]}
          />
          <TextField
            name="coverImageUrl"
            label="Gambar sampul"
            hint="Path lokal (/images/...) atau URL https."
            defaultValue={article?.coverImageUrl}
            maxLength={500}
          />
          <TextField name="coverImageAlt" label="Alt text gambar" defaultValue={article?.coverImageAlt} maxLength={200} wide />
        </div>
      </fieldset>

      <fieldset>
        <legend>Publikasi</legend>
        <div className="form-grid">
          <Select
            name="status"
            label="Status"
            defaultValue={article?.status ?? "draft"}
            options={[
              { value: "draft", label: "Draf" },
              { value: "published", label: "Terbit" },
            ]}
          />
          <TextField
            name="publishedAt"
            label="Tanggal terbit (WIB)"
            type="datetime-local"
            hint="Kosongkan untuk memakai waktu saat diterbitkan. Tanggal di masa depan = terjadwal."
            defaultValue={toLocalInput(article?.publishedAt)}
          />
        </div>
      </fieldset>

      <div className="admin-actions">
        <SubmitButton>Simpan</SubmitButton>
        {article?.status === "published" && (
          <a className="button button--light" href={`/artikel/${article.slug}`} target="_blank" rel="noopener">
            Lihat halaman ↗
          </a>
        )}
      </div>
    </AdminForm>
  );
}

/** Slug input with a helper that derives the slug from the title. */
function SlugField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="field field--wide">
      <TextField
        name="slug"
        label="Slug URL"
        hint="Huruf kecil, angka, tanda hubung. Jangan ubah slug artikel yang sudah meranking — jika diubah, redirect 301 dibuat otomatis."
        defaultValue={defaultValue}
        maxLength={120}
        required
      />
      <button
        type="button"
        className="button button--plain button--small"
        style={{ justifySelf: "start" }}
        onClick={(e) => {
          const form = e.currentTarget.closest("form");
          const title = form?.querySelector<HTMLInputElement>('input[name="title"]')?.value ?? "";
          const slug = form?.querySelector<HTMLInputElement>('input[name="slug"]');
          if (slug && title) slug.value = slugify(title);
        }}
      >
        Buat slug dari judul
      </button>
    </div>
  );
}
