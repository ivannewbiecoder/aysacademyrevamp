import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { extractHeadings, markdownToPlainText, renderMarkdown } from "@/lib/markdown";
import { clientIpFromHeaders, hashIp } from "@/lib/request";
import { serializeJsonLd, titleWithBrand } from "@/lib/seo";

describe("renderMarkdown sanitisation", () => {
  const vectors = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    "[x](data:text/html;base64,PHNjcmlwdD4=)",
    "![x](javascript:alert(1))",
    '<a href="https://evil" onclick="alert(1)">x</a>',
    "<iframe src=https://evil></iframe>",
    "<style>body{display:none}</style>",
    "$\\href{javascript:alert(1)}{x}$",
  ];
  it.each(vectors)("neutralises %s", (input) => {
    const html = renderMarkdown(input);
    expect(html).not.toMatch(/<script|<iframe|<style|onerror=|onclick=/i);
    expect(html).not.toMatch(/(href|src)="\s*(javascript|data):/i);
  });

  it("keeps normal content, tables and math", () => {
    const html = renderMarkdown("## Judul\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n$x^2$ dan [Puspresnas](https://puspresnas.kemendikdasmen.go.id)");
    expect(html).toContain('<h2 id="judul">Judul</h2>');
    expect(html).toContain("<table>");
    expect(html).toContain('class="katex"');
    expect(html).toContain('href="https://puspresnas.kemendikdasmen.go.id"');
  });

  it("extracts H2 headings with matching ids", () => {
    expect(extractHeadings("## Silabus SMP\n\ntext\n\n### sub\n\n## Silabus SMA")).toEqual([
      { id: "silabus-smp", text: "Silabus SMP" },
      { id: "silabus-sma", text: "Silabus SMA" },
    ]);
  });

  it("builds plain-text excerpts", () => {
    expect(markdownToPlainText("## Halo\n\nIni **tebal** dan [link](https://x.y).", 100)).toBe("Halo Ini tebal dan link.");
  });
});

describe("serializeJsonLd", () => {
  it("cannot break out of the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("titleWithBrand", () => {
  it("adds the brand only when it fits in 60 characters", () => {
    expect(titleWithBrand("Bank Soal OSN")).toBe("Bank Soal OSN | AYS Science Academy");
    const long = "Silabus OSN Matematika 2026: Materi Lengkap SD SMP SMA";
    expect(titleWithBrand(long)).toBe(long);
  });
});

describe("CSV export", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+62812")).toBe("'+62812");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("Budi, SMA 8")).toBe('"Budi, SMA 8"');
  });
  it("starts with a BOM for Excel", () => {
    expect(toCsv(["a"], [["b"]]).charCodeAt(0)).toBe(0xfeff);
  });
});

describe("client IP resolution", () => {
  const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.2" });
  it("trusts exactly N proxy hops (ignores spoofed left-most entries)", () => {
    expect(clientIpFromHeaders(headers, 1)).toBe("10.0.0.2");
    expect(clientIpFromHeaders(headers, 2)).toBe("203.0.113.9");
  });
  it("ignores X-Forwarded-For and X-Real-IP when no proxy is trusted", () => {
    expect(clientIpFromHeaders(headers, 0)).toBe("unknown");
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "1.2.3.4" }), 0)).toBe("unknown");
  });
  it("uses X-Real-IP set by a trusted proxy", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "1.2.3.4" }), 1)).toBe("1.2.3.4");
  });
  it("hashes IPs with a salt", () => {
    expect(hashIp("1.2.3.4", "salt-a")).not.toBe(hashIp("1.2.3.4", "salt-b"));
    expect(hashIp("1.2.3.4", "salt-a")).toHaveLength(32);
  });
});
