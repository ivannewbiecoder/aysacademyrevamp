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
    title: "Berita OSN & Olimpiade Sains Terbaru",
    description:
      "Kabar terbaru OSN dan olimpiade sains: jadwal seleksi, pengumuman hasil, pendaftaran, dan beasiswa untuk siswa SMP dan SMA.",
    path: "/berita",
    noindex: isFilteredListing(params),
  });
}

export default async function BeritaPage({ searchParams }: Props) {
  const params = parseListingParams(await searchParams);
  return (
    <>
      <section className="subpage-hero editorial-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Berita", path: "/berita" }]} />
          <p className="eyebrow">Berita Olimpiade</p>
          <h1>
            Ikuti kabar dan jadwal <em>OSN.</em>
          </h1>
          <p>
            Pengumuman seleksi, informasi pendaftaran, dan kabar pendidikan yang membantu siswa serta orang tua
            merencanakan persiapan.
          </p>
          <Link className="button button--light" href="/artikel">
            Baca strategi dan panduan <span className="arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          <div className="page-intro">
            <h2>Berita yang perlu diketahui</h2>
          </div>
          <ArticleListing type="berita" basePath="/berita" params={params} showSubjects={false} />
          <p className="notice">
            Jadwal seleksi dan kebijakan dapat berubah. Selalu cocokkan dengan pengumuman resmi Puspresnas sebelum
            mengambil keputusan.
          </p>
        </div>
      </section>
    </>
  );
}
