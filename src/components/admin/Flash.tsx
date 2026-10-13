const MESSAGES: Record<string, { text: string; error?: boolean }> = {
  saved: { text: "Tersimpan." },
  deleted: { text: "Data dihapus." },
  akses: { text: "Anda tidak memiliki akses ke halaman tersebut.", error: true },
};

/** Shows a one-off notice passed via ?saved=1, ?deleted=1 or ?error=akses after a redirect. */
export async function Flash({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const key = sp.saved ? "saved" : sp.deleted ? "deleted" : sp.error === "akses" ? "akses" : null;
  if (!key) return null;
  const msg = MESSAGES[key];
  return (
    <p className={msg.error ? "flash flash--error" : "flash"} role={msg.error ? "alert" : "status"}>
      {msg.text}
    </p>
  );
}
