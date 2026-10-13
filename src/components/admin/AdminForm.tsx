"use client";

import { createContext, startTransition, useActionState, useContext, useRef } from "react";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };
export type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const FormContext = createContext<{ errors: Record<string, string>; pending: boolean }>({ errors: {}, pending: false });

export function useFormErrors() {
  return useContext(FormContext);
}

/**
 * Admin form wrapper. Submits through useActionState but via onSubmit, so React
 * does not reset uncontrolled fields when validation fails (long article drafts
 * survive a typo in the slug).
 */
export function AdminForm({
  action,
  children,
  className = "admin-form",
  confirmMessage,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
}) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);

  return (
    <FormContext.Provider value={{ errors: state.errors ?? {}, pending }}>
      <form
        ref={ref}
        className={className}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          const formData = new FormData(event.currentTarget);
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.name) formData.set(submitter.name, submitter.value);
          startTransition(() => dispatch(formData));
        }}
      >
        {state.message && (
          <p className={state.ok ? "flash" : "flash flash--error"} role={state.ok ? "status" : "alert"}>
            {state.message}
          </p>
        )}
        {children}
      </form>
    </FormContext.Provider>
  );
}

export function SubmitButton({
  children,
  className = "button",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormErrors();
  return (
    <button className={className} type="submit" disabled={pending} name={name} value={value}>
      {pending ? "Menyimpan…" : children}
    </button>
  );
}
