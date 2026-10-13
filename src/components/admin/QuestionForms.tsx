"use client";

import { saveQuestion, saveQuestionSet } from "@/app/admin/actions";
import { BANK_SUBJECTS, STAGE_LABEL } from "@/content/site";
import type { Question, QuestionSet } from "@/lib/db/schema";
import { AdminForm, SubmitButton } from "./AdminForm";
import { Select, TextArea, TextField } from "./fields";
import { MarkdownField } from "./MarkdownField";

export function QuestionSetForm({ set }: { set?: QuestionSet }) {
  return (
    <AdminForm action={saveQuestionSet}>
      {set && <input type="hidden" name="id" value={set.id} />}
      <fieldset>
        <legend>Set soal</legend>
        <div className="form-grid">
          <Select
            name="subjectSlug"
            label="Bidang"
            defaultValue={set?.subjectSlug ?? "matematika-sma"}
            options={BANK_SUBJECTS.map((s) => ({ value: s.slug, label: `${s.name} (${s.level})` }))}
          />
          <TextField
            name="slug"
            label="Slug"
            defaultValue={set?.slug}
            hint="Contoh: osn-k-2026 atau osp-2024. URL: /soal-osn/[bidang]/[slug]."
            required
          />
          <TextField name="title" label="Judul set" defaultValue={set?.title} hint="Contoh: OSN-K Kimia SMA 2026" wide required />
          <Select
            name="stage"
            label="Tahap"
            defaultValue={set?.stage ?? "osn-k"}
            options={Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <TextField name="year" label="Tahun" type="number" defaultValue={set?.year ?? ""} />
          <TextArea
            name="sourceNote"
            label="Sumber & lisensi"
            hint="Wajib untuk soal pihak lain. Contoh: 'Soal resmi Puspresnas, ditautkan ke dokumen asli; pembahasan ditulis mentor AYS.' Soal IBO berlisensi NC: jangan disalin, cukup tautkan."
            defaultValue={set?.sourceNote}
            rows={2}
          />
        </div>
        <MarkdownField name="description" label="Pengantar set (Markdown)" defaultValue={set?.description} rows={6} />
      </fieldset>
      <fieldset>
        <legend>SEO</legend>
        <div className="form-grid">
          <TextField
            name="seoTitle"
            label="Title tag"
            defaultValue={set?.seoTitle}
            hint="Contoh: Soal OSN-K Kimia SMA 2026 + Pembahasan. ≤ 60 karakter."
            wide
            maxLength={70}
          />
          <TextArea name="seoDescription" label="Meta description" defaultValue={set?.seoDescription} rows={2} />
        </div>
      </fieldset>
      <SubmitButton>{set ? "Simpan set" : "Buat set"}</SubmitButton>
    </AdminForm>
  );
}

export function QuestionForm({ setId, question, nextNumber }: { setId: number; question?: Question; nextNumber?: number }) {
  return (
    <AdminForm action={saveQuestion}>
      <input type="hidden" name="setId" value={setId} />
      {question && <input type="hidden" name="id" value={question.id} />}
      {question?.mentorReviewed && (
        <p className="flash">Soal ini sudah dicek mentor. Mengubah isi soal, pilihan, jawaban, atau pembahasan akan mereset status cek mentor.</p>
      )}
      <fieldset>
        <legend>Soal</legend>
        <div className="form-grid">
          <TextField name="number" label="Nomor" type="number" defaultValue={question?.number ?? nextNumber ?? 1} required />
        </div>
        <MarkdownField name="body" label="Isi soal (Markdown + rumus $...$)" defaultValue={question?.body} rows={10} />
        <TextArea
          name="choices"
          label="Pilihan jawaban (opsional)"
          hint="Satu pilihan per baris, diawali huruf: 'A. 12' atau 'B) $\sqrt{2}$'. Kosongkan untuk soal isian/esai."
          defaultValue={question?.choices.map((c) => `${c.label}. ${c.text}`).join("\n")}
          rows={5}
        />
        <TextField name="answer" label="Kunci jawaban" defaultValue={question?.answer} wide />
        <MarkdownField name="explanation" label="Pembahasan (Markdown)" defaultValue={question?.explanation} rows={12} />
      </fieldset>
      <SubmitButton>Simpan soal</SubmitButton>
    </AdminForm>
  );
}
