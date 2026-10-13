import type { Metadata } from "next";
import { ORG } from "@/content/site";
import { siteUrl } from "./env";

const BRAND_SUFFIX = " | AYS Science Academy";
const TITLE_LIMIT = 60;

/** Append the brand only when the full title still fits Google's ~60 char display. */
export function titleWithBrand(title: string): string {
  return title.length + BRAND_SUFFIX.length <= TITLE_LIMIT ? `${title}${BRAND_SUFFIX}` : title;
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalized}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Use the title exactly as given (already optimised by the SEO team). */
  exactTitle?: boolean;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  noindex?: boolean;
};

export function pageMetadata(input: PageMetaInput): Metadata {
  const title = input.exactTitle ? input.title : titleWithBrand(input.title);
  const url = absoluteUrl(input.path);
  // Without an explicit image, the opengraph-image file convention supplies one.
  const images = input.image ? [{ url: absoluteUrl(input.image) }] : undefined;
  return {
    title: { absolute: title },
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: input.type ?? "website",
      url,
      title,
      description: input.description,
      siteName: ORG.name,
      locale: "id_ID",
      ...(images ? { images } : {}),
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD builders (schema.org)
// ---------------------------------------------------------------------------

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${siteUrl()}/#organization`,
    name: ORG.name,
    legalName: ORG.legalName,
    url: siteUrl(),
    logo: absoluteUrl("/images/ays-logo-600.png"),
    foundingDate: String(ORG.foundingYear),
    email: ORG.email,
    telephone: `+${ORG.whatsappNumber}`,
    sameAs: [ORG.instagram],
    address: {
      "@type": "PostalAddress",
      streetAddress: ORG.address.street,
      addressLocality: ORG.address.locality,
      addressRegion: ORG.address.region,
      postalCode: ORG.address.postalCode,
      addressCountry: ORG.address.country,
    },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    url: siteUrl(),
    name: ORG.name,
    inLanguage: "id-ID",
    publisher: { "@id": `${siteUrl()}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faq: readonly { q: string; a: string }[]): JsonLd | null {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function articleJsonLd(a: {
  type: "artikel" | "berita";
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": a.type === "berita" ? "NewsArticle" : "Article",
    headline: a.title.slice(0, 110),
    description: a.description,
    mainEntityOfPage: absoluteUrl(a.path),
    image: [absoluteUrl(a.image || "/images/ays-logo-600.png")],
    datePublished: a.publishedAt ?? undefined,
    dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
    inLanguage: "id-ID",
    author: a.authorName
      ? { "@type": "Person", name: a.authorName }
      : { "@type": "Organization", name: ORG.name, url: siteUrl() },
    publisher: { "@id": `${siteUrl()}/#organization` },
  };
}

export function courseJsonLd(p: { name: string; code: string; description: string; path: string; level: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${p.code} – Pelatihan OSN ${p.name}`,
    description: p.description,
    url: absoluteUrl(p.path),
    inLanguage: "id-ID",
    educationalLevel: p.level,
    provider: { "@id": `${siteUrl()}/#organization`, "@type": "EducationalOrganization", name: ORG.name },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "P3M",
    },
    offers: {
      "@type": "Offer",
      category: "Paid",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(p.path),
    },
  };
}

/** Serialize JSON-LD for a <script> tag without allowing `</script>` breakouts. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  const LINE_SEPARATOR = String.fromCharCode(0x2028);
  const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .split(LINE_SEPARATOR)
    .join("\\u2028")
    .split(PARAGRAPH_SEPARATOR)
    .join("\\u2029");
}
