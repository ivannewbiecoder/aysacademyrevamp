import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/** Minimal shape of a post from the WordPress REST API (`/wp-json/wp/v2/posts?_embed=1`). */
export type WpPost = {
  id: number;
  slug: string;
  link?: string;
  status?: string;
  date_gmt?: string;
  modified_gmt?: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  categories?: number[];
  yoast_head_json?: { title?: string; description?: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string; alt_text?: string }[];
    "wp:term"?: { taxonomy?: string; slug?: string; name?: string }[][];
    author?: { name?: string }[];
  };
};

export type ImportedArticle = {
  slug: string;
  type: "artikel" | "berita";
  title: string;
  excerpt: string;
  content: string;
  subject: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  authorName: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  /** Old permalink path when it differs from /artikel/{slug}. */
  legacyPath: string | null;
  /** Absolute image URLs referenced by the article (for optional download). */
  images: string[];
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

let turndown: TurndownService | undefined;
function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
    turndown.use(gfm);
    turndown.remove(["script", "style", "iframe", "noscript", "form", "button", "input", "svg"] as never);
  }
  return turndown;
}

export function htmlToMarkdown(html: string): string {
  // Drop WordPress block comments and empty paragraphs before conversion.
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<p>\s*(&nbsp;)?\s*<\/p>/g, "");
  return getTurndown()
    .turndown(cleaned)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SUBJECT_KEYWORDS: [string, RegExp][] = [
  ["matematika", /\bmatematika|\bmtk\b|\bimo\b/i],
  ["biologi", /\bbiologi|\bibo\b|\bobi\b/i],
  ["fisika", /\bfisika|\bipho\b|\bapho\b/i],
  ["kimia", /\bkimia|\bicho\b/i],
  ["informatika", /\binformatika|\bioi\b|\bkomputer/i],
  ["ipa", /\bipa\b|\bijso\b/i],
];

export function guessSubject(title: string): string | null {
  return SUBJECT_KEYWORDS.find(([, re]) => re.test(title))?.[0] ?? null;
}

function termNames(post: WpPost): string[] {
  return (post._embedded?.["wp:term"] ?? []).flat().map((t) => `${t.slug ?? ""} ${t.name ?? ""}`.toLowerCase());
}

export function convertWpPost(post: WpPost): ImportedArticle {
  const title = htmlToText(post.title.rendered);
  const content = htmlToMarkdown(post.content.rendered);
  const isNews = termNames(post).some((t) => /berita|news|pengumuman/.test(t));
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  let slug = post.slug;
  try {
    slug = decodeURIComponent(post.slug);
  } catch {
    // keep raw slug
  }
  let legacyPath: string | null = null;
  if (post.link) {
    try {
      const path = new URL(post.link).pathname.replace(/\/+$/, "");
      if (path && path !== `/artikel/${slug}`) legacyPath = path;
    } catch {
      legacyPath = null;
    }
  }
  const images = [
    ...new Set([...content.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g)].map((m) => m[1]).concat(media?.source_url ? [media.source_url] : [])),
  ];

  return {
    slug,
    type: isNews ? "berita" : "artikel",
    title,
    excerpt: htmlToText(post.excerpt?.rendered ?? "").replace(/\s*\[…\]$|\s*\[&hellip;\]$/, "").slice(0, 400),
    content,
    subject: isNews ? null : guessSubject(title),
    coverImageUrl: media?.source_url ?? null,
    coverImageAlt: media?.alt_text || null,
    authorName: post._embedded?.author?.[0]?.name ?? null,
    seoTitle: post.yoast_head_json?.title ? decodeEntities(post.yoast_head_json.title).slice(0, 70) : null,
    seoDescription: post.yoast_head_json?.description ? decodeEntities(post.yoast_head_json.description).slice(0, 170) : null,
    publishedAt: post.date_gmt ? new Date(`${post.date_gmt}Z`) : null,
    updatedAt: post.modified_gmt ? new Date(`${post.modified_gmt}Z`) : null,
    legacyPath,
    images,
  };
}
