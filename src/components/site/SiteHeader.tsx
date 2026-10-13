import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

const MOBILE_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/program", label: "Training Camp" },
  { href: "/artikel", label: "Artikel OSN" },
  { href: "/berita", label: "Berita OSN" },
  { href: "/soal-osn", label: "Bank soal" },
  { href: "/tryout", label: "Tryout" },
  { href: "/diagnostik", label: "Tes diagnostik" },
  { href: "/konsultasi", label: "Konsultasi gratis" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#konten">
        Lewati ke konten
      </a>
      <div className="wrap header-inner">
        <Link className="brand" href="/" aria-label="AYS Science Academy, ke beranda">
          <Image className="brand-logo" src="/images/ays-logo-192.webp" alt="AYS Science Academy" width={96} height={67} unoptimized priority />
        </Link>
        <nav className="nav" aria-label="Navigasi utama">
          <NavLink href="/program">Training Camp</NavLink>
          <NavLink href="/artikel">Info OSN</NavLink>
          <NavLink href="/soal-osn">Bank soal</NavLink>
          <NavLink href="/tryout">Tryout</NavLink>
          <Link className="button" href="/diagnostik">
            Tes diagnostik <span className="arrow" aria-hidden="true">↗</span>
          </Link>
        </nav>
        <MobileMenu items={MOBILE_ITEMS} />
      </div>
    </header>
  );
}
