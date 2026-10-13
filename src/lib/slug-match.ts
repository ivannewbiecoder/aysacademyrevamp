/**
 * Fuzzy matching for mangled article slugs.
 *
 * Search Console shows dozens of broken variants of real slugs, e.g.
 *   silabus-osn-matematika-2026-materi-lengkap-for-sd-smp-and-sma
 *   silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-dan-sma
 *   silabus-osi-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma
 * (often produced by AI assistants rewriting URLs). Instead of serving 200 for
 * any slug (duplicate content) or a hard 404 (lost link equity), we 301 to the
 * real article when the match is unambiguous.
 */

const SYNONYMS: Record<string, string> = {
  for: "untuk",
  and: "dan",
  of: "dari",
  guide: "panduan",
  complete: "lengkap",
  material: "materi",
  materials: "materi",
  syllabus: "silabus",
  math: "matematika",
  mathematics: "matematika",
  biology: "biologi",
  physics: "fisika",
  chemistry: "kimia",
  how: "cara",
  to: "",
  the: "",
  a: "",
};

export function slugTokens(slug: string): string[] {
  const tokens = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => SYNONYMS[t] ?? t)
    .filter(Boolean);
  // Drop immediate duplicates ("dan-dan").
  return tokens.filter((t, i) => t !== tokens[i - 1]);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function tokensEqual(a: string, b: string): boolean {
  if (a === b) return true;
  // Allow a single-character typo in words of 3+ letters (osn/osi), never in numbers (2025/2026).
  if (/\d/.test(a) || /\d/.test(b)) return false;
  return Math.min(a.length, b.length) >= 3 && levenshtein(a, b) <= 1;
}

/** Similarity in [0,1]: greedy token matching, normalised by the larger token count. */
export function slugSimilarity(a: string, b: string): number {
  const ta = slugTokens(a);
  const tb = slugTokens(b);
  if (!ta.length || !tb.length) return 0;
  const used = new Set<number>();
  let matches = 0;
  for (const token of ta) {
    const idx = tb.findIndex((candidate, i) => !used.has(i) && tokensEqual(token, candidate));
    if (idx >= 0) {
      used.add(idx);
      matches++;
    }
  }
  return matches / Math.max(ta.length, tb.length);
}

export const MIN_SIMILARITY = 0.85;
const MIN_MARGIN = 0.1;
const MIN_TOKENS = 4;

function numericTokens(slug: string): string {
  return slugTokens(slug)
    .filter((t) => /^\d+$/.test(t))
    .sort()
    .join(",");
}

/** Best unambiguous candidate for a broken slug, or null. */
export function findSimilarSlug(requested: string, candidates: readonly string[]): string | null {
  if (slugTokens(requested).length < MIN_TOKENS) return null;
  const numbers = numericTokens(requested);
  let best: { slug: string; score: number } | null = null;
  let second = 0;
  for (const slug of candidates) {
    if (slug === requested) continue;
    // Years and numbers must match exactly: "...-2027" must never land on "...-2026".
    if (numericTokens(slug) !== numbers) continue;
    const score = slugSimilarity(requested, slug);
    if (!best || score > best.score) {
      second = best?.score ?? 0;
      best = { slug, score };
    } else if (score > second) {
      second = score;
    }
  }
  if (!best || best.score < MIN_SIMILARITY || best.score - second < MIN_MARGIN) return null;
  return best.slug;
}

/** Canonical form of an incoming path for redirect lookups. */
export function normalizePath(path: string): string {
  let p = path.split(/[?#]/)[0] || "/";
  try {
    p = decodeURI(p);
  } catch {
    // keep raw path when it contains malformed escapes
  }
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p.startsWith("/") ? p : `/${p}`;
}
