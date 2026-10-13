import Image from "next/image";
import Link from "next/link";
import { ORG, whatsappLink } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="AYS Science Academy, ke beranda">
              <Image className="brand-logo" src="/images/ays-logo-192.webp" alt="" width={96} height={67} unoptimized />
            </Link>
            <p>
              Mendampingi siswa SMP dan SMA belajar untuk olimpiade sains melalui program online, latihan, dan bimbingan
              mentor.
            </p>
            <address className="footer-address">
              {ORG.legalName}
              <br />
              {ORG.address.street}, {ORG.address.locality} {ORG.address.postalCode}
            </address>
          </div>
          <div className="footer-col">
            <h2>Jelajahi</h2>
            <Link href="/program">Program Training Camp</Link>
            <Link href="/artikel">Artikel OSN</Link>
            <Link href="/berita">Berita olimpiade</Link>
            <Link href="/soal-osn">Bank soal</Link>
            <Link href="/tryout">Tryout</Link>
          </div>
          <div className="footer-col">
            <h2>Hubungi AYS</h2>
            <Link href="/konsultasi">Konsultasi gratis</Link>
            <a href={`mailto:${ORG.email}`}>{ORG.email}</a>
            <a href={whatsappLink()} rel="noopener" data-track="whatsapp_click">
              WhatsApp {ORG.whatsappDisplay}
            </a>
            <a href={ORG.instagram} rel="noopener">
              Instagram AYS
            </a>
            <Link href="/kebijakan-privasi">Kebijakan privasi</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {ORG.legalName}</span>
          <span>{ORG.name} · Sejak {ORG.foundingYear}</span>
        </div>
      </div>
    </footer>
  );
}
