import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __aysPool?: Pool; __aysDb?: Db };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur.");
  }
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Guard against runaway queries tying up the pool.
    statement_timeout: 10_000,
  });
}

/** Lazily-created singleton so importing this module never opens a connection. */
export function getDb(): Db {
  if (!globalForDb.__aysDb) {
    globalForDb.__aysPool ??= createPool();
    globalForDb.__aysDb = drizzle({ client: globalForDb.__aysPool, schema });
  }
  return globalForDb.__aysDb;
}

export async function closeDb(): Promise<void> {
  await globalForDb.__aysPool?.end();
  globalForDb.__aysPool = undefined;
  globalForDb.__aysDb = undefined;
}

export { schema };
