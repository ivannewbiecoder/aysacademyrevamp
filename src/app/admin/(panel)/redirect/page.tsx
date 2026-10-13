import { desc } from "drizzle-orm";
import { ActionButton } from "@/components/admin/ActionButton";
import { RedirectForm } from "@/components/admin/SmallForms";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db";
import { deleteRedirect } from "../../actions";

export const metadata = { title: "Redirect" };

export default async function RedirectsPage() {
  await requirePageUser("redirects:write");
  const rows = await getDb().select().from(schema.redirects).orderBy(desc(schema.redirects.hits), desc(schema.redirects.createdAt)).limit(500);
  return (
    <>
      <h1>Redirect 301</h1>
      <p className="admin-lede">
        Dipakai saat URL tidak ditemukan. Pola WordPress umum (kategori, tag, author, arsip tanggal, /list-program) sudah ditangani
        otomatis. Slug artikel yang rusak sedikit juga dialihkan otomatis ke artikel yang paling mirip.
      </p>
      <RedirectForm />
      <div className="table-scroll" style={{ marginTop: 28 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dari</th>
              <th>Ke</th>
              <th>Dipakai</th>
              <th>Catatan</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.fromPath}</td>
                <td>{r.toPath}</td>
                <td>{r.hits}×</td>
                <td>{r.note}</td>
                <td>
                  <ActionButton action={deleteRedirect} fields={{ id: r.id }} label="Hapus" confirm={`Hapus redirect ${r.fromPath}?`} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>Belum ada redirect manual.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
