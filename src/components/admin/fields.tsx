"use client";

import { useFormErrors } from "./AdminForm";

type Base = { name: string; label: string; hint?: string; wide?: boolean; required?: boolean };

function Wrapper({ name, label, hint, wide, children }: Base & { children: React.ReactNode }) {
  const { errors } = useFormErrors();
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span>{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
      {errors[name] && (
        <span className="field-error" id={`${name}-error`}>
          {errors[name]}
        </span>
      )}
    </label>
  );
}

function aria(name: string, errors: Record<string, string>) {
  return errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};
}

export function TextField({
  defaultValue,
  type = "text",
  maxLength,
  placeholder,
  autoComplete,
  ...base
}: Base & {
  defaultValue?: string | number | null;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  const { errors } = useFormErrors();
  return (
    <Wrapper {...base}>
      <input
        name={base.name}
        type={type}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={base.required}
        {...aria(base.name, errors)}
      />
    </Wrapper>
  );
}

export function TextArea({
  defaultValue,
  rows = 4,
  code,
  ...base
}: Base & { defaultValue?: string | null; rows?: number; code?: boolean }) {
  const { errors } = useFormErrors();
  return (
    <Wrapper {...base} wide>
      <textarea
        name={base.name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className={code ? "code" : undefined}
        spellCheck={!code}
        {...aria(base.name, errors)}
      />
    </Wrapper>
  );
}

export function Select({
  defaultValue,
  options,
  ...base
}: Base & { defaultValue?: string | null; options: readonly { value: string; label: string }[] }) {
  const { errors } = useFormErrors();
  return (
    <Wrapper {...base}>
      <select name={base.name} defaultValue={defaultValue ?? ""} {...aria(base.name, errors)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="checkbox">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
