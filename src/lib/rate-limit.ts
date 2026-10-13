import "server-only";
import { lt, sql } from "drizzle-orm";
import { getDb, schema } from "./db";

/**
 * Fixed-window rate limiter backed by Postgres, so limits hold across
 * multiple app instances. Returns whether the request is allowed.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const db = getDb();
  const interval = `${Math.max(1, Math.floor(windowSeconds))} seconds`;
  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - ${interval}::interval THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - ${interval}::interval THEN now() ELSE rate_limits.window_start END
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count ?? 1);

  // Opportunistic cleanup of stale windows (~1% of calls).
  if (Math.random() < 0.01) {
    await db
      .delete(schema.rateLimits)
      .where(lt(schema.rateLimits.windowStart, sql`now() - interval '1 day'`))
      .catch(() => undefined);
  }

  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function resetRateLimit(key: string): Promise<void> {
  await getDb().execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
}
