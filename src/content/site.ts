/**
 * Static marketing content for AYS Science Academy, taken from the approved
 * redesign prototype (design/prototype). Numbers and student achievements here
 * must be verified by the AYS team before launch; see README "Checklist launch".
 */

export const ORG = {
  name: "AYS Science Academy",
  legalName: "PT AYS Cipta Inovasi",
  foundingYear: 2009,
  email: "admin@aysacademy.id",
  whatsappNumber: "628139509990",
  whatsappDisplay: "0813-9509-990",
  instagram: "https://www.instagram.com/scienceacademy.ays/",
  address: {
    street: "Plaza Cityview Lt.3, Jl. Kemang Timur No.1, Pejaten Barat, Pasar Minggu",
    locality: "Jakarta Selatan",
    region: "DKI Jakarta",
    postalCode: "12510",
    country: "ID",
  },
  diagnostikUrl: "https://diagnostik.aysacademy.id/",
  tryoutUrl: "https://beta.tryout.aysacademy.id/login",
} as const;

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${ORG.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const PROOF_STATS = [
  { number: "3.000+", label: "siswa dan komunitas", note: "di seluruh Indonesia" },
  { number: "40+", label: "medalis dan finalis", note: "OSN 2026" },
  { number: "300+", label: "lomba dalam database", note: "aktif, dikurasi tiap bulan" },
  { number: "2.000+", label: "soal OSN & pembahasan", note: "sesuai level pengetahuan" },
] as const;

export const METHOD_STEPS = [
  {
    no: "01",
    title: "Pre Class",
    text: "Siswa mengenal cara belajar OSN, kurikulum, silabus, dan strategi dari mentor medalis.",
    items: ["Pembekalan metode", "Strategi kompetisi", "Pengenalan fasilitas"],
  },
  {
    no: "02",
    title: "Main Class",
    text: "Belajar bersama mentor, dengan Student Manager yang membantu jalannya kelas.",
    items: ["Pre-test tiap pertemuan", "Modul mingguan", "Sesi 2 jam", "Latihan soal per bab"],
  },
  {
    no: "03",
    title: "After Class",
    text: "Materi dan latihan tetap bisa diakses setelah sesi kelas berakhir.",
    items: ["Competition mapping", "Bedah soal", "Latihan dan pembahasan online", "Rekaman kelas"],
  },
] as const;

export const MENTORS = [
  {
    field: "Biologi SMA",
    text: "Medalis OSN, KSM, ONMIPA, dan International Biology Olympiad. Tercantum pula pengalaman riset di Osaka–Kobe University.",
  },
  { field: "Fisika SMA", text: "Peraih medali OSN Fisika, IPhO, APhO, dan ONMIPA. Alumni Kanazawa University." },
  { field: "Kimia SMA", text: "PhD KFUPM, medalis ONMIPA Kimia, dan postdoctoral fellow di Newcastle University." },
  {
    field: "Matematika",
    text: "Medalis ONMIPA dan OSN, pernah mengikuti Pelatnas IMO, serta meraih honorable mention kompetisi matematika internasional tingkat mahasiswa.",
  },
  { field: "IPA SMP", text: "Medalis KSM, OSN, dan International Biology Olympiad." },
] as const;

export type Medal = "gold" | "silver" | "bronze";

export const ACHIEVEMENTS: { name: string; event: string; medal: Medal }[] = [
  { name: "Aladdin N.S.", event: "Olimpiade Sains Nasional · Fisika · 2026", medal: "gold" },
  { name: "Kemal M.N.", event: "International Life Science Olympiad · 2026", medal: "gold" },
  { name: "Hania B.P.", event: "International Applied Physics Olympiad · 2026", medal: "gold" },
  { name: "Muhammad R.A.", event: "International Applied Chemistry Olympiad · 2026", medal: "gold" },
  { name: "Nadirra F.E.", event: "Olimpiade Biologi Indonesia · 2025", medal: "gold" },
  { name: "Timothy E.W.", event: "Olimpiade Sains Nasional · Biologi · 2026", medal: "silver" },
  { name: "Mochamad G.A.", event: "Olimpiade Sains Nasional · Fisika · 2026", medal: "silver" },
  { name: "Kayla A.D.", event: "International Applied Chemistry Olympiad · 2026", medal: "silver" },
  { name: "Alarick A.A.", event: "Olimpiade Sains Nasional · IPA SMP · 2025", medal: "bronze" },
  { name: "Asadel M.", event: "KOSSMI · IPA SMP · 2026", medal: "bronze" },
];

export const MEDAL_LABEL: Record<Medal, string> = {
  gold: "Medali emas",
  silver: "Medali perak",
  bronze: "Medali perunggu",
};

export const TESTIMONIALS = [
  {
    quote:
      "Untuk pemahaman materi, aku ngerasa jadi lebih dalam. Dulu kadang cuma ngerti di permukaan, tapi sekarang lebih paham \"kenapa\" dan \"gimana\" suatu konsep itu bisa terjadi, jadi lebih gampang juga kalau ketemu variasi soal yang beda.",
    name: "Rasya",
    program: "Siswa SCITRAC",
  },
  {
    quote:
      "Setelah ikut AYS, aku ngerasa ada perubahan sih, dari cara belajar, aku jadi lebih fokus dan lebih terarah sejak belajar bareng AYS, dari segi materi juga jadi lebih paham karena pembahasannya lebih dalam. Terus dari mental kompetisi, aku jadi lebih santai karena sering latihan soal di AYS.",
    name: "Deandra",
    program: "Siswa BIOTRAC",
  },
] as const;

export const HOME_FAQ = [
  {
    q: "Berapa biaya program AYS?",
    a: "Biaya bergantung pada bidang dan jenjang. Setelah diagnostik gratis, tim AYS menyusun penawaran sesuai kebutuhan siswa. Tersedia pilihan cicilan dan beasiswa parsial untuk siswa berprestasi.",
  },
  {
    q: "Apakah harus pernah mengikuti OSN?",
    a: "Tidak. Siswa dapat mulai dari dasar. Yang dibutuhkan adalah kemauan belajar dan komitmen mengikuti proses kelas.",
  },
  {
    q: "Berapa lama program berlangsung?",
    a: "Siswa dapat mengikuti pembinaan selama 3–9 bulan. Materi dibagi ke level Fundamental, Intermediate, dan Advanced.",
  },
  {
    q: "Kelas AYS online atau tatap muka?",
    a: "Training Camp berlangsung online. Kelas offline hanya tersedia untuk siswa AYS pada waktu khusus, misalnya menjelang masa intensif OSN.",
  },
  {
    q: "Bagaimana proses pendaftarannya?",
    a: "Mulai dari tes diagnostik gratis. Tim AYS akan menghubungi dalam 1–2 hari kerja untuk konsultasi, lalu membantu memilih program yang sesuai.",
  },
  {
    q: "Apakah AYS menjamin siswa menjadi juara?",
    a: "Tidak. AYS menjanjikan proses pembelajaran, kurikulum yang mengikuti silabus OSN, dan pendampingan mentor. Hasil kompetisi bergantung pada banyak faktor.",
  },
] as const;

/** Bank Soal sections. Slugs match the URLs already indexed on aysacademy.id. */
export const BANK_SUBJECTS = [
  { slug: "biologi", name: "Biologi", level: "SMA", programSlug: "biotrac" },
  { slug: "fisika", name: "Fisika", level: "SMA", programSlug: "phystrac" },
  { slug: "kimia", name: "Kimia", level: "SMA", programSlug: "chemtrac" },
  { slug: "matematika-sma", name: "Matematika SMA", level: "SMA", programSlug: "mathrac-sma" },
  { slug: "ipa-smp", name: "IPA SMP", level: "SMP", programSlug: "scitrac" },
  { slug: "matematika-smp", name: "Matematika SMP", level: "SMP", programSlug: "mathrac-smp" },
] as const;

export type BankSubject = (typeof BANK_SUBJECTS)[number];

export function findBankSubject(slug: string): BankSubject | undefined {
  return BANK_SUBJECTS.find((s) => s.slug === slug);
}

export const STAGE_LABEL = {
  "osn-k": "OSN-K (Kabupaten/Kota)",
  "osn-p": "OSN-P (Provinsi)",
  osn: "OSN Nasional",
  internasional: "Olimpiade Internasional",
  latihan: "Latihan",
} as const;

export const ARTICLE_SUBJECTS = [
  { value: "strategi", label: "Strategi" },
  { value: "matematika", label: "Matematika" },
  { value: "biologi", label: "Biologi" },
  { value: "fisika", label: "Fisika" },
  { value: "kimia", label: "Kimia" },
  { value: "ipa", label: "IPA" },
  { value: "informatika", label: "Informatika" },
] as const;
