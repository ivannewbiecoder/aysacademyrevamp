import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { HeroImage } from "@/components/site/HeroImage";
import { ArticleCard, FaqList, FinalCta, ProgramListItem } from "@/components/site/cards";
import {
  ACHIEVEMENTS,
  HOME_FAQ,
  MEDAL_LABEL,
  MENTORS,
  METHOD_STEPS,
  PROOF_STATS,
  TESTIMONIALS,
  whatsappLink,
} from "@/content/site";
import { getLatestArticles, getPrograms } from "@/lib/content";
import { faqJsonLd, organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Pelatihan OSN & Pengembangan Prestasi | AYS Science Academy",
  exactTitle: true,
  description:
    "Pelatihan OSN online untuk siswa SMP dan SMA bersama mentor medalis. Program 3–9 bulan, latihan soal, dan tes diagnostik gratis untuk memetakan kesiapanmu.",
  path: "/",
});

function MedalIcon() {
  return (
    <svg viewBox="0 0 32 40" fill="none" aria-hidden="true">
      <path d="M7 2h7l3 13-6 4L7 2Zm18 0h-7l-3 13 6 4 4-17Z" fill="currentColor" opacity=".55" />
      <circle cx="16" cy="25" r="11" fill="currentColor" />
      <circle cx="16" cy="25" r="7" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
    </svg>
  );
}

export default async function HomePage() {
  const [programs, latest] = await Promise.all([getPrograms(), getLatestArticles(3)]);
  const sma = programs.filter((p) => p.level === "SMA");
  const smp = programs.filter((p) => p.level === "SMP");

  return (
    <div className="home-page">
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(), faqJsonLd(HOME_FAQ)]} />

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Pelatihan OSN untuk SMP &amp; SMA</p>
            <h1>
              Belajar OSN lebih terarah, mulai dari <em>levelmu.</em>
            </h1>
            <p className="hero-lede">
              AYS membimbing siswa SMP dan SMA melalui program 3–9 bulan, materi mingguan, latihan soal, dan mentor peraih
              medali. Mulai dengan mengenali kesiapanmu, lalu pilih bidang yang ingin ditekuni.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/diagnostik">
                Ikuti diagnostik gratis <span className="arrow" aria-hidden="true">↗</span>
              </Link>
              <Link className="button button--light" href="/program">
                Pilih bidang belajar
              </Link>
              <a
                className="button button--plain"
                href={whatsappLink("Halo AYS, saya ingin konsultasi persiapan OSN.")}
                rel="noopener"
              >
                Konsultasi persiapan OSN ↗
              </a>
            </div>
            <p className="reassurance">
              Setelah tes, tim AYS menghubungi dalam 1–2 hari kerja untuk membahas jalur belajar yang sesuai.
            </p>
          </div>
          <div className="hero-visual">
            <HeroImage
              className="hero-photo"
              alt="Siswa AYS belajar bersama mentor di laboratorium sains"
              sizes="(max-width: 700px) 100vw, 45vw"
              priority
            />
            <div className="photo-caption">
              Rasa ingin tahu membawa kita lebih jauh.<span>Belajar konsep, lalu berlatih menggunakannya.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="proof" aria-label="Sekilas tentang AYS">
        <div className="wrap proof-inner">
          {PROOF_STATS.map((s) => (
            <div className="proof-item" key={s.label}>
              <span className="proof-number">{s.number}</span>
              <span className="proof-label">{s.label}</span>
              <span className="proof-note">{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="audience" aria-labelledby="audience-title">
        <div className="wrap audience-inner">
          <h2 id="audience-title">Sedang mencari langkah yang tepat?</h2>
          <div className="audience-links">
            <Link className="audience-link" href="#program">
              <span>
                <strong>Untuk siswa</strong>
                <span>Kenali bidang yang ingin kamu dalami.</span>
              </span>
              <span className="arrow" aria-hidden="true">
                ↘
              </span>
            </Link>
            <Link className="audience-link" href="#faq">
              <span>
                <strong>Untuk orang tua</strong>
                <span>Lihat metode, durasi, dan cara mendaftar.</span>
              </span>
              <span className="arrow" aria-hidden="true">
                ↘
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="programs" id="program">
        <div className="wrap">
          <div className="programs-head">
            <div className="section-heading">
              <p className="eyebrow">Training Camp AYS</p>
              <h2>Pilih bidang yang ingin kamu tekuni.</h2>
              <p>
                Pelajari materi sesuai silabus OSN bersama mentor. Berikut sebagian topik dari kurikulum Fundamental; buka
                tiap bidang untuk melihat perjalanan materinya.
              </p>
            </div>
            <Link className="button button--light" href="/diagnostik">
              Mulai dari diagnostik <span className="arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
          {[
            { label: "Jenjang SMA", items: sma, offset: 0 },
            { label: "Jenjang SMP", items: smp, offset: sma.length },
          ]
            .filter((g) => g.items.length)
            .map((group) => (
              <div className="program-group" key={group.label}>
                <h3 className="program-group-label">{group.label}</h3>
                <div className="program-list">
                  {group.items.map((program, i) => (
                    <ProgramListItem key={program.slug} program={program} index={group.offset + i} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="method" id="metode">
        <div className="wrap method-layout">
          <div className="method-intro">
            <div className="section-heading">
              <p className="eyebrow">Cara belajar di AYS</p>
              <h2>Belajar tidak berhenti saat kelas selesai.</h2>
              <p>
                Program AYS dibagi menjadi tiga fase. Siswa mendapat pembekalan, belajar bersama mentor, diskusi strategi
                dan persiapan OSN, lalu melanjutkan latihan dengan materi hingga pembekalan informasi kompetisi.
              </p>
            </div>
            <Link className="method-link" href="/program">
              Lihat detail Training Camp <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="method-steps">
            {METHOD_STEPS.map((step) => (
              <article className="method-step" key={step.no}>
                <span className="step-no">{step.no}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <ul>
                    {step.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mentors">
        <div className="wrap mentor-layout">
          <div>
            <div className="section-heading">
              <p className="eyebrow">Belajar bersama mentor</p>
              <h2>Pengalaman kompetisi dibawa kembali ke kelas.</h2>
              <p>
                Mentor AYS merupakan peraih medali olimpiade nasional dan internasional. Mereka mengajar sesuai bidang dan
                pengalaman masing-masing.
              </p>
            </div>
            <p className="mentor-note">Ringkasan pengalaman mentor per bidang.</p>
          </div>
          <div className="mentor-list">
            {MENTORS.map((m) => (
              <div className="mentor-row" key={m.field}>
                <strong>{m.field}</strong>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="results" id="hasil">
        <div className="wrap">
          <div className="results-head">
            <div className="section-heading">
              <p className="eyebrow">Pencapaian siswa</p>
              <h2>Prestasi yang lahir dari proses belajar.</h2>
            </div>
            <p>Sepuluh contoh medali siswa AYS pada kompetisi 2025–2026. Nama ditampilkan singkat demi privasi siswa.</p>
          </div>
          <ul className="achievement-list" role="list">
            {ACHIEVEMENTS.map((a) => (
              <li className="achievement" key={a.name}>
                <span className="achievement-person">
                  <strong className="achievement-name">{a.name}</strong>
                  <span className="achievement-event">{a.event}</span>
                </span>
                <span className={`achievement-prize achievement-prize--${a.medal}`}>
                  <MedalIcon />
                  <span>{MEDAL_LABEL[a.medal]}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="result-more">Dan masih banyak prestasi lainnya.</p>
        </div>
      </section>

      <section className="voices">
        <div className="wrap voices-grid">
          <div className="section-heading">
            <p className="eyebrow">Cerita siswa</p>
            <h2>Apa yang berubah selama belajar?</h2>
            <p>Pengalaman siswa tentang pemahaman materi, kebiasaan belajar, dan latihan kompetisi.</p>
            <figure className="voices-photo">
              <Image
                src="/images/testimonial-award.webp"
                alt="Dua orang berfoto dengan penghargaan Grand Award Olimpiade Biologi Indonesia"
                width={768}
                height={1024}
                sizes="(max-width: 700px) 100vw, 480px"
              />
            </figure>
          </div>
          <div className="quote-list">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.name}>
                <p>“{t.quote}”</p>
                <footer>
                  <strong>{t.name}</strong> · {t.program}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="page-content" aria-labelledby="latest-title">
          <div className="wrap">
            <div className="programs-head">
              <div className="section-heading">
                <p className="eyebrow">Info OSN terbaru</p>
                <h2 id="latest-title">Panduan dan kabar olimpiade.</h2>
              </div>
              <Link className="button button--light" href="/artikel">
                Semua artikel <span className="arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="resource-grid">
              {latest.map((a) => (
                <ArticleCard key={a.slug} article={a} headingLevel="h3" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="faq" id="faq">
        <div className="wrap faq-layout">
          <div className="section-heading">
            <p className="eyebrow">Sebelum mendaftar</p>
            <h2>Hal yang sering ditanyakan orang tua dan siswa.</h2>
            <p>Belum yakin bidang mana yang cocok? Diagnostik gratis membantu tim AYS memahami kebutuhan awal siswa.</p>
          </div>
          <FaqList items={HOME_FAQ} />
        </div>
      </section>

      <FinalCta />
    </div>
  );
}
