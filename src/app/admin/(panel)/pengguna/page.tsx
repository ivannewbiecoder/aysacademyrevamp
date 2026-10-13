import { asc } from "drizzle-orm";
import { ActionButton } from "@/components/admin/ActionButton";
import { CreateUserForm } from "@/components/admin/SmallForms";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";
import { resetUserPassword, setUserActive } from "../../actions";

export const metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const me = await requirePageUser("users:manage");
  const users = await getDb()
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      active: schema.users.active,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .orderBy(asc(schema.users.createdAt));

  return (
    <>
      <h1>Pengguna</h1>
      <p className="admin-lede">Gunakan akun terpisah untuk setiap orang. Jangan berbagi akun.</p>
      <div className="table-scroll" style={{ marginBottom: 28 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Peran</th>
              <th>Login terakhir</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  <div>{u.email}</div>
                </td>
                <td>{u.role}</td>
                <td>{u.lastLoginAt ? u.lastLoginAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "—"}</td>
                <td>
                  <span className={u.active ? "badge badge--ok" : "badge badge--muted"}>{u.active ? "aktif" : "nonaktif"}</span>
                </td>
                <td>
                  {u.id !== me.id && (
                    <div className="admin-actions">
                      <ActionButton
                        action={setUserActive}
                        fields={{ id: u.id, active: u.active ? "0" : "1" }}
                        label={u.active ? "Nonaktifkan" : "Aktifkan"}
                      />
                      <ActionButton
                        action={resetUserPassword}
                        fields={{ id: u.id }}
                        label="Reset password"
                        confirm={`Buat password sementara baru untuk ${u.email}? Semua sesinya akan dikeluarkan.`}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CreateUserForm />
    </>
  );
}
