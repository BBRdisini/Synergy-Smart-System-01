# TaniCerdas AI — Sahabat Petani, Panen Maksimal

Platform pertanian cerdas Indonesia berbasis AI, Kamera Diagnosis Penyakit Tanaman, Mesin Perencanaan Budidaya Padi 8 Fase, Kalender Tanam, Pemantauan Cuaca & pH Tanah, serta Kalkulator Usaha Tani.

## 1. Arsitektur Aplikasi

Aplikasi ini dibangun menggunakan arsitektur full-stack modular:
- **Presentation Layer (`src/components/*`, `src/App.tsx`)**: Antarmuka responsif mobile-first dan desktop workspace berbasis React 19, TypeScript, dan Tailwind CSS sesuai dengan 18 layar pada **Papan Presentasi UI TaniCerdas AI**.
- **Business Logic & Calculation Layer (`src/utils/agronomyCalculations.ts`)**: Perhitungan murni untuk Hari Setelah Tanam (HST), penentuan fase dari 8 Fase Budidaya Padi, generator jadwal otomatis per lahan, kalkulator kebutuhan benih/pupuk/volume semprot & takaran per tangki (tanpa mencampuradukkan dosis per liter dan dosis per hektare), serta evaluasi kondisi tanah (pH, kelembapan, suhu).
- **Agronomy & Verified Label Knowledge Layer (`src/data/agronomyDatabase.ts`)**: Basis data produk pestisida terdaftar resmi Kementan RI (`Score 250 EC`, `Antracol 70 WP`, `Plenum 50 WG`, `Virtako 300 SC`) lengkap dengan bahan aktif, nomor registrasi, dosis label, interval pra-panen, dan kewajiban APD, serta katalog penyakit/hama dan panduan multi-komoditas.
- **AI & External Services Backend Layer (`server.ts`)**: Server Express + Vite yang menangani pemanggilan `@google/genai` (`gemini-3.8-flash`) secara server-side pada `/api/ai/diagnose` dan `/api/ai/chat`, serta proxy cuaca aktual Open-Meteo pada `/api/weather`.
- **Offline & Local Persistence Layer**: Penyimpanan persisten di browser (`localStorage`) dengan dukungan simulasi Mode Offline dan sinkronisasi data.

## 2. Struktur Direktori

```
├── server.ts                              # Backend Express + Gemini API + Open-Meteo Weather proxy
├── src/
│   ├── App.tsx                            # AppShell utama, navigasi, dan state manajemen
│   ├── types/agronomy.ts                  # Definisi tipe data TypeScript seluruh entitas
│   ├── data/agronomyDatabase.ts           # Basis pengetahuan agronomi, katalog hama, & label pestisida
│   ├── utils/
│   │   ├── agronomyCalculations.ts        # Mesin perhitungan HST, 8 fase padi, & kalkulator biaya
│   │   └── agronomyCalculations.test.ts   # Unit test (node:test) untuk logika perhitungan & validasi
│   └── components/
│       ├── VisualAssets.tsx               # Ilustrasi SVG gejala daun (Blas, Tungro, Wereng) & botol obat
│       ├── SplashAndAuthModal.tsx         # Splash Screen, Login/Daftar, & Pratinjau Papan Presentasi UI
│       ├── PlotManagerView.tsx            # Manajemen Lahan & Mesin Budidaya Padi 8 Fase
│       ├── CameraDiagnosisView.tsx        # Kamera AI, Hasil Analisis Blas, & Detail Obat Resmi
│       ├── CalendarAndWeatherView.tsx     # Kalender Tanam, Pengingat, Cuaca & Input pH Tanah Manual
│       ├── GuideAndCatalogView.tsx        # Panduan Multi-Komoditas, Konsultasi AI, & Katalog Hama
│       ├── RecordsAndCalculatorView.tsx   # Catatan Riwayat, Biaya, Panen, Kalkulator, & Ekspor CSV
│       └── ProfileAndOfflineView.tsx      # Profil Petani, Notifikasi, & Mode Offline
```

## 3. Cara Menjalankan & Menguji Aplikasi

1. **Menjalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi berjalan pada `http://localhost:3000`.
2. **Menjalankan Unit Test**:
   ```bash
   npx --yes tsx --test src/utils/agronomyCalculations.test.ts
   ```
3. **Konfigurasi Environment Variables (`.env`)**:
   - `GEMINI_API_KEY`: Kunci API Gemini (dikonfigurasi melalui panel Secrets di Google AI Studio).
   - Apabila `GEMINI_API_KEY` belum diisi atau perangkat sedang offline, aplikasi secara jujur menampilkan pemberitahuan dan beralih ke pencocokan Basis Pengetahuan Agronomi Terverifikasi agar petani tetap dapat mengakses panduan dan referensi label resmi.
