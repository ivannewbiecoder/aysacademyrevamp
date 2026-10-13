import { ImageResponse } from "next/og";

export const alt = "AYS Science Academy – Pelatihan OSN untuk SMP dan SMA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social preview, used by every page that has no cover image of its own. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#1f2b4a",
          color: "#f4f0e8",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#e8c25a" }}>AYS SCIENCE ACADEMY · SEJAK 2009</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>Pelatihan OSN untuk</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, color: "#e8c25a" }}>siswa SMP &amp; SMA</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#d8d2c6" }}>
          Mentor medalis · Bank soal · Tes diagnostik gratis — aysacademy.id
        </div>
      </div>
    ),
    size,
  );
}
