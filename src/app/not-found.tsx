import Link from "next/link";

/** Root fallback (routes outside the public site layout). */
export default function RootNotFound() {
  return (
    <main className="login-wrap">
      <div className="login-card">
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat yang Anda buka tidak tersedia.</p>
        <Link className="button" href="/">
          Ke beranda AYS
        </Link>
      </div>
    </main>
  );
}
