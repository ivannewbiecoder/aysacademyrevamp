import type { Metadata } from "next";
import { redirectOrNotFound } from "@/lib/missing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

type Props = { params: Promise<{ path: string[] }> };

/**
 * Catch-all for URLs no other route handles (old WordPress paths, typos).
 * Looks the path up in the admin-managed redirect table, otherwise 404.
 * Returning a real 404 here (instead of 200 for any slug, as the old site did)
 * stops duplicate "soft" pages from being indexed.
 */
export default async function CatchAllPage({ params }: Props) {
  const { path } = await params;
  const joined = `/${path.map((segment) => encodeURIComponent(decodeSafe(segment))).join("/")}`;
  return redirectOrNotFound(joined);
}

function decodeSafe(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
