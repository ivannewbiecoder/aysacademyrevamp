import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProgramCard } from "@/components/site/cards";
import { getPrograms } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Program Pelatihan OSN SMP & SMA – Training Camp",
  description:
    "Pilih Training Camp AYS sesuai bidang OSN: Biologi, Fisika, Kimia, Matematika, IPA SMP, dan lainnya. Kurikulum Fundamental bersama mentor medalis.",
  path: "/program",
});

export default async function ProgramCatalogPage() {
  const programs = await getPrograms();
  const groups = [
    { id: "program-sma", label: "SMA", items: programs.filter((p) => p.level === "SMA"), offset: 0 },
    { id: "program-smp", label: "SMP", items: programs.filter((p) => p.level === "SMP"), offset: 0 },
  ];
  groups[1].offset = groups[0].items.length;

  return (
    <>
      <section className="subpage-hero editorial-hero">
        <div className="wrap">
          <Breadcrumb items={[{ name: "Training Camp", path: "/program" }]} />
          <p className="eyebrow">Training Camp AYS</p>
          <h1>
            Pilih bidang yang ingin kamu <em>dalami.</em>
          </h1>
          <p>
            {programs.length} jalur Fundamental untuk siswa SMP dan SMA. Setiap kartu menampilkan sebagian materi dari
            perjalanan belajar yang disusun untuk persiapan OSN.
          </p>
          <Link className="button" href="/diagnostik">
            Mulai dari tes diagnostik <span className="arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="page-content">
        <div className="wrap">
          <div className="page-intro">
            <h2>Materi sesuai bidang</h2>
            <p>
              Pelajari materi sesuai silabus OSN bersama mentor. Topik di bawah adalah cuplikan kurikulum Fundamental;
              buka detail program untuk melihat seluruh perjalanan materinya.
            </p>
          </div>
          {groups
            .filter((g) => g.items.length)
            .map((group) => (
              <section className="catalog-section" aria-labelledby={group.id} key={group.id}>
                <h2 id={group.id}>{group.label}</h2>
                <div className="catalog-card-grid">
                  {group.items.map((program, i) => (
                    <ProgramCard key={program.slug} program={program} index={group.offset + i} />
                  ))}
                </div>
              </section>
            ))}
          <p className="notice">
            Kurikulum Fundamental memuat satu Pre Class, rangkaian Main Class per bidang, serta dua evaluasi. Program
            berlanjut ke tahap Intermediate dan Advanced. Detail jadwal dan batch dikonfirmasi bersama tim AYS.
          </p>
        </div>
      </section>
    </>
  );
}
