/**
 * Templates — AI prompt templates & form field definitions for each document type
 * Supports: Modul Ajar, RPP, LKPD, Soal/Asesmen, Silabus
 */
const Templates = (() => {

  /* ── Shared Data ─────────────────────────────────── */

  const KELAS_OPTIONS = [
    { value: '', label: '-- Pilih Kelas --' },
    { value: 'Kelas 1 (Fase A)', label: 'Kelas 1 — Fase A' },
    { value: 'Kelas 2 (Fase A)', label: 'Kelas 2 — Fase A' },
    { value: 'Kelas 3 (Fase B)', label: 'Kelas 3 — Fase B' },
    { value: 'Kelas 4 (Fase B)', label: 'Kelas 4 — Fase B' },
    { value: 'Kelas 5 (Fase C)', label: 'Kelas 5 — Fase C' },
    { value: 'Kelas 6 (Fase C)', label: 'Kelas 6 — Fase C' },
    { value: 'Kelas 7 (Fase D)', label: 'Kelas 7 — Fase D' },
    { value: 'Kelas 8 (Fase D)', label: 'Kelas 8 — Fase D' },
    { value: 'Kelas 9 (Fase D)', label: 'Kelas 9 — Fase D' },
    { value: 'Kelas 10 (Fase E)', label: 'Kelas 10 — Fase E' },
    { value: 'Kelas 11 (Fase F)', label: 'Kelas 11 — Fase F' },
    { value: 'Kelas 12 (Fase F)', label: 'Kelas 12 — Fase F' }
  ];

  const MODEL_PEMBELAJARAN_OPTIONS = [
    { value: '', label: '-- Otomatis --' },
    { value: 'Problem Based Learning (PBL)', label: 'Problem Based Learning (PBL)' },
    { value: 'Project Based Learning (PjBL)', label: 'Project Based Learning (PjBL)' },
    { value: 'Discovery Learning', label: 'Discovery Learning' },
    { value: 'Inquiry Learning', label: 'Inquiry Learning' },
    { value: 'Cooperative Learning', label: 'Cooperative Learning' },
    { value: 'Flipped Classroom', label: 'Flipped Classroom' },
    { value: 'Diferensiasi', label: 'Diferensiasi' },
    { value: 'Contextual Teaching and Learning', label: 'Contextual Teaching & Learning' }
  ];

  /* ── System Prompt ───────────────────────────────── */

  const SYSTEM_PROMPT = `Kamu adalah asisten AI ahli pendidikan Indonesia yang sangat berpengalaman dalam menyusun perangkat pembelajaran sesuai Kurikulum Merdeka (Kurikulum 2022).

Keahlianmu meliputi:
- Memahami struktur Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Alur Tujuan Pembelajaran (ATP) sesuai Kurikulum Merdeka
- Memahami Profil Pelajar Pancasila dan dimensi-dimensinya
- Merancang kegiatan pembelajaran yang berpusat pada siswa (student-centered)
- Menyusun asesmen formatif dan sumatif yang autentik
- Menggunakan berbagai model pembelajaran (PBL, PjBL, Discovery, dll)
- Memahami diferensiasi pembelajaran untuk berbagai kebutuhan siswa

Aturan output:
1. Selalu gunakan Bahasa Indonesia yang baik, benar, dan formal
2. Gunakan format Markdown untuk struktur output:
   - Heading: # ## ### ####
   - Bold: **teks**
   - Italic: *teks*
   - Bullet list: - item
   - Numbered list: 1. item
   - Tabel: | Kolom 1 | Kolom 2 |
3. Konten harus sesuai standar Kurikulum Merdeka terbaru
4. Berikan konten yang lengkap, detail, mendalam, dan langsung siap pakai oleh guru
5. Sesuaikan tingkat kesulitan dan bahasa dengan jenjang kelas yang diminta
6. Jangan menambahkan catatan atau disclaimer di akhir, langsung akhiri konten`;

  /* ── Document Type Definitions ───────────────────── */

  const types = {
    'modul-ajar': {
      title: 'Modul Ajar',
      subtitle: 'Buat modul ajar lengkap sesuai Kurikulum Merdeka',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>`,
      color: '#6366F1',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: Matematika' },
        { id: 'kelas', label: 'Kelas / Fase', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'topik', label: 'Topik / Materi', type: 'text', required: true, placeholder: 'Contoh: Persamaan Linear Satu Variabel' },
        { id: 'jumlah_pertemuan', label: 'Jumlah Pertemuan', type: 'number', required: true, placeholder: '3', min: 1, max: 16 },
        { id: 'alokasi_waktu', label: 'Alokasi Waktu per Pertemuan', type: 'text', required: false, placeholder: 'Contoh: 2 x 45 menit' },
        { id: 'model_pembelajaran', label: 'Model Pembelajaran', type: 'select', required: false, options: MODEL_PEMBELAJARAN_OPTIONS },
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Tambahan info untuk AI (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **Modul Ajar** lengkap dengan rincian berikut:

## Informasi:
- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas/Fase: ${data.kelas}
- Topik/Materi: ${data.topik}
- Jumlah Pertemuan: ${data.jumlah_pertemuan} pertemuan
- Alokasi Waktu: ${data.alokasi_waktu || 'sesuaikan dengan jenjang'}
- Model Pembelajaran: ${data.model_pembelajaran || 'sesuaikan dengan materi'}
${data.catatan ? `- Catatan Guru: ${data.catatan}` : ''}

## Struktur yang WAJIB ada:

### A. INFORMASI UMUM
- Identitas modul (penyusun, instansi, tahun ajaran, mata pelajaran, kelas/fase, alokasi waktu)
- Kompetensi Awal yang harus dimiliki siswa
- Profil Pelajar Pancasila yang berkaitan (pilih 2-3 dimensi relevan dan jelaskan)
- Sarana & Prasarana yang dibutuhkan
- Target Peserta Didik (reguler, kesulitan belajar, pencapaian tinggi)
- Model Pembelajaran yang digunakan

### B. KOMPONEN INTI
- Capaian Pembelajaran (CP) — kutip sesuai Kurikulum Merdeka
- Tujuan Pembelajaran (TP) — turunkan dari CP, gunakan kata kerja operasional
- Alur Tujuan Pembelajaran (ATP)
- Pemahaman Bermakna (apa yang akan dipahami siswa)
- Pertanyaan Pemantik (3-5 pertanyaan untuk memantik rasa ingin tahu)

### C. KEGIATAN PEMBELAJARAN
Untuk setiap pertemuan (${data.jumlah_pertemuan} pertemuan), buat:
1. **Kegiatan Pendahuluan** (±15 menit) — salam, apersepsi, motivasi, tujuan
2. **Kegiatan Inti** (detail langkah-langkah sesuai model pembelajaran) — dengan rincian aktivitas guru dan siswa
3. **Kegiatan Penutup** (±10 menit) — refleksi, rangkuman, tindak lanjut

### D. ASESMEN
- Asesmen Diagnostik (untuk mengecek kesiapan belajar)
- Asesmen Formatif (selama proses pembelajaran)
- Asesmen Sumatif (di akhir pembelajaran, buat soal lengkap)
- Rubrik Penilaian (dengan indikator dan skor)

### E. PENGAYAAN & REMEDIAL
- Kegiatan pengayaan untuk siswa yang sudah tuntas
- Program remedial untuk siswa yang belum tuntas

### F. REFLEKSI GURU & PESERTA DIDIK
- Pertanyaan refleksi untuk guru
- Pertanyaan refleksi untuk siswa

### G. LAMPIRAN
- LKPD (Lembar Kerja Peserta Didik) ringkas
- Bahan Bacaan singkat
- Glosarium istilah penting
- Daftar Pustaka

Buat seluruh konten secara lengkap, detail, dan siap pakai. Gunakan format Markdown.`;
      }
    },

    'rpp': {
      title: 'RPP',
      subtitle: 'Buat Rencana Pelaksanaan Pembelajaran',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
      color: '#8B5CF6',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: Bahasa Indonesia' },
        { id: 'kelas', label: 'Kelas / Fase', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'materi_pokok', label: 'Materi Pokok', type: 'text', required: true, placeholder: 'Contoh: Teks Narasi' },
        { id: 'alokasi_waktu', label: 'Alokasi Waktu', type: 'text', required: true, placeholder: 'Contoh: 2 x 45 menit' },
        { id: 'pertemuan_ke', label: 'Pertemuan ke-', type: 'number', required: false, placeholder: '1', min: 1, max: 40 },
        { id: 'model_pembelajaran', label: 'Model Pembelajaran', type: 'select', required: false, options: MODEL_PEMBELAJARAN_OPTIONS },
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Tambahan info (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **RPP (Rencana Pelaksanaan Pembelajaran)** sesuai Kurikulum Merdeka:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas/Fase: ${data.kelas}
- Materi Pokok: ${data.materi_pokok}
- Alokasi Waktu: ${data.alokasi_waktu}
${data.pertemuan_ke ? `- Pertemuan ke: ${data.pertemuan_ke}` : ''}
- Model Pembelajaran: ${data.model_pembelajaran || 'sesuaikan'}
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

Struktur RPP yang harus dibuat:
1. **IDENTITAS** — Satuan Pendidikan, Mata Pelajaran, Kelas/Semester, Materi Pokok, Alokasi Waktu
2. **CAPAIAN PEMBELAJARAN (CP)** — sesuai Kurikulum Merdeka
3. **TUJUAN PEMBELAJARAN (TP)** — turunkan dari CP, gunakan kata kerja operasional (ABCD format)
4. **PROFIL PELAJAR PANCASILA** — dimensi yang dikembangkan
5. **PEMAHAMAN BERMAKNA**
6. **PERTANYAAN PEMANTIK** — 3-4 pertanyaan
7. **KEGIATAN PEMBELAJARAN**
   - **Pendahuluan** (dengan alokasi waktu) — salam, doa, apersepsi, motivasi
   - **Inti** (langkah-langkah detail dengan metode/model) — rincian aktivitas guru & siswa
   - **Penutup** — refleksi, rangkuman, tugas, salam
8. **ASESMEN**
   - Formatif (pengamatan, kuis, tanya jawab)
   - Sumatif (tes tertulis, proyek, dll)
9. **MEDIA & SUMBER BELAJAR**
10. **LAMPIRAN** — Instrumen penilaian lengkap, rubrik

Buat lengkap dan detail dalam format Markdown.`;
      }
    },

    'lkpd': {
      title: 'LKPD',
      subtitle: 'Buat Lembar Kerja Peserta Didik',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
      color: '#06B6D4',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: IPA' },
        { id: 'kelas', label: 'Kelas', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'topik', label: 'Topik / Materi', type: 'text', required: true, placeholder: 'Contoh: Sistem Pencernaan Manusia' },
        { id: 'tipe_kegiatan', label: 'Tipe Kegiatan', type: 'select', required: true, options: [
          { value: 'Individu', label: 'Individu' },
          { value: 'Kelompok', label: 'Kelompok' },
          { value: 'Campuran', label: 'Campuran (Individu & Kelompok)' }
        ]},
        { id: 'jumlah_kegiatan', label: 'Jumlah Kegiatan/Aktivitas', type: 'number', required: false, placeholder: '5', min: 2, max: 10 },
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Tambahan info (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **LKPD (Lembar Kerja Peserta Didik)** yang menarik dan edukatif:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas: ${data.kelas}
- Topik: ${data.topik}
- Tipe Kegiatan: ${data.tipe_kegiatan}
- Jumlah Aktivitas: ${data.jumlah_kegiatan || 5}
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

Struktur LKPD:
1. **JUDUL LKPD** — judul yang menarik dan relevan
2. **IDENTITAS SISWA** — Nama, Kelas, No. Absen, Tanggal, Kelompok (jika kelompok)
3. **CAPAIAN & TUJUAN PEMBELAJARAN** — ringkas
4. **PETUNJUK PENGERJAAN** — instruksi jelas langkah demi langkah
5. **RINGKASAN MATERI** — materi singkat sebagai dasar pengerjaan
6. **KEGIATAN/AKTIVITAS** (${data.jumlah_kegiatan || 5} aktivitas, bertahap dari mudah ke sulit):
   - Setiap aktivitas memiliki judul, tujuan, instruksi jelas
   - Variasikan tipe soal: isian singkat, uraian, tabel yang harus diisi, diagram/gambar yang dilengkapi, analisis, diskusi
   - Sediakan ruang/garis untuk jawaban siswa (tulis: [Ruang Jawaban])
   - Masukkan aktivitas kolaboratif jika tipe kelompok
7. **KESIMPULAN** — yang harus diisi/dilengkapi siswa sendiri
8. **REFLEKSI DIRI** — checklist atau pertanyaan refleksi (3-5 butir)

Buat konten yang menarik, kontekstual, dan menantang sesuai tingkat kognitif siswa. Format Markdown.`;
      }
    },

    'soal': {
      title: 'Soal / Asesmen',
      subtitle: 'Buat bank soal dan instrumen asesmen',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      color: '#F59E0B',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: Matematika' },
        { id: 'kelas', label: 'Kelas', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'materi', label: 'Materi / Bab', type: 'text', required: true, placeholder: 'Contoh: Trigonometri' },
        { id: 'jenis_soal', label: 'Jenis Soal', type: 'select', required: true, options: [
          { value: 'Pilihan Ganda', label: 'Pilihan Ganda (PG)' },
          { value: 'Pilihan Ganda Kompleks', label: 'Pilihan Ganda Kompleks' },
          { value: 'Uraian', label: 'Uraian / Essay' },
          { value: 'Campuran PG dan Uraian', label: 'Campuran (PG + Uraian)' },
          { value: 'Benar/Salah', label: 'Benar / Salah' },
          { value: 'Menjodohkan', label: 'Menjodohkan' }
        ]},
        { id: 'jumlah_soal', label: 'Jumlah Soal', type: 'number', required: true, placeholder: '20', min: 5, max: 50 },
        { id: 'level_kognitif', label: 'Level Kognitif', type: 'select', required: false, options: [
          { value: '', label: '-- Campuran (Default) --' },
          { value: 'C1-C2 (LOTS)', label: 'C1-C2 — LOTS (Mengingat & Memahami)' },
          { value: 'C3-C4 (MOTS)', label: 'C3-C4 — MOTS (Menerapkan & Menganalisis)' },
          { value: 'C4-C6 (HOTS)', label: 'C4-C6 — HOTS (Analisis, Evaluasi, Mencipta)' },
          { value: 'Campuran C1-C6', label: 'Campuran C1-C6' }
        ]},
        { id: 'jenis_asesmen', label: 'Jenis Asesmen', type: 'select', required: false, options: [
          { value: '', label: '-- Pilih (Opsional) --' },
          { value: 'Ulangan Harian', label: 'Ulangan Harian' },
          { value: 'PTS (Penilaian Tengah Semester)', label: 'PTS' },
          { value: 'PAS (Penilaian Akhir Semester)', label: 'PAS' },
          { value: 'PAT (Penilaian Akhir Tahun)', label: 'PAT' },
          { value: 'Asesmen Formatif', label: 'Asesmen Formatif' },
          { value: 'Asesmen Sumatif', label: 'Asesmen Sumatif' }
        ]},
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Tambahan info (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **Soal/Asesmen** dengan rincian:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas: ${data.kelas}
- Materi/Bab: ${data.materi}
- Jenis Soal: ${data.jenis_soal}
- Jumlah Soal: ${data.jumlah_soal} soal
- Level Kognitif: ${data.level_kognitif || 'Campuran C1-C6'}
- Jenis Asesmen: ${data.jenis_asesmen || 'Umum'}
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

Struktur Output yang WAJIB ada:

### 1. KISI-KISI SOAL
Buat dalam format tabel:
| No | Kompetensi Dasar / Tujuan Pembelajaran | Indikator Soal | Level Kognitif | Bentuk Soal | No. Soal |

### 2. SOAL
${data.jenis_soal === 'Pilihan Ganda' ? '- Setiap soal memiliki 5 pilihan (A, B, C, D, E)\n- Pengecoh (distractor) harus masuk akal\n- Soal harus jelas, tidak ambigu' : ''}
${data.jenis_soal === 'Pilihan Ganda Kompleks' ? `- **PENTING: Ini adalah soal Pilihan Ganda Kompleks (PGK)**
- Setiap soal memiliki 5-6 pernyataan/opsi yang diberi nomor (1, 2, 3, 4, 5, dst.)
- Peserta didik harus memilih **LEBIH DARI SATU jawaban yang benar** dari pernyataan tersebut
- Variasi format PGK yang digunakan:
  - **Tipe Kombinasi**: Sajikan 4-5 pernyataan, lalu pilihan jawaban berupa kombinasi nomor (contoh: A. 1,2,3 / B. 1,3,5 / C. 2,4,5 / D. 1,2,4,5)
  - **Tipe Centang**: Sajikan 5-6 pernyataan, peserta didik memilih semua yang benar (jawaban bisa 2-4 yang benar)
  - **Tipe Sebab-Akibat**: Dua pernyataan (pernyataan dan alasan), peserta didik menentukan kebenaran masing-masing dan hubungan keduanya
- Setiap soal harus memiliki **minimal 2 jawaban benar dan minimal 1 pengecoh (distractor)**
- Pengecoh harus masuk akal dan menguji pemahaman mendalam
- Soal harus mendorong berpikir tingkat tinggi (analisis, evaluasi)
- Sertakan petunjuk pengerjaan: "Pilihlah jawaban yang benar (jawaban bisa lebih dari satu)"` : ''}
${data.jenis_soal === 'Uraian' ? '- Soal uraian dengan skor yang jelas\n- Sertakan petunjuk panjang jawaban yang diharapkan' : ''}
${data.jenis_soal === 'Campuran PG dan Uraian' ? '- Bagian I: Pilihan Ganda (60% dari total soal)\n- Bagian II: Uraian (40% dari total soal)' : ''}
- Sesuaikan soal dengan level kognitif yang diminta
- Soal kontekstual dan relevan dengan kehidupan sehari-hari

### 3. KUNCI JAWABAN & PEMBAHASAN
- Untuk setiap soal, berikan:
  - Kunci jawaban yang benar${data.jenis_soal === 'Pilihan Ganda Kompleks' ? ' (sebutkan SEMUA jawaban yang benar)' : ''}
  - Pembahasan lengkap (langkah penyelesaian untuk soal hitungan)${data.jenis_soal === 'Pilihan Ganda Kompleks' ? '\n  - Penjelasan mengapa setiap pernyataan benar atau salah' : ''}
  - Level kognitif (C1/C2/C3/C4/C5/C6)

### 4. PEDOMAN PENSKORAN
- Tabel skor per soal${data.jenis_soal === 'Pilihan Ganda Kompleks' ? '\n- Gunakan penskoran parsial: skor penuh jika semua jawaban benar, setengah skor jika sebagian benar, nol jika salah' : ''}
- Total skor dan cara konversi ke nilai

Buat ${data.jumlah_soal} soal lengkap. Format Markdown.`;
      }
    },

    'silabus': {
      title: 'Silabus',
      subtitle: 'Buat silabus semester lengkap',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/><path d="M8 15h4"/></svg>`,
      color: '#10B981',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: Bahasa Inggris' },
        { id: 'kelas', label: 'Kelas / Fase', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'semester', label: 'Semester', type: 'select', required: true, options: [
          { value: 'Semester 1 (Ganjil)', label: 'Semester 1 (Ganjil)' },
          { value: 'Semester 2 (Genap)', label: 'Semester 2 (Genap)' }
        ]},
        { id: 'jumlah_jam', label: 'Jam Pelajaran per Minggu', type: 'number', required: false, placeholder: '4', min: 1, max: 10 },
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Tambahan info (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **Silabus** lengkap untuk satu semester:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas/Fase: ${data.kelas}
- Semester: ${data.semester}
- Jam Pelajaran/Minggu: ${data.jumlah_jam || 'sesuaikan'} JP
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

Struktur Silabus:
1. **IDENTITAS** — Satuan Pendidikan, Mata Pelajaran, Kelas/Fase, Semester, Tahun Ajaran

2. **CAPAIAN PEMBELAJARAN (CP)** — kutip sesuai Kurikulum Merdeka untuk fase ini

3. **ALUR TUJUAN PEMBELAJARAN (ATP)** — uraikan TP yang akan dicapai selama semester

4. **TABEL SILABUS** — Buat tabel lengkap 16-18 minggu dengan kolom:
| Minggu ke- | Tujuan Pembelajaran | Topik/Materi | Kegiatan Pembelajaran | Asesmen | Alokasi Waktu | Sumber Belajar |

5. **PROGRAM SEMESTER (PROSEM)** — Distribusi waktu dalam tabel kalender

6. **MEDIA & SUMBER BELAJAR** — daftar lengkap

7. **CATATAN** — hal-hal yang perlu diperhatikan

Buat silabus yang realistis dan terstruktur. Format Markdown dengan tabel.`;
      }
    },

    'capaian-pembelajaran': {
      title: 'Capaian Pembelajaran',
      subtitle: 'Analisis & penjabaran CP sesuai fase',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      color: '#EC4899',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: Matematika' },
        { id: 'kelas', label: 'Kelas / Fase', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'elemen', label: 'Elemen / Strand (Opsional)', type: 'text', required: false, placeholder: 'Contoh: Bilangan, Aljabar, Geometri' },
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Fokus khusus atau kebutuhan (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **Analisis Capaian Pembelajaran (CP)** lengkap sesuai Kurikulum Merdeka:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas/Fase: ${data.kelas}
${data.elemen ? `- Elemen/Strand: ${data.elemen}` : ''}
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

Struktur yang WAJIB ada:

### 1. CAPAIAN PEMBELAJARAN (CP) RESMI
- Kutip CP lengkap dari Kurikulum Merdeka untuk fase dan mata pelajaran ini
- Pisahkan per elemen/strand jika ada
- Jelaskan ruang lingkup CP

### 2. ANALISIS CP
Buat tabel analisis:
| Elemen | Capaian Pembelajaran | Konten/Materi Inti | Kompetensi yang Diharapkan | Kata Kerja Operasional |

### 3. PENJABARAN CP KE TUJUAN PEMBELAJARAN (TP)
- Uraikan CP menjadi beberapa TP yang terukur
- Setiap TP menggunakan format ABCD (Audience, Behavior, Condition, Degree)
- Urutkan TP secara logis dan bertahap

### 4. ALUR TUJUAN PEMBELAJARAN (ATP)
Buat tabel ATP:
| No | Tujuan Pembelajaran | Kata Kunci | Level Kognitif | Perkiraan Waktu | Topik/Materi |

### 5. PEMETAAN PROFIL PELAJAR PANCASILA
- Identifikasi dimensi Profil Pelajar Pancasila yang relevan dengan setiap TP
- Buat tabel pemetaan TP → Dimensi P3

### 6. INDIKATOR KETERCAPAIAN
- Buat indikator yang terukur untuk setiap TP
- Sertakan contoh bukti ketercapaian

Buat seluruh konten lengkap dan detail. Format Markdown.`;
      }
    },

    'tujuan-pembelajaran': {
      title: 'Tujuan Pembelajaran',
      subtitle: 'Rumuskan TP & ATP dari Capaian Pembelajaran',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      color: '#F97316',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: IPA' },
        { id: 'kelas', label: 'Kelas / Fase', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'topik', label: 'Topik / Materi Pokok', type: 'text', required: true, placeholder: 'Contoh: Ekosistem dan Lingkungan Hidup' },
        { id: 'jumlah_tp', label: 'Jumlah TP yang Diinginkan', type: 'number', required: false, placeholder: '5', min: 3, max: 15 },
        { id: 'semester', label: 'Semester', type: 'select', required: false, options: [
          { value: '', label: '-- Pilih (Opsional) --' },
          { value: 'Semester 1 (Ganjil)', label: 'Semester 1 (Ganjil)' },
          { value: 'Semester 2 (Genap)', label: 'Semester 2 (Genap)' }
        ]},
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Fokus khusus atau kebutuhan (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **Tujuan Pembelajaran (TP) dan Alur Tujuan Pembelajaran (ATP)** lengkap:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas/Fase: ${data.kelas}
- Topik/Materi: ${data.topik}
- Jumlah TP: ${data.jumlah_tp || '5-8'}
${data.semester ? `- Semester: ${data.semester}` : ''}
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

Struktur yang WAJIB ada:

### 1. CAPAIAN PEMBELAJARAN (CP) RUJUKAN
- Kutip CP yang relevan dari Kurikulum Merdeka
- Identifikasi elemen CP yang berkaitan dengan topik

### 2. TUJUAN PEMBELAJARAN (TP)
Rumuskan ${data.jumlah_tp || '5-8'} TP menggunakan format ABCD:
- **A**udience: Peserta didik
- **B**ehavior: Kata kerja operasional (sesuai Taksonomi Bloom)
- **C**ondition: Kondisi/cara belajar
- **D**egree: Tingkat keberhasilan

Untuk setiap TP, sertakan:
| No | Tujuan Pembelajaran | Kata Kerja Operasional | Level Kognitif (C1-C6) | Domain (Sikap/Pengetahuan/Keterampilan) |

### 3. ALUR TUJUAN PEMBELAJARAN (ATP)
- Susun TP secara berurutan (dari sederhana ke kompleks)
- Buat diagram alur/urutan TP
- Tabel ATP:
| Urutan | TP | Materi Pokok | Pertemuan ke- | Alokasi Waktu | Asesmen |

### 4. INDIKATOR PENCAPAIAN TP
Untuk setiap TP, buat indikator yang:
- Spesifik dan terukur
- Dapat diamati
- Realistis dalam waktu yang tersedia

### 5. PROFIL PELAJAR PANCASILA
Tabel pemetaan:
| TP | Dimensi P3 yang Dikembangkan | Aktivitas Pengembangan |

### 6. ASESMEN PER TP
| TP | Jenis Asesmen | Teknik | Instrumen | Contoh Soal/Tugas |

Buat seluruh konten lengkap, detail, dan langsung siap pakai. Format Markdown.`;
      }
    },

    'deep-learning': {
      title: 'Pendekatan DEEP',
      subtitle: 'Rancang pembelajaran dengan pendekatan DEEP Learning',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      color: '#14B8A6',
      fields: [
        { id: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Contoh: Matematika' },
        { id: 'kelas', label: 'Kelas / Fase', type: 'select', required: true, options: KELAS_OPTIONS },
        { id: 'topik', label: 'Topik / Materi', type: 'text', required: true, placeholder: 'Contoh: Statistika dan Peluang' },
        { id: 'jumlah_pertemuan', label: 'Jumlah Pertemuan', type: 'number', required: true, placeholder: '4', min: 1, max: 16 },
        { id: 'alokasi_waktu', label: 'Alokasi Waktu per Pertemuan', type: 'text', required: false, placeholder: 'Contoh: 2 x 45 menit' },
        { id: 'fokus_deep', label: 'Fokus Elemen DEEP', type: 'select', required: false, options: [
          { value: '', label: '-- Semua Elemen (Default) --' },
          { value: 'Dialogue (Dialog)', label: 'Fokus: Dialogue (Dialog)' },
          { value: 'Exploration (Eksplorasi)', label: 'Fokus: Exploration (Eksplorasi)' },
          { value: 'Elaboration (Elaborasi)', label: 'Fokus: Elaboration (Elaborasi)' },
          { value: 'Presentation (Presentasi)', label: 'Fokus: Presentation (Presentasi)' }
        ]},
        { id: 'catatan', label: 'Catatan Tambahan', type: 'textarea', required: false, placeholder: 'Kebutuhan khusus atau konteks (opsional)...' }
      ],
      buildPrompt(data) {
        return `Buatkan **Rancangan Pembelajaran dengan Pendekatan DEEP Learning** yang lengkap dan detail:

- Mata Pelajaran: ${data.mata_pelajaran}
- Kelas/Fase: ${data.kelas}
- Topik/Materi: ${data.topik}
- Jumlah Pertemuan: ${data.jumlah_pertemuan} pertemuan
- Alokasi Waktu: ${data.alokasi_waktu || 'sesuaikan'}
${data.fokus_deep ? `- Fokus Elemen: ${data.fokus_deep}` : '- Elemen: Semua elemen DEEP'}
${data.catatan ? `- Catatan: ${data.catatan}` : ''}

## Tentang Pendekatan DEEP Learning:
DEEP Learning adalah pendekatan pembelajaran bermakna yang terdiri dari 4 elemen:
- **D** = **Dialogue** (Dialog) — Interaksi bermakna antar peserta didik dan guru
- **E** = **Exploration** (Eksplorasi) — Kegiatan eksplorasi untuk menemukan konsep
- **E** = **Elaboration** (Elaborasi) — Pendalaman dan perluasan pemahaman
- **P** = **Presentation** (Presentasi) — Mempresentasikan dan mengkomunikasikan hasil belajar

## Struktur yang WAJIB dibuat:

### 1. IDENTITAS & KONTEKS
- Informasi umum (mata pelajaran, kelas, topik, alokasi waktu)
- Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)
- Profil Pelajar Pancasila yang dikembangkan

### 2. ANALISIS PENDEKATAN DEEP
Buat tabel perencanaan DEEP:
| Elemen DEEP | Tujuan | Strategi/Metode | Aktivitas Siswa | Aktivitas Guru | Durasi |

### 3. SKENARIO PEMBELAJARAN PER PERTEMUAN
Untuk setiap pertemuan (${data.jumlah_pertemuan} pertemuan), rancang dengan alur DEEP:

#### **Tahap 1: DIALOGUE (Dialog) — ±15 menit**
- Pertanyaan pemantik (3-5 pertanyaan esensial)
- Diskusi kelas/kelompok terpandu
- Teknik tanya jawab yang digunakan (Socratic, think-pair-share, dll)
- Bagaimana guru memfasilitasi dialog

#### **Tahap 2: EXPLORATION (Eksplorasi) — ±25 menit**
- Kegiatan eksplorasi mandiri/kelompok
- Sumber belajar yang digunakan
- Lembar panduan eksplorasi
- Pertanyaan pengarah untuk penemuan konsep
- Diferensiasi untuk berbagai tingkat kemampuan

#### **Tahap 3: ELABORATION (Elaborasi) — ±25 menit**
- Aktivitas pendalaman pemahaman
- Latihan aplikasi konsep (dari sederhana ke kompleks)
- Koneksi antar konsep dan kehidupan nyata
- Aktivitas berpikir tingkat tinggi (HOTS)
- Scaffolding untuk siswa yang membutuhkan

#### **Tahap 4: PRESENTATION (Presentasi) — ±15 menit**
- Format presentasi (lisan, poster, digital, dll)
- Rubrik presentasi
- Sesi tanya jawab dan umpan balik sejawat
- Refleksi pembelajaran

### 4. ASESMEN BERBASIS DEEP
| Elemen DEEP | Jenis Asesmen | Teknik | Instrumen | Indikator Keberhasilan |
- Asesmen Diagnostik (sebelum pembelajaran)
- Asesmen Formatif (selama setiap tahap DEEP)
- Asesmen Sumatif (di akhir)

### 5. RUBRIK PENILAIAN DEEP
Buat rubrik 4 level (Sangat Baik, Baik, Cukup, Perlu Perbaikan) untuk setiap elemen DEEP:
| Kriteria | Sangat Baik (4) | Baik (3) | Cukup (2) | Perlu Perbaikan (1) |

### 6. SUMBER BELAJAR & MEDIA
- Media yang digunakan per tahap DEEP
- Referensi dan sumber belajar

### 7. REFLEKSI GURU
- Pertanyaan refleksi efektivitas setiap elemen DEEP
- Checklist keberhasilan implementasi DEEP

### 8. LAMPIRAN
- Lembar Kerja untuk tahap Eksplorasi
- Template presentasi untuk siswa
- Panduan diskusi untuk tahap Dialog

Buat seluruh konten lengkap, detail, praktis, dan langsung siap diimplementasikan guru di kelas. Format Markdown.`;
      }
    }
  };

  /* ── Public API ──────────────────────────────────── */

  function getTemplate(type) {
    return types[type] || null;
  }

  function getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  function buildUserPrompt(type, formData) {
    const template = types[type];
    if (!template) return null;
    return template.buildPrompt(formData);
  }

  function getAllTypes() {
    return Object.entries(types).map(([key, val]) => ({
      id: key,
      title: val.title,
      subtitle: val.subtitle,
      icon: val.icon,
      color: val.color
    }));
  }

  return {
    getTemplate,
    getSystemPrompt,
    buildUserPrompt,
    getAllTypes
  };
})();
