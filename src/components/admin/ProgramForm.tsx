"use client";

import { saveProgram } from "@/app/admin/actions";
import type { Program } from "@/lib/db/schema";
import { faqToText } from "@/lib/validation";
import { AdminForm, SubmitButton } from "./AdminForm";
import { Checkbox, Select, TextArea, TextField } from "./fields";

const ACCENTS = [
  { value: "biology", label: "Biologi (hijau)" },
  { value: "physics", label: "Fisika (biru)" },
  { value: "chemistry", label: "Kimia (oranye)" },
  { value: "math", label: "Matematika (ungu)" },
  { value: "informatics", label: "Informatika" },
  { value: "geography", label: "Geografi" },
  { value: "economics", label: "Ekonomi" },
  { value: "science", label: "IPA terpadu" },
];

export function ProgramForm({ program }: { program?: Program }) {
  return (
    <AdminForm action={saveProgram}>
      {program && <input type="hidden" name="id" value={program.id} />}
      <fieldset>
        <legend>Program</legend>
        <div className="form-grid">
          {program ? (
            <p className="field">
              <span>Slug URL</span>/program/{program.slug}
              <span className="hint">Slug program tidak bisa diubah agar URL yang terindeks tetap aman.</span>
            </p>
          ) : (
            <TextField name="slug" label="Slug URL" hint="Contoh: biotrac. Tidak bisa diubah setelah dibuat." required maxLength={60} />
          )}
          <TextField name="code" label="Kode program" defaultValue={program?.code} hint="Contoh: MATHRAC SMA" required />
          <TextField name="name" label="Nama bidang" defaultValue={program?.name} hint="Contoh: Matematika SMA" required />
          <Select
            name="level"
            label="Jenjang"
            defaultValue={program?.level ?? "SMA"}
            options={[
              { value: "SMA", label: "SMA" },
              { value: "SMP", label: "SMP" },
            ]}
          />
          <Select name="accent" label="Warna & ikon" defaultValue={program?.accent ?? "science"} options={ACCENTS} />
          <TextField name="sortOrder" label="Urutan" type="number" defaultValue={program?.sortOrder ?? 0} />
          <TextField name="summary" label="Ringkasan topik" defaultValue={program?.summary} hint="Dipisah ' · '" wide required />
          <TextArea
            name="intro"
            label="Paragraf pembuka (opsional)"
            defaultValue={program?.intro}
            hint="Kosongkan untuk teks otomatis dari ringkasan topik."
          />
          <TextArea
            name="topics"
            label="Materi per kelas Fundamental"
            defaultValue={program?.topics.join("\n")}
            hint="Satu topik per baris, berurutan."
            rows={12}
          />
          <TextArea
            name="faq"
            label="FAQ program"
            defaultValue={program ? faqToText(program.faq) : ""}
            hint={'Format: "T: ..." lalu "J: ...", blok dipisah baris kosong. Kosongkan untuk FAQ bawaan.'}
            rows={8}
          />
          <Checkbox name="published" label="Tampilkan program di situs" defaultChecked={program?.published ?? true} />
        </div>
      </fieldset>
      <fieldset>
        <legend>SEO</legend>
        <div className="form-grid">
          <TextField
            name="seoTitle"
            label="Title tag"
            defaultValue={program?.seoTitle}
            hint="Target keyword komersial, mis. 'Bimbel OSN Biologi SMA Online – BIOTRAC'. ≤ 60 karakter."
            maxLength={70}
            wide
          />
          <TextArea name="seoDescription" label="Meta description" defaultValue={program?.seoDescription} rows={2} hint="≤ 155 karakter." />
        </div>
      </fieldset>
      <div className="admin-actions">
        <SubmitButton>Simpan program</SubmitButton>
        {program && (
          <a className="button button--light" href={`/program/${program.slug}`} target="_blank" rel="noopener">
            Lihat halaman ↗
          </a>
        )}
      </div>
    </AdminForm>
  );
}
