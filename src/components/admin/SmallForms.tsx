"use client";

import { changeOwnPassword, createUser, saveRedirect } from "@/app/admin/actions";
import { AdminForm, SubmitButton } from "./AdminForm";
import { Select, TextField } from "./fields";

export function RedirectForm() {
  return (
    <AdminForm action={saveRedirect}>
      <fieldset>
        <legend>Tambah / ubah redirect 301</legend>
        <div className="form-grid">
          <TextField name="fromPath" label="Dari path" placeholder="/list-program" hint="Path lama tanpa domain dan tanpa query." required />
          <TextField name="toPath" label="Ke" placeholder="/program" hint="Path baru (/...) atau URL https." required />
          <TextField name="note" label="Catatan" placeholder="Contoh: URL lama WordPress dari GSC" wide />
        </div>
      </fieldset>
      <SubmitButton>Simpan redirect</SubmitButton>
    </AdminForm>
  );
}

export function CreateUserForm() {
  return (
    <AdminForm action={createUser}>
      <fieldset>
        <legend>Tambah pengguna</legend>
        <div className="form-grid">
          <TextField name="name" label="Nama" required />
          <TextField name="email" label="Email" type="email" required />
          <Select
            name="role"
            label="Peran"
            defaultValue="editor"
            options={[
              { value: "editor", label: "Editor – kelola artikel, program, soal, lead" },
              { value: "mentor", label: "Mentor – tulis & cek soal, terbitkan set" },
              { value: "admin", label: "Admin – semua akses termasuk pengguna" },
            ]}
          />
        </div>
      </fieldset>
      <SubmitButton>Buat akun</SubmitButton>
    </AdminForm>
  );
}

export function ChangePasswordForm() {
  return (
    <AdminForm action={changeOwnPassword}>
      <fieldset>
        <legend>Ganti password</legend>
        <div className="form-grid">
          <TextField name="current" label="Password saat ini" type="password" autoComplete="current-password" wide />
          <TextField name="next" label="Password baru" type="password" autoComplete="new-password" hint="Minimal 12 karakter, berisi huruf dan angka." />
          <TextField name="confirm" label="Ulangi password baru" type="password" autoComplete="new-password" />
        </div>
      </fieldset>
      <SubmitButton>Ganti password</SubmitButton>
    </AdminForm>
  );
}
