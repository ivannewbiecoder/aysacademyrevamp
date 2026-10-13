import { lt, sql } from "drizzle-orm";
import { closeDb, getDb, schema } from "../src/lib/db";
import { arg, flag, loadEnv } from "./env";

loadEnv();

/**
 * Data minimisation: delete consultation leads older than N months (default 12).
 * Leads often belong to minors; keep only what sales still needs.
 *   npm run leads:purge -- --months 12           # dry run
 *   npm run leads:purge -- --months 12 --write   # delete
 */
async function main() {
  const months = Number(arg("months") || 12);
  if (!Number.isInteger(months) || months < 1) throw new Error("--months harus bilangan bulat ≥ 1");
  const cutoff = sql`now() - make_interval(months => ${months})`;
  const db = getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(schema.leads).where(lt(schema.leads.createdAt, cutoff));
  console.log(`${n} lead lebih tua dari ${months} bulan.`);
  if (!flag("write")) return console.log("Dry run: tambahkan --write untuk menghapus.");
  await db.delete(schema.leads).where(lt(schema.leads.createdAt, cutoff));
  await db.insert(schema.auditLog).values({ action: "purge", entity: "lead", detail: { months, count: n } });
  console.log(`✓ ${n} lead dihapus.`);
}

main()
  .catch((error) => {
    console.error("✗ Gagal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
