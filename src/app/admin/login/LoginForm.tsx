"use client";

import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { TextField } from "@/components/admin/fields";
import { loginAction } from "../actions";

export function LoginForm() {
  return (
    <AdminForm action={loginAction} className="">
      <TextField name="email" label="Email" type="email" autoComplete="username" required />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
      <SubmitButton>Masuk</SubmitButton>
    </AdminForm>
  );
}
