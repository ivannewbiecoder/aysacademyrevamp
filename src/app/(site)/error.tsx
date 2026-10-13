"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="subpage-hero">
      <div className="wrap">
        <p className="eyebrow">Terjadi kendala</p>
        <h1>
          Maaf, halaman ini gagal <em>dimuat.</em>
        </h1>
        <p>Coba muat ulang. Jika masih bermasalah, hubungi kami melalui WhatsApp.</p>
        <div className="hero-actions">
          <button className="button" type="button" onClick={() => retry()}>
            Coba lagi
          </button>
          <Link className="button button--light" href="/">
            Ke beranda
          </Link>
        </div>
        {error.digest && <p className="reassurance">Kode: {error.digest}</p>}
      </div>
    </section>
  );
}
