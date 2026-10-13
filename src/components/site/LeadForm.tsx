"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useSyncExternalStore } from "react";
import { submitLead, type LeadFormState } from "@/app/actions/lead";
import { trackEvent } from "./analytics";

type ProgramOption = { slug: string; code: string; name: string; level: string };

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const noopSubscribe = () => () => {};

export function LeadForm({
  programs,
  defaultProgram,
  sourcePath,
  issuedAt,
}: {
  programs: ProgramOption[];
  defaultProgram?: string;
  sourcePath: string;
  /** Server render time; the action rejects submissions made implausibly fast. */
  issuedAt: number;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, { status: "idle" });
  // Read the query string after hydration only (server snapshot is empty), so markup matches.
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );
  const utm = useMemo(() => {
    const params = new URLSearchParams(search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 100);
    }
    return found;
  }, [search]);

  useEffect(() => {
    if (state.status === "success") trackEvent("generate_lead", { form: "konsultasi" });
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="form-success" role="status">
        <h3>Terima kasih, data sudah kami terima.</h3>
        <p>Tim AYS akan menghubungi melalui WhatsApp dalam 1–2 hari kerja. Sambil menunggu, kamu bisa mengikuti tes diagnostik gratis.</p>
        <Link className="button" href="/diagnostik">
          Ikuti tes diagnostik <span className="arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  // React resets the form after each action; refill from the echoed values and
  // remount (key) so selects and the checkbox are restored too.
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const formKey = state.status === "error" ? (state.attempt ?? 0) : 0;
  const err = (field: string) =>
    errors[field] ? (
      <span className="field-error" id={`${field}-error`}>
        {errors[field]}
      </span>
    ) : null;
  const describedBy = (field: string) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form key={formKey} action={action} className="lead-form" noValidate>
      {state.status === "error" && (
        <p className="form-alert" role="alert">
          {state.message}
        </p>
      )}

      <div className="form-grid">
        <label className="field">
          <span>Nama lengkap</span>
          <input name="name" defaultValue={v.name} autoComplete="name" required maxLength={100} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} />
          {err("name")}
        </label>

        <label className="field">
          <span>Saya adalah</span>
          <select name="role" required defaultValue={v.role ?? ""} aria-invalid={!!errors.role} aria-describedby={describedBy("role")}>
            <option value="" disabled>
              Pilih
            </option>
            <option value="siswa">Siswa</option>
            <option value="orang_tua">Orang tua</option>
            <option value="guru">Guru / pembina olimpiade</option>
            <option value="lainnya">Lainnya</option>
          </select>
          {err("role")}
        </label>

        <label className="field">
          <span>Jenjang siswa</span>
          <select name="level" required defaultValue={v.level ?? ""} aria-invalid={!!errors.level} aria-describedby={describedBy("level")}>
            <option value="" disabled>
              Pilih
            </option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="SD">SD (persiapan SMP)</option>
            <option value="lainnya">Lainnya</option>
          </select>
          {err("level")}
        </label>

        <label className="field">
          <span>Bidang yang diminati</span>
          <select name="programSlug" defaultValue={v.programSlug ?? defaultProgram ?? ""}>
            <option value="">Belum tahu</option>
            {programs.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Nomor WhatsApp</span>
          <input
            name="whatsapp"
            defaultValue={v.whatsapp}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812xxxxxxx"
            required
            maxLength={20}
            aria-invalid={!!errors.whatsapp}
            aria-describedby={describedBy("whatsapp")}
          />
          {err("whatsapp")}
        </label>

        <label className="field">
          <span>
            Email <small>(opsional)</small>
          </span>
          <input name="email" defaultValue={v.email} type="email" autoComplete="email" maxLength={200} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />
          {err("email")}
        </label>

        <label className="field field--wide">
          <span>
            Asal sekolah <small>(opsional)</small>
          </span>
          <input name="school" defaultValue={v.school} autoComplete="organization" maxLength={150} />
        </label>

        <label className="field field--wide">
          <span>
            Pertanyaan atau kebutuhan <small>(opsional)</small>
          </span>
          <textarea name="message" defaultValue={v.message} rows={4} maxLength={1000} />
        </label>
      </div>

      <label className="consent">
        <input type="checkbox" name="consent" defaultChecked={v.consent === "on"} required aria-invalid={!!errors.consent} aria-describedby={describedBy("consent")} />
        <span>
          Saya setuju data ini digunakan tim AYS untuk menghubungi saya terkait konsultasi program, sesuai{" "}
          <Link href="/kebijakan-privasi">kebijakan privasi</Link>.
        </span>
      </label>
      {err("consent")}

      {/* Bot traps: humans never see or fill these. */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="t" value={issuedAt} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      {Object.entries(utm).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <button className="button" type="submit" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim & minta dihubungi"}
      </button>
      <p className="form-note">Kami tidak membagikan data Anda ke pihak lain. Tidak ada biaya untuk konsultasi.</p>
    </form>
  );
}
