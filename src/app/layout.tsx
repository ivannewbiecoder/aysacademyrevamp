import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ORG } from "@/content/site";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});

const serif = localFont({
  src: "../fonts/carter-one-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Pelatihan OSN & Pengembangan Prestasi | AYS Science Academy", template: "%s" },
  description:
    "Bimbingan persiapan OSN online untuk siswa SMP dan SMA. Temukan bidang belajar dan mulai dari tes diagnostik gratis bersama AYS Science Academy.",
  applicationName: ORG.name,
  authors: [{ name: ORG.name }],
  formatDetection: { telephone: false, email: false, address: false },
  // Search Console uses a DNS-verified domain property, so no meta tag is needed.
};

export const viewport: Viewport = {
  themeColor: "#f4f0e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${serif.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
