"use client";

import { AdminForm, SubmitButton, type FormAction } from "./AdminForm";

/** One-click admin action (publish, delete, review…) with optional confirmation. */
export function ActionButton({
  action,
  fields,
  label,
  confirm,
  className = "button button--light button--small",
}: {
  action: FormAction;
  fields: Record<string, string | number>;
  label: string;
  confirm?: string;
  className?: string;
}) {
  return (
    <AdminForm action={action} className="inline-form" confirmMessage={confirm}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton className={className}>{label}</SubmitButton>
    </AdminForm>
  );
}
