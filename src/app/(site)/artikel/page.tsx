import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArticleListing, isFilteredListing, parseListingParams } from "@/components/site/ArticleListing";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseListingParams(await searchParams);
  return pageMetadata({
    title: "Artikel OSN: Silabus, Strategi & Tips Belajar Olimpiade",
    exactTitle: true,
    description:
      "Panduan OSN dari AYS Science Academy: silabus per bidang, strategi lolos seleksi, tips belajar, dan pembahasan soal olimpiade untuk siswa SMP dan SMA.",
    path: "/artikel",
    noindex: isFilteredListing(params),
  });
}

export default async function ArtikelPage({ searchParams }: Props) {
  const params = parseListingParams(await searchParams);
  return (
    <>
      <section className="subpage-hero editorial-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Artikel", path: "/artikel" }]} />
          <p className="eyebrow">Info &amp; Soal OSN</p>
          <h1>
            Belajar strategi OSN dari <em>contoh nyata.</em>
          </h1>
          <p>Panduan untuk memahami seleksi, membaca soal, dan menyiapkan diri mengikuti olimpiade sains.</p>
          <Link className="button button--light" href="/berita">
            Lihat berita dan pengumuman <span className="arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          <div className="page-intro">
            <h2>Artikel pilihan</h2>
            <p>Pilih bacaan sesuai kebutuhanmu, dari silabus per bidang sampai strategi menghadapi OSN-K.</p>
          </div>
          <ArticleListing type="artikel" basePath="/artikel" params={params} showSubjects />
        </div>
      </section>
    </>
  );
}
