import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin | AYS Science Academy", template: "%s | Admin AYS" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-body">{children}</div>;
}
