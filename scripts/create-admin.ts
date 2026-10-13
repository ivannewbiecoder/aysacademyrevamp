import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "../src/lib/auth/password";
import { closeDb, getDb, schema } from "../src/lib/db";
import { arg, loadEnv } from "./env";

loadEnv();

/**
 * Create (or reset) an admin account and print a one-time password.
 *   npm run admin:create -- --email nama@aysacademy.id --name "Nama" [--role admin|editor|mentor]
 */
async function main() {
  const input = z
    .object({
      email: z.string().trim().toLowerCase().pipe(z.email()),
      name: z.string().trim().min(2),
      role: z.enum(["admin", "editor", "mentor"]).default("admin"),
    })
    .parse({ email: arg("email"), name: arg("name"), role: arg("role") || undefined });

  const password = randomBytes(12).toString("base64url") + "9a";
  const passwordHash = await hashPassword(password);
  const db = getDb();
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, input.email));
  if (existing.length) {
    await db.update(schema.users).set({ passwordHash, role: input.role, active: true, name: input.name }).where(eq(schema.users.email, input.email));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, existing[0].id));
    console.log(`✓ Akun ${input.email} sudah ada; password direset dan sesi lama dikeluarkan.`);
  } else {
    await db.insert(schema.users).values({ ...input, passwordHash });
    console.log(`✓ Akun ${input.role} ${input.email} dibuat.`);
  }
  console.log(`  Password sementara (tampil sekali): ${password}`);
  console.log("  Segera ganti di /admin/akun setelah masuk.");
}

main()
  .catch((error) => {
    console.error("✗ Gagal:", error instanceof z.ZodError ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : error);
    console.error('  Pemakaian: npm run admin:create -- --email nama@aysacademy.id --name "Nama" --role admin');
    process.exitCode = 1;
  })
  .finally(closeDb);
