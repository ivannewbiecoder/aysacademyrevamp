import "server-only";
import { notFound, permanentRedirect } from "next/navigation";
import { findRedirect } from "./content";
import { findSimilarSlug, normalizePath } from "./slug-match";

/**
 * Called when a route has no content for the requested path. Tries, in order:
 *  1. a redirect rule from the admin-managed `redirects` table,
 *  2. an unambiguous fuzzy match against known slugs (for mangled URLs),
 * and otherwise renders the 404 page. Redirects are permanent (308).
 */
export async function redirectOrNotFound(
  path: string,
  fuzzy?: { slug: string; candidates: readonly string[]; toPath: (slug: string) => string },
): Promise<never> {
  const normalized = normalizePath(path);
  const target = await findRedirect([normalized, `${normalized}/`, normalized.toLowerCase()]);
  if (target && normalizePath(target) !== normalized) permanentRedirect(target);

  if (fuzzy) {
    const match = findSimilarSlug(fuzzy.slug, fuzzy.candidates);
    if (match) permanentRedirect(fuzzy.toPath(match));
  }
  notFound();
}
