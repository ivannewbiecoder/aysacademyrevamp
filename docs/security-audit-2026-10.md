# Audit keamanan — Oktober 2026

**Cakupan:** kode di branch `feat/nextjs-fullstack` dan build produksi lokal.
**Metodologi:** checklist dari [anthropic-cybersecurity-skills](https://github.com/mukul975/anthropic-cybersecurity-skills) (commit `54a7988`). Skill yang dipakai: *performing-web-application-penetration-test* (OWASP WSTG), *testing-for-broken-access-control*, *performing-security-headers-audit*, *performing-csrf-attack-simulation*, *testing-for-open-redirect-vulnerabilities*, *testing-for-host-header-injection*, *performing-api-rate-limiting-bypass*, *implementing-secret-scanning-with-gitleaks*, *implementing-semgrep-for-custom-sast-rules*, *hardening-docker-containers-for-production*, *detecting-supply-chain-attacks-in-ci-cd*, dan *performing-privacy-impact-assessment*.

SKILL.md dari repo itu dipakai sebagai panduan. Skrip Python di dalamnya tidak dijalankan karena belum ditinjau.

## Alat & hasil otomatis

| Pemeriksaan | Hasil |
|---|---|
| Gitleaks (riwayat git + kode sumber) | 0 rahasia. Temuan hanya di `.env` lokal dan `.next/`, keduanya di-gitignore |
| Semgrep (475 aturan: JS/TS, secrets, Dockerfile, GitHub Actions) | 0 temuan injeksi/XSS di kode aplikasi. Peringatan ReDoS di `slug.ts` terbukti false positive (linear: 1 juta karakter dalam 32 ms) |
| `npm audit --omit=dev` | 0 kerentanan |
| Peta otorisasi | 19/19 server action admin memeriksa sesi + peran sendiri. Publik hanya `loginAction` dan `submitLead` |
| Smoke test (60) + unit test (57) + uji browser | Semua lolos setelah perbaikan |

## Temuan & perbaikan

| # | Temuan | Risiko | Status |
|---|---|---|---|
| 1 | `X-Real-IP` dipercaya walau tidak ada proxy (`TRUSTED_PROXY_COUNT=0`), sehingga rate limit form konsultasi bisa dilewati dengan header palsu | Sedang | **Diperbaiki.** Header hanya dipercaya jika ada proxy; ditambah batas global 300 lead/jam |
| 2 | Rate limit login per email (5/15 menit) bisa dipakai pihak luar untuk mengunci akun admin | Sedang | **Diperbaiki.** Batas ketat per email+IP, batas longgar per email (30/15 menit) |
| 3 | Password sementara dari admin tidak wajib diganti | Sedang | **Diperbaiki.** Kolom `must_change_password` (migrasi `0001`). Panel, server action, dan ekspor CSV terkunci sampai password diganti |
| 4 | Sesi tidak punya batas umur absolut (sliding tanpa akhir) | Rendah | **Diperbaiki.** Maksimal 30 hari sejak login |
| 5 | GitHub Actions memakai tag yang bisa digeser (`@v4`) | Rendah | **Diperbaiki.** Di-pin ke commit SHA |
| 6 | Stage `tools` di Dockerfile berjalan sebagai root | Rendah | **Diperbaiki.** `USER node` |
| 7 | Tidak ada retensi data lead (banyak milik siswa di bawah umur) | Rendah (privasi) | **Diperbaiki.** `npm run leads:purge` |
| 8 | Next.js menyalin `.env` ke `.next/standalone` | Info | **Didokumentasikan.** Image Docker aman via `.dockerignore` |
| 9 | Admin belum punya MFA | Sedang | **Rekomendasi.** Tambahkan TOTP sebelum jumlah admin bertambah |
| 10 | Base image Docker belum di-pin ke digest | Rendah | **Rekomendasi.** Pin `node:22-bookworm-slim@sha256:…` saat deploy |
| 11 | CSP halaman publik masih mengizinkan `'unsafe-inline'` untuk script (dibutuhkan agar halaman bisa di-cache) | Rendah | **Diterima.** Konten pengguna disanitasi di server; admin memakai CSP nonce yang ketat |

## Belum diuji

- Pengujian dinamis berbasis payload terhadap server berjalan (fuzzing header/URL, penyalahgunaan server action lintas peran). Sebaiknya dilakukan oleh penguji dengan otorisasi tertulis di lingkungan staging, sesuai prasyarat di skill pentest.
- TLS/HSTS dan konfigurasi reverse proxy produksi (belum ada server produksi).
- Build image Docker (tidak ada Docker daemon di lingkungan audit).
