import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FinalCta } from "@/components/site/cards";
import { BANK_SUBJECTS } from "@/content/site";
import { getQuestionSetCounts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Bank Soal OSN SMP & SMA + Pembahasan",
  description:
    "Kumpulan soal OSN-K, OSN-P, dan OSN per bidang untuk SMP dan SMA, lengkap dengan pembahasan yang ditinjau mentor medalis AYS Science Academy.",
  path: "/soal-osn",
});

export default async function BankSoalPage() {
  const counts = await getQuestionSetCounts();
  const groups = [
    { label: "SMA", items: BANK_SUBJECTS.filter((s) => s.level === "SMA") },
    { label: "SMP", items: BANK_SUBJECTS.filter((s) => s.level === "SMP") },
  ];
  let n = 0;
  return (
    <>
      <section className="subpage-hero editorial-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Bank Soal", path: "/soal-osn" }]} />
          <p className="eyebrow">Latihan berdasarkan bidang</p>
          <h1>
            Temukan soal yang ingin kamu <em>pecahkan.</em>
          </h1>
          <p>
            Koleksi soal OSN-K, OSN-P, dan OSN dikelompokkan menurut bidang dan jenjang. Setiap pembahasan ditinjau mentor
            sebelum terbit.
          </p>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          {groups.map((group) => (
            <section className="catalog-section" key={group.label} aria-labelledby={`bank-${group.label}`}>
              <h2 id={`bank-${group.label}`}>{group.label}</h2>
              <div className="bank-categories">
                {group.items.map((s) => {
                  n += 1;
                  const count = counts[s.slug] ?? 0;
                  return (
                    <Link className="bank-category" key={s.slug} href={`/soal-osn/${s.slug}`}>
                      <span className="program-code">
                        {String(n).padStart(2, "0")} / {s.level}
                      </span>
                      <strong>Soal OSN {s.name}</strong>
                      <span>Arsip soal per tahun dan tahap seleksi ↗</span>
                      <span className="set-count">{count > 0 ? `${count} set soal` : "Segera hadir"}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
          <p className="notice">
            Soal resmi dari pihak lain ditautkan ke sumbernya; pembahasan ditulis orisinal oleh mentor AYS. Temukan
            kesalahan? Kabari kami melalui <Link href="/konsultasi">halaman konsultasi</Link>.
          </p>
        </div>
      </section>
      <FinalCta
        eyebrow="Setelah latihan"
        title="Ukur kesiapanmu dengan tes diagnostik."
        text="Hasil diagnostik membantu tim AYS menyarankan topik yang perlu diperkuat sebelum seleksi berikutnya."
      />
    </>
  );
}
