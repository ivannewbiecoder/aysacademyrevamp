import { closeDb, getDb, schema } from "../src/lib/db";
import { PROGRAM_SEED } from "../src/content/programs-seed";
import { loadEnv } from "./env";

loadEnv();

/**
 * Idempotent seed: inserts the program catalogue and the one article written
 * for the redesign. Existing rows are left untouched so admin edits survive
 * re-running the seed.
 */
const FUNDAMENTAL_ARTICLE = {
  slug: "cara-memulai-persiapan-osn-dari-level-fundamental",
  type: "artikel" as const,
  title: "Cara Memulai Persiapan OSN dari Level Fundamental",
  excerpt: "Kenali urutan kelas dan atur waktu belajar agar latihan tidak menumpuk menjelang evaluasi.",
  subject: "strategi",
  status: "published" as const,
  seoTitle: "Cara Memulai Persiapan OSN dari Level Fundamental",
  seoDescription:
    "Panduan memulai persiapan OSN dari level Fundamental: alur Pre Class, Main Class, evaluasi, dan ritme belajar mingguan berdasarkan materi AYS.",
  content: `Memulai OSN tidak harus berarti langsung mengerjakan soal tersulit. Pada tahap Fundamental, siswa membangun konsep dasar, mencoba soal per topik, lalu menggunakan evaluasi untuk mengetahui bagian yang perlu diulang.

## Mulai dari Pre Class

Program Fundamental AYS dibuka dengan satu Pre Class. Sesi ini memberi gambaran silabus, metode belajar, fasilitas kelas, dan strategi mengikuti pembinaan. Gunakan kesempatan ini untuk mencatat topik yang terasa baru serta menyiapkan waktu belajar di luar kelas langsung.

## Ikuti urutan materi per bidang

Kurikulum Fundamental AYS memuat 14 Main Class untuk Biologi, Fisika, Kimia, Matematika SMA, Matematika SMP, Informatika, Geografi, dan Ekonomi. IPA SMP memiliki 16 Main Class. Urutan topik berbeda menurut bidang; pilih mata pelajaran yang akan ditekuni dan lihat [rincian kelasnya](/program) sebelum menyusun target pribadi.

## Gunakan enam hari belajar mandiri

Contoh ritme mingguan AYS terdiri dari satu kelas langsung sekitar 120 menit dan enam hari belajar mandiri. Setelah kelas, tulis kembali satu konsep yang belum jelas, kerjakan latihan terkait, lalu tandai kesalahan yang berulang. Bawa pertanyaan itu ke sesi diskusi berikutnya agar waktu bersama mentor lebih terarah.

## Periksa kemajuan lewat evaluasi

Program Fundamental mencantumkan dua evaluasi. Nilainya berguna sebagai petunjuk, bukan sekadar hasil akhir. Bandingkan jenis soal yang sudah dapat diselesaikan dengan topik yang masih menyita waktu. Dari sana, tentukan materi mana yang perlu ditinjau kembali sebelum lanjut ke tingkat berikutnya.

Belum yakin harus mulai dari bidang atau topik yang mana? [Ikuti tes diagnostik gratis](/diagnostik) dan diskusikan hasilnya bersama tim AYS.

> Artikel ini merangkum alur pembelajaran Fundamental AYS. Jadwal dan pelaksanaan tiap batch dapat berbeda.`,
};

async function main() {
  const db = getDb();
  const programs = await db
    .insert(schema.programs)
    .values(PROGRAM_SEED.map((p) => ({ ...p, topics: [...p.topics] })))
    .onConflictDoNothing({ target: schema.programs.slug })
    .returning({ slug: schema.programs.slug });
  console.log(`✓ Program: ${programs.length} baru (${PROGRAM_SEED.length - programs.length} sudah ada)`);

  const articles = await db
    .insert(schema.articles)
    .values({ ...FUNDAMENTAL_ARTICLE, publishedAt: new Date() })
    .onConflictDoNothing({ target: schema.articles.slug })
    .returning({ slug: schema.articles.slug });
  console.log(`✓ Artikel: ${articles.length} baru`);
}

main()
  .catch((error) => {
    console.error("✗ Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
