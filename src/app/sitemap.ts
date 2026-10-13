import type { MetadataRoute } from "next";
import { BANK_SUBJECTS } from "@/content/site";
import { getSitemapData } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/program", priority: 0.9, changeFrequency: "monthly" },
  { path: "/soal-osn", priority: 0.9, changeFrequency: "weekly" },
  { path: "/artikel", priority: 0.8, changeFrequency: "daily" },
  { path: "/berita", priority: 0.7, changeFrequency: "daily" },
  { path: "/diagnostik", priority: 0.8, changeFrequency: "monthly" },
  { path: "/konsultasi", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tryout", priority: 0.5, changeFrequency: "monthly" },
  { path: "/kebijakan-privasi", priority: 0.2, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const latestSetBySubject = new Map<string, string>();
  for (const set of data.sets) {
    const current = latestSetBySubject.get(set.subjectSlug);
    if (!current || set.updatedAt > current) latestSetBySubject.set(set.subjectSlug, set.updatedAt);
  }

  return [
    ...STATIC_PATHS.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: p.changeFrequency, priority: p.priority })),
    ...data.programs.map((p) => ({
      url: absoluteUrl(`/program/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...BANK_SUBJECTS.map((s) => ({
      url: absoluteUrl(`/soal-osn/${s.slug}`),
      lastModified: latestSetBySubject.get(s.slug),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...data.sets.map((s) => ({
      url: absoluteUrl(`/soal-osn/${s.subjectSlug}/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...data.articles.map((a) => ({
      url: absoluteUrl(`/artikel/${a.slug}`),
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
