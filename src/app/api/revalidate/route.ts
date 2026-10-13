import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  if (secret.length < 24) return false; // disabled unless a strong secret is configured
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Purge the public content cache immediately. Used after bulk changes made
 * outside the admin panel (WordPress import, manual SQL, deploy scripts):
 *   curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" https://aysacademy.id/api/revalidate
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ revalidated: true }, { headers: { "Cache-Control": "no-store" } });
}
