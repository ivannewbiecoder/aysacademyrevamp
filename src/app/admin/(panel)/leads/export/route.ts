import { desc } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.mustChangePassword || !can(user, "leads:read")) {
    return new Response("Tidak diizinkan", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const rows = await getDb().select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(10_000);
  const csv = toCsv(
    ["id", "tanggal", "nama", "peran", "jenjang", "program", "whatsapp", "email", "sekolah", "pesan", "status", "halaman", "utm_source", "utm_medium", "utm_campaign"],
    rows.map((l) => [
      l.id,
      l.createdAt.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }),
      l.name,
      l.role,
      l.level,
      l.programSlug,
      l.whatsapp,
      l.email,
      l.school,
      l.message,
      l.status,
      l.sourcePath,
      l.utm.utm_source,
      l.utm.utm_medium,
      l.utm.utm_campaign,
    ]),
  );
  await logAudit(user.id, "export", "lead", null, { count: rows.length });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lead-ays-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
