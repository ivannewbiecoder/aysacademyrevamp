import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getDb, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_RENEW_MS = 24 * 60 * 60 * 1000; // renew at most once per day of activity

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-ays_admin" : "ays_admin";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const db = getDb();
  await db.insert(schema.sessions).values({ idHash: hashToken(token), userId, expiresAt, userAgent });
  // Clean up this user's expired sessions while we are here.
  await db
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, new Date())));
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

/** Current admin user for this request, or null. Deduplicated per render. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const idHash = hashToken(token);
  const db = getDb();
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(eq(schema.sessions.idHash, idHash), gt(schema.sessions.expiresAt, new Date()), eq(schema.users.active, true)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  // Sliding expiry: extend the session in the DB once a day of use.
  if (row.expiresAt.getTime() - Date.now() < SESSION_TTL_MS - SESSION_RENEW_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.update(schema.sessions).set({ expiresAt }).where(eq(schema.sessions.idHash, idHash));
    try {
      (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
    } catch {
      // Cookies are read-only while rendering Server Components; the DB expiry
      // is authoritative and the cookie is refreshed on the next action.
    }
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(schema.sessions).where(eq(schema.sessions.idHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await getDb().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}
