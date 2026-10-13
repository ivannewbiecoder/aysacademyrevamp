# aysacademy.id — Next.js + PostgreSQL

Situs AYS Science Academy hasil redesign: halaman publik yang dirender di server (SEO), CMS admin untuk Artikel, Berita, Program, dan Bank Soal, serta form konsultasi yang menyimpan lead ke database. Tes Diagnostik (`diagnostik.aysacademy.id`) dan Tryout (`beta.tryout.aysacademy.id`) tetap aplikasi terpisah.

Desain asli (HTML statis) disimpan di [`design/prototype/`](design/prototype) sebagai referensi.

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, output `standalone`), React 19 |
| Database | PostgreSQL 16 + Drizzle ORM (migrasi SQL di `drizzle/`) |
| Konten | Markdown → HTML di server (remark/rehype), rumus dengan KaTeX, disanitasi |
| Auth admin | Sesi di database, password Argon2id, peran admin/editor/mentor |
| QA | ESLint, TypeScript strict, Vitest (unit), smoke test end-to-end (`npm run smoke`), CI GitHub Actions |

---

## Menjalankan secara lokal

Butuh Node.js 22+ dan PostgreSQL 16.

```bash
cp .env.example .env          # isi DATABASE_URL, IP_HASH_SALT, dll.
npm ci
npm run db:migrate            # buat tabel
npm run db:seed               # 9 program + 1 artikel awal (aman diulang)
npm run admin:create -- --email nama@aysacademy.id --name "Nama" --role admin
npm run dev                   # http://localhost:3000, admin di /admin
```

Atau dengan Docker:

```bash
cp .env.example .env          # isi POSTGRES_PASSWORD, IP_HASH_SALT, dll.
docker compose up -d --build  # db + migrasi + app di 127.0.0.1:3000
docker compose run --rm tools npm run db:seed
docker compose run --rm tools npm run admin:create -- --email nama@aysacademy.id --name "Nama"
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` / `build` / `start` | Pengembangan, build produksi, server |
| `npm run lint` · `typecheck` · `test` | Pemeriksaan kode dan unit test |
| `npm run db:generate` | Buat file migrasi baru setelah mengubah `src/lib/db/schema.ts` |
| `npm run db:migrate` · `db:seed` | Jalankan migrasi · isi data awal |
| `npm run admin:create -- --email … --name … [--role …]` | Buat/reset akun admin (password sementara dicetak sekali) |
| `npm run import:wp -- --url https://aysacademy.id [--write]` | Impor artikel WordPress (lihat runbook) |
| `BASE_URL=… npm run smoke` | Smoke test end-to-end terhadap server yang sedang jalan |

---

## Struktur

```
src/app/(site)/        halaman publik: /, /program, /artikel, /berita, /soal-osn, /konsultasi, …
src/app/admin/         CMS (login, artikel, program, bank soal, lead, redirect, pengguna)
src/app/api/           /api/health (monitoring), /api/revalidate (purge cache, butuh token)
src/lib/               db, auth, markdown, seo, validasi, rate limit, redirect fuzzy, importer WP
src/content/site.ts    konten statis beranda (statistik, prestasi, testimoni, FAQ, kontak)
scripts/               migrasi, seed, admin, impor WordPress, smoke test
drizzle/               migrasi SQL
```

## Peran admin

| Peran | Bisa |
|---|---|
| **admin** | Semua, termasuk kelola pengguna dan hapus data lead |
| **editor** | Artikel, berita, program, redirect, lead, menulis soal |
| **mentor** | Menulis soal, **menandai soal "sudah dicek"**, menerbitkan set soal |

**Aturan Bank Soal:** set soal hanya bisa diterbitkan jika semua soalnya sudah ditandai "sudah dicek mentor". Di halaman publik, hanya soal yang sudah dicek yang tampil. Mengubah isi soal, pilihan, kunci, atau pembahasan otomatis mereset status cek.

---

## SEO yang sudah diterapkan

- Semua halaman dirender di server. Halaman program dan Bank Soal kini punya URL statis yang bisa di-crawl (sebelumnya detail program dirender JavaScript lewat `?program=`).
- `title`, meta description, canonical absolut, Open Graph/Twitter per halaman. Title dan meta bisa diatur per artikel, program, dan set soal dari admin.
- JSON-LD: `EducationalOrganization` + `WebSite` (beranda), `Course` (program), `Article`/`NewsArticle`, `FAQPage` (beranda, program, artikel ber-FAQ), `BreadcrumbList` (semua halaman dalam), `LearningResource` (set soal).
- `sitemap.xml` dinamis (program, artikel, set soal, halaman bidang) dan `robots.txt`. Situs non-HTTPS (staging/lokal) otomatis `Disallow: /` agar tidak terindeks.
- Halaman filter/pencarian/paginasi diberi `noindex`, sehingga hanya versi bersih yang kanonik.
- Internal link: artikel → program terkait (CTA samping), program → Bank Soal bidangnya, Bank Soal → program, semua → Tes Diagnostik.
- **Migrasi tanpa kehilangan ranking:**
  - URL `/artikel/{slug}` dipertahankan persis (importer memakai slug WordPress).
  - Trailing slash → tanpa slash (redirect permanen).
  - Pola WordPress dialihkan: `/category/*`, `/tag/*`, `/author/*`, arsip tanggal, `/list-program`, `/biotrac`, `/program/{program}-batch-*`.
  - Slug yang rusak (mis. `…-for-sd-smp-and-sma`, `…-dan-dan-sma`, `silabus-osi-…`) di-redirect 308 ke artikel aslinya jika cocoknya tidak ambigu. Angka tahun harus sama persis.
  - Slug yang tidak dikenal mengembalikan **404 sungguhan**. Situs lama mengembalikan 200 untuk slug apa pun, sehingga duplikatnya ikut terindeks.
  - Redirect manual bisa ditambah dari `/admin/redirect`. Mengganti slug artikel yang sudah terbit otomatis membuat redirect dari URL lama.

## Performa

- Font di-host sendiri (Poppins + Carter One, subset latin, `next/font`). Tidak ada request ke Google Fonts yang memblokir render.
- Halaman publik hampir tanpa JavaScript (Server Components). Filter dan pencarian bekerja lewat URL, tanpa JS.
- Data konten di-cache di server (tag `content`) dan langsung diperbarui setiap kali admin menyimpan.
- Hasil QA lokal (mobile, CPU diperlambat 4×): LCP ±200–260 ms, CLS 0, TTFB 16–37 ms.

## Keamanan

- Header keamanan di semua halaman: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, HSTS (produksi), tanpa `X-Powered-By`.
- Admin memakai CSP ketat per request (nonce + `strict-dynamic`), `Cache-Control: no-store`, dan `X-Robots-Tag: noindex`.
- Password Argon2id (parameter OWASP), minimal 12 karakter. Sesi berupa token acak 256-bit yang disimpan sebagai hash SHA-256. Cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`. Sesi diganti saat login, dan semua sesi dikeluarkan saat ganti/reset password atau akun dinonaktifkan.
- Login dibatasi per IP, per email+IP (ketat), dan per email (longgar, agar pihak luar tidak bisa mengunci akun admin). Pesan error generik, waktu respons dibuat konstan.
- Password sementara (akun baru/reset) wajib diganti sebelum panel bisa dipakai. Sesi berakhir setelah 7 hari tidak aktif dan paling lama 30 hari sejak login.
- Setiap Server Action memeriksa ulang sesi dan peran (tidak hanya mengandalkan layout). Next.js juga memverifikasi header Origin (CSRF).
- Semua input divalidasi dengan Zod. Markdown disanitasi: HTML mentah, `javascript:`, dan atribut event dibuang. KaTeX dijalankan dengan `trust: false`.
- Form konsultasi: honeypot, jebakan waktu, rate limit 5/10 menit per IP plus batas global 300/jam. IP disimpan sebagai hash bergaram. Webhook notifikasi tidak mengirim data pribadi.
- IP pengunjung hanya diambil dari header proxy jika `TRUSTED_PROXY_COUNT` ≥ 1. **Di produksi, jalankan aplikasi di belakang reverse proxy (Nginx/Cloudflare) dan isi nilai ini**; tanpa proxy semua pengunjung berbagi satu kuota rate limit.
- Ekspor CSV kebal formula injection. Akses lead, ekspor, login, dan perubahan konten tercatat di `audit_log`.
- `npm audit --omit=dev`: 0 kerentanan. Satu advisory tersisa hanya di tooling ESLint (`braces`) dan belum ada versi perbaikannya; tidak terpapar ke produksi.

---

## Runbook go-live (migrasi dari WordPress)

1. **Siapkan server dan database.** Isi `.env` produksi: `SITE_URL=https://aysacademy.id`, `IP_HASH_SALT`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `REVALIDATE_SECRET`, `TRUSTED_PROXY_COUNT` sesuai jumlah proxy (mis. Cloudflare + Nginx = 2).
2. `npm run db:migrate && npm run db:seed`, lalu buat akun admin.
3. **Selagi WordPress masih live**, impor artikel:
   ```bash
   npm run import:wp -- --url https://aysacademy.id                 # dry run, cek daftar slug
   npm run import:wp -- --url https://aysacademy.id --write --download-media
   ```
   `--download-media` menyalin gambar `wp-content/uploads` ke `public/uploads/wp`. Gambar lama akan hilang begitu domain dipindah, jadi langkah ini wajib. Jalankan importer dari salinan repo, **commit folder `public/uploads/wp`**, lalu build/deploy, karena file di `public/` ikut dibundel saat build.
4. **Salin `hero-ays.jpg`** (foto hero situs lama) ke `public/images/hero-ays.jpg`. Selama file itu belum ada, beranda menampilkan placeholder.
5. Buat set Bank Soal untuk URL yang sudah punya impresi di GSC: `kimia/osp-2024` dan `matematika-sma/osp-2023`.
6. Uji di staging (`SITE_URL` staging; robots otomatis `Disallow`). Jalankan `BASE_URL=https://staging… npm run smoke`.
7. Arahkan DNS / reverse proxy `aysacademy.id` ke aplikasi baru. Pastikan subdomain `diagnostik.` dan `beta.tryout.` tidak ikut berubah.
8. Di Search Console: kirim ulang `https://aysacademy.id/sitemap.xml`, lalu pakai URL Inspection untuk halaman program dan Bank Soal. Pantau laporan *Pages* (404 dan redirect) selama 2–4 minggu, lalu tambahkan redirect manual untuk URL lama yang masih muncul.

### Catatan operasional

- **Satu instance aplikasi** sudah cukup untuk trafik saat ini. Cache konten tersimpan per instance. Jika nanti dijalankan lebih dari satu instance, pasang shared cache handler (mis. Redis) atau panggil `/api/revalidate` di setiap instance setelah perubahan.
- Perubahan di luar admin (impor, SQL manual) muncul paling lambat 1 jam, atau langsung dengan:
  `curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" https://aysacademy.id/api/revalidate`
- Monitoring: `GET /api/health` (200 = aplikasi dan database sehat).
- Retensi data: jalankan `npm run leads:purge -- --months 12 --write` secara berkala (mis. bulanan) untuk menghapus lead lama.
- Jangan membagikan folder `.next/standalone` hasil build di mesin yang punya `.env`: Next.js menyalin `.env` ke sana. Image Docker aman karena `.env` dikecualikan `.dockerignore`; isi variabel lewat environment saat runtime.
- Backup: jadwalkan `pg_dump` harian. Tabel `leads` berisi data pribadi calon siswa (banyak di bawah umur); batasi akses dan masa simpannya.

## Perlu dikonfirmasi tim AYS sebelum launch

Isi berikut berasal dari prototipe desain dan belum bisa saya verifikasi:

- **Jumlah program:** prototipe menampilkan 9 (termasuk INFORMATRAC, GEOTRAC, TRACONOMICS), sedangkan dokumen konteks SEO menyebut 6. Program yang belum aktif bisa disembunyikan dari `/admin/program` (hapus centang *Tampilkan*).
- **Angka di beranda** (`src/content/site.ts`): "40+ medalis dan finalis OSN 2026", "300+ lomba", "2.000+ soal". Dokumen konteks memakai angka berbeda (3000+ siswa, 29+ mentor, 95% kepuasan).
- **Daftar prestasi siswa** (nama disingkat) dan penyelenggara ajang seperti "Olimpiade Biologi Indonesia" dan "KOSSMI".
- **Format kelas:** README prototipe mencatat halaman Training Camp lama menyebut *hybrid*, sedangkan beranda menyebut *online*. Situs ini mengikuti "online, offline di momen khusus".
- **Kebijakan privasi** (`/kebijakan-privasi`) ditulis faktual sesuai cara kerja situs, tetapi perlu ditinjau terhadap UU PDP No. 27/2022.
