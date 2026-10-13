"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function AdminNav({ items, user, logout }: { items: Item[]; user: { name: string; role: string }; logout: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Navigasi admin">
      <Link className="brand" href="/admin" aria-label="Dasbor admin">
        <Image className="brand-logo" src="/images/ays-logo-192.webp" alt="" width={63} height={44} unoptimized />
      </Link>
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" rel="noopener">
        Lihat situs ↗
      </Link>
      <div className="admin-user">
        <div>{user.name}</div>
        <div style={{ opacity: 0.7 }}>{user.role}</div>
        <form action={logout}>
          <button type="submit">Keluar</button>
        </form>
      </div>
    </nav>
  );
}
