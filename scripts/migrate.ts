import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, getDb } from "../src/lib/db";
import { loadEnv } from "./env";

loadEnv();

async function main() {
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  console.log("✓ Migrasi database selesai");
}

main()
  .catch((error) => {
    console.error("✗ Migrasi gagal:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
