import { z } from "zod";

/**
 * Server-side environment, validated lazily on first use so `next build`
 * does not require production secrets to be present.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SITE_URL: z.string().url().default("https://aysacademy.id"),
  /** Salt used to hash visitor IPs for rate limiting / abuse review. */
  IP_HASH_SALT: z.string().min(16, "IP_HASH_SALT minimal 16 karakter"),
  /** Number of reverse proxies in front of the app (for X-Forwarded-For). */
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).max(5).default(1),
  /** Optional HTTPS webhook (Slack/Google Chat/etc) notified on each new lead. */
  LEAD_WEBHOOK_URL: z.string().url().startsWith("https://").optional().or(z.literal("")),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Konfigurasi environment tidak valid: ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Public site URL without trailing slash. Safe to call at build time. */
export function siteUrl(): string {
  return (process.env.SITE_URL || "https://aysacademy.id").replace(/\/+$/, "");
}
