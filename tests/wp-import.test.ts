import { describe, expect, it } from "vitest";
import { convertWpPost, decodeEntities, guessSubject, type WpPost } from "@/lib/wp-import";

const post: WpPost = {
  id: 42,
  slug: "silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma",
  link: "https://aysacademy.id/artikel/silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma/",
  date_gmt: "2026-01-10T03:00:00",
  modified_gmt: "2026-09-01T08:30:00",
  title: { rendered: "Silabus OSN Matematika 2026: Materi Lengkap untuk SD, SMP &#038; SMA" },
  content: {
    rendered:
      '<!-- wp:heading --><h2>Silabus SD</h2><!-- /wp:heading --><p>Topik &amp; contoh.</p><p></p><script>alert(1)</script>' +
      '<table><thead><tr><th>Bidang</th><th>Topik</th></tr></thead><tbody><tr><td>Aljabar</td><td>Persamaan</td></tr></tbody></table>' +
      '<p><img src="https://aysacademy.id/wp-content/uploads/2026/01/silabus.png" alt="Silabus"></p>',
  },
  excerpt: { rendered: "<p>Ringkasan silabus [&hellip;]</p>" },
  yoast_head_json: { title: "Silabus OSN Matematika 2026 &#8211; AYS", description: "Daftar materi OSN matematika." },
  _embedded: {
    "wp:featuredmedia": [{ source_url: "https://aysacademy.id/wp-content/uploads/2026/01/cover.webp", alt_text: "Sampul" }],
    "wp:term": [[{ taxonomy: "category", slug: "artikel", name: "Artikel" }]],
    author: [{ name: "Tim AYS" }],
  },
};

describe("convertWpPost", () => {
  const a = convertWpPost(post);

  it("keeps the exact slug so the indexed URL survives migration", () => {
    expect(a.slug).toBe(post.slug);
    expect(a.legacyPath).toBeNull();
  });

  it("converts HTML to safe markdown", () => {
    expect(a.content).toContain("## Silabus SD");
    expect(a.content).toContain("| Bidang | Topik |");
    expect(a.content).not.toContain("<script");
    expect(a.content).not.toContain("wp:heading");
    expect(a.images).toContain("https://aysacademy.id/wp-content/uploads/2026/01/silabus.png");
    expect(a.images).toContain("https://aysacademy.id/wp-content/uploads/2026/01/cover.webp");
  });

  it("maps metadata", () => {
    expect(a.title).toBe("Silabus OSN Matematika 2026: Materi Lengkap untuk SD, SMP & SMA");
    expect(a.excerpt).toBe("Ringkasan silabus");
    expect(a.seoTitle).toBe("Silabus OSN Matematika 2026 – AYS");
    expect(a.type).toBe("artikel");
    expect(a.subject).toBe("matematika");
    expect(a.publishedAt?.toISOString()).toBe("2026-01-10T03:00:00.000Z");
    expect(a.updatedAt?.toISOString()).toBe("2026-09-01T08:30:00.000Z");
    expect(a.authorName).toBe("Tim AYS");
    expect(a.coverImageAlt).toBe("Sampul");
  });

  it("detects news posts and records old permalinks", () => {
    const news = convertWpPost({
      ...post,
      slug: "pendaftaran-osn-2026-dibuka",
      link: "https://aysacademy.id/2026/02/pendaftaran-osn-2026-dibuka/",
      _embedded: { "wp:term": [[{ slug: "berita", name: "Berita" }]] },
    });
    expect(news.type).toBe("berita");
    expect(news.subject).toBeNull();
    expect(news.legacyPath).toBe("/2026/02/pendaftaran-osn-2026-dibuka");
  });
});

describe("helpers", () => {
  it("decodes entities", () => {
    expect(decodeEntities("A &amp; B &#8211; C &#x2014; &hellip;")).toBe("A & B – C — …");
  });
  it("guesses subject from title", () => {
    expect(guessSubject("Pembahasan Soal IPhO 2024")).toBe("fisika");
    expect(guessSubject("Cara Lolos OSN dari Nol")).toBeNull();
  });
});
