import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/slug";
import { findSimilarSlug, normalizePath, slugSimilarity } from "@/lib/slug-match";

const MONEY = "silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma";
const OTHERS = [
  MONEY,
  "cara-lolos-osn-dari-nol-panduan-lengkap-untuk-smp-sma",
  "cara-belajar-osn-dari-nol-untuk-pemula-panduan-lengkap-praktis",
  "silabus-osn-matematika-2025-materi-lengkap-untuk-sd-smp-dan-sma",
];

describe("slugify", () => {
  it("creates clean Indonesian slugs", () => {
    expect(slugify("Silabus OSN 2026: Semua Jenjang & Bidang!")).toBe("silabus-osn-2026-semua-jenjang-dan-bidang");
    expect(slugify("  Café   Ilmiah  ")).toBe("cafe-ilmiah");
  });
  it("truncates on a word boundary", () => {
    const slug = slugify("a ".repeat(10) + "panjang ".repeat(30), 60);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
  it("validates slugs", () => {
    expect(isValidSlug(MONEY)).toBe(true);
    expect(isValidSlug("Ada-Huruf-Besar")).toBe(false);
    expect(isValidSlug("../etc/passwd")).toBe(false);
    expect(isValidSlug("dobel--strip")).toBe(false);
  });
});

describe("findSimilarSlug (mangled URLs from Search Console)", () => {
  it.each([
    "silabus-osn-matematika-2026-materi-lengkap-for-sd-smp-and-sma",
    "silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-dan-dan-sma",
    "silabus-osi-matematika-2026-materi-lengkap-untuk-sd-smp-dan-sma",
    "silabus-osn-matematika-2026-materi-lengkap-untuk-sd-smp-sma",
  ])("redirects %s to the real article", (broken) => {
    expect(findSimilarSlug(broken, OTHERS)).toBe(MONEY);
  });

  it("never confuses different years", () => {
    expect(slugSimilarity("silabus-osn-matematika-2027-materi", "silabus-osn-matematika-2026-materi")).toBeLessThan(1);
    expect(findSimilarSlug("silabus-osn-matematika-2027-materi-lengkap-untuk-sd-smp-dan-sma", [MONEY])).toBeNull();
  });

  it("does not redirect a different subject", () => {
    expect(findSimilarSlug("silabus-osn-fisika-2026-materi-lengkap-untuk-sma", OTHERS)).toBeNull();
  });

  it("ignores short or unrelated slugs", () => {
    expect(findSimilarSlug("osn", OTHERS)).toBeNull();
    expect(findSimilarSlug("resep-nasi-goreng-enak-sekali", OTHERS)).toBeNull();
  });
});

describe("normalizePath", () => {
  it("strips query, trailing slash and duplicate slashes", () => {
    expect(normalizePath("/list-program/?utm_source=x")).toBe("/list-program");
    expect(normalizePath("//artikel//foo/")).toBe("/artikel/foo");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/%E0%A4%A")).toBe("/%E0%A4%A");
  });
});
