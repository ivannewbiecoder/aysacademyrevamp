import { createHash } from "node:crypto";

/**
 * Resolve the client IP from X-Forwarded-For, trusting exactly
 * `trustedProxyCount` hops. Spoofed left-most entries are ignored.
 */
export function clientIpFromHeaders(headers: Headers, trustedProxyCount: number): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded && trustedProxyCount > 0) {
    const hops = forwarded
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const candidate = hops[hops.length - trustedProxyCount];
    if (candidate) return candidate;
  }
  // X-Real-IP is only trustworthy when a reverse proxy overwrites it.
  if (trustedProxyCount > 0) return headers.get("x-real-ip")?.trim() || "unknown";
  return "unknown";
}

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
