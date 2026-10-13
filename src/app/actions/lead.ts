"use server";

import { headers } from "next/headers";
import { getDb, schema } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders, hashIp } from "@/lib/request";
import { fieldErrors, leadSchema } from "@/lib/validation";

export type LeadFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; errors?: Record<string, string> };

const MIN_FILL_MS = 2500;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  // Bot traps: hidden honeypot field and a minimum time on the form.
  const honeypot = String(formData.get("website") ?? "");
  const renderedAt = Number(formData.get("t") ?? 0);
  if (honeypot || !renderedAt || Date.now() - renderedAt < MIN_FILL_MS) {
    // Pretend success so bots learn nothing.
    return { status: "success" };
  }

  const env = serverEnv();
  const requestHeaders = await headers();
  const ip = clientIpFromHeaders(requestHeaders, env.TRUSTED_PROXY_COUNT);
  const ipHash = hashIp(ip, env.IP_HASH_SALT);

  const limit = await consumeRateLimit(`lead:${ipHash}`, 5, 600);
  if (!limit.allowed) {
    return { status: "error", message: "Terlalu banyak pengiriman. Coba lagi dalam beberapa menit atau hubungi kami via WhatsApp." };
  }

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    level: formData.get("level"),
    programSlug: formData.get("programSlug") ?? undefined,
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? undefined,
    school: formData.get("school") ?? undefined,
    message: formData.get("message") ?? undefined,
    consent: formData.get("consent"),
    sourcePath: formData.get("sourcePath") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali isian yang ditandai.", errors: fieldErrors(parsed.error) };
  }

  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = String(formData.get(key) ?? "").trim().slice(0, 100);
    if (value) utm[key] = value;
  }

  const lead = parsed.data;
  await getDb()
    .insert(schema.leads)
    .values({ ...lead, utm, ipHash });

  await notifyWebhook(env.LEAD_WEBHOOK_URL, lead.role, lead.level, lead.programSlug);
  return { status: "success" };
}

/** Notify the sales channel without sending personal data outside the database. */
async function notifyWebhook(url: string | undefined, role: string, level: string, program: string | null) {
  if (!url) return;
  const site = (process.env.SITE_URL || "").replace(/\/+$/, "");
  const text = `Lead konsultasi baru: ${role.replace("_", " ")}, jenjang ${level}${program ? `, program ${program}` : ""}. Lihat detail di ${site}/admin/leads`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    console.error("[lead] webhook gagal", error instanceof Error ? error.message : error);
  }
}
