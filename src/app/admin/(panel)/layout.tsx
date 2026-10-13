import { AdminNav } from "@/components/admin/AdminNav";
import { can, requirePageUser } from "@/lib/auth/guards";
import { logoutAction } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Pages enforce the pending password change themselves; the layout must still render for /admin/akun.
  const user = await requirePageUser(undefined, { allowPendingPasswordChange: true });
  const items = [
    { href: "/admin", label: "Dasbor" },
    ...(can(user, "content:write") ? [{ href: "/admin/artikel", label: "Artikel & berita" }] : []),
    { href: "/admin/soal", label: "Bank soal" },
    ...(can(user, "content:write") ? [{ href: "/admin/program", label: "Program" }] : []),
    ...(can(user, "leads:read") ? [{ href: "/admin/leads", label: "Lead konsultasi" }] : []),
    ...(can(user, "redirects:write") ? [{ href: "/admin/redirect", label: "Redirect" }] : []),
    ...(can(user, "users:manage") ? [{ href: "/admin/pengguna", label: "Pengguna" }] : []),
    { href: "/admin/akun", label: "Akun saya" },
  ];
  return (
    <div className="admin-shell">
      <AdminNav items={items} user={{ name: user.name, role: user.role }} logout={logoutAction} />
      <main className="admin-main" id="konten">
        {children}
      </main>
    </div>
  );
}
