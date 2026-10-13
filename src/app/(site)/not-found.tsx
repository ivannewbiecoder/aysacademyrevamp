import Link from "next/link";

export default function NotFound() {
  return (
    <section className="subpage-hero">
      <div className="wrap">
        <p className="eyebrow">Halaman tidak ditemukan</p>
        <h1>
          Halaman ini sudah pindah <em>atau tidak ada.</em>
        </h1>
        <p>Coba mulai dari salah satu halaman berikut.</p>
        <div className="hero-actions">
          <Link className="button" href="/">
            Ke beranda
          </Link>
          <Link className="button button--light" href="/artikel">
            Artikel OSN
          </Link>
          <Link className="button button--light" href="/soal-osn">
            Bank soal
          </Link>
          <Link className="button button--light" href="/program">
            Program
          </Link>
        </div>
      </div>
    </section>
  );
}
