# Placeboo - Document Converter Web App (React JS)

Platform aplikasi web modern untuk konversi, pengelolaan, optimasi, dan keamanan dokumen multi-format secara instan dengan enkripsi TLS 1.3 dan kebijakan privasi *zero-data retention*.

Proyek ini dibangun menggunakan **React 19**, **Vite**, **React Router v7**, dan **Tailwind CSS**, dengan data layer terintegrasi ke **Supabase** serta di-deploy secara otomatis di **Vercel** dan tersinkronisasi di **GitHub**.

🌐 **Live Production URL**: [https://placeboo.vercel.app](https://placeboo.vercel.app)  
📦 **GitHub Repository**: [https://github.com/franssaut/placeboo](https://github.com/franssaut/placeboo)  
🎨 **Google Stitch Project ID**: `18387929855629239932` (Tema: *Precision Slate & Indigo*)

---

## 🚀 Fitur Utama & Struktur Layar (Screens)

Aplikasi dibangun dengan arsitektur React Single Page Application (SPA) yang mencakup 4 layar utama:

### 1. Beranda Konverter Dokumen (`/`)
* **Interactive Dropzone**: Area unggah tarik-dan-lepas (*drag & drop*) yang mendukung dokumen satuan maupun multi-berkas (*Batch Mode*).
* **Format Selector**: Konversi langsung ke PDF, Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), PNG, JPG, dan OCR Teks (`.txt`).
* **Integrasi Antrean Instan**: Klik *"Mulai Konversi Sekarang"* akan menyimpan daftar berkas ke antrean Supabase/lokal dan secara otomatis mengarahkan ke halaman **Batch Queue**.
* **Statistik Realtime**: Metrik performa cloud (4.2M+ dokumen, <3.8 detik rata-rata pemrosesan, 99.98% akurasi tata letak).
* **Quick Tools Hub**: Kartu akses cepat untuk konversi terpopuler (PDF ke Word, Excel ke PDF, Gambar ke PDF, Kompres PDF, Gabung PDF, dan OCR Scanner).
* **3-Langkah Alur Kerja & Pilar Keamanan**: Penjelasan transparan proses enkripsi dan keamanan berstandar enterprise ISO 27001.

### 2. Katalog Lengkap Seluruh Alat Dokumen (`/semua-alat`)
* **42+ Utilitas Dokumen**: Katalog lengkap alat pemrosesan dokumen kantor, PDF, gambar, spreadsheet, keamanan, dan ekstraksi teks.
* **Pencarian Cepat Real-time**: Input pencarian reaktif dengan tombol reset instan.
* **Filter Berdasarkan Kategori**:
  * Semua Alat (42)
  * Konversi ke PDF
  * Konversi dari PDF
  * Organisasi Berkas
  * Optimasi & Kompresi
  * Keamanan & Legalitas
  * AI & Smart Utilities
* **One-Click Converter Activation**: Mengklik kartu alat langsung membuka konverter dengan format tujuan yang sesuai.

### 3. Batch Queue Pemrosesan (`/batch-queue`)
* **Live Batch Transformation**: Menampilkan progres unggah dan konversi total dengan animasi progres bar multi-warna gradien.
* **Cluster Telemetry**: Indikator kecepatan server live (12 ms latensi awan, 6 core transcoder threads, cluster global optimal).
* **Daftar Berkas Terperinci**: Status per berkas (*Siap Diunduh*, *Mengonversi 84%*, *Optimasi Gambar 45%*, *Analisis OCR 12%*, *Menunggu Giliran*).
* **Kontrol Antrean**: Tombol *Jeda Semua / Lanjutkan Semua*, *Tambah Berkas*, dan *Percepat Selesai*.
* **Tindakan Pasca Konversi**: Opsi unduh sekaligus dalam satu paket `.ZIP` atau langsung melihat pratinjau di halaman unduhan.
* **Parameter Konversi**: Pilihan bahasa OCR (Bahasa Indonesia / English), kompresi otomatis (Tinggi, Seimbang, Lossless HD), notifikasi email, dan sinkronisasi cloud.

### 4. Riwayat & Pratinjau Hasil Unduhan (`/riwayat-unduhan`)
* **Zero-Retention Countdown Timer**: Timer mundur pemusnahan berkas (otomatis dihapus dalam 2 jam) dengan tombol pembersihan darurat (*Hapus Semua Sekarang*).
* **Interactive Document Previewer**:
  * Pratinjau simulated spreadsheet (*Laporan Konsolidasi Finansial Placeboo Enterprise Corp*).
  * Kontrol zoom in / zoom out (70% - 150%).
  * Mode Layar Penuh (*Fullscreen Canvas*).
* **Itemized File Download Cards**:
  * Klik item untuk mengganti lembar pratinjau aktif di sebelah kiri.
  * Tombol unduh berkas individual dan hapus berkas.
* **Ekspor Cloud & Mobile QR**: Opsi simpan langsung ke Google Drive & Dropbox, serta QR Code untuk unduh di smartphone tanpa login.

---

## 🛠️ Arsitektur Kode React JS

```text
placeboo/
├── index.html                   # HTML entrypoint dengan mount <div id="root">
├── vite.config.js               # Konfigurasi Vite & @vitejs/plugin-react
├── vercel.json                  # Konfigurasi SPA rewrite untuk Vercel
├── package.json                 # Dependencies (React 19, React Router 7, Supabase JS)
├── src/
│   ├── main.jsx                 # React root mount dengan BrowserRouter & AppProvider
│   ├── App.jsx                  # Root layout, router switcher, modal & toast provider
│   ├── context/
│   │   └── AppContext.jsx       # State management global (conversions, session, toast, modal)
│   ├── services/
│   │   └── supabase.js          # Client Supabase dengan auto-fallback dan health check
│   ├── components/
│   │   ├── Navbar.jsx           # Navigasi utama, pill status sinkronisasi, drawer mobile
│   │   ├── Footer.jsx           # Footer direktori, sertifikasi ISO, selector bahasa
│   │   ├── ProModal.jsx         # Modal interaktif peningkatan paket Pro
│   │   └── Toast.jsx            # Notifikasi pop-up dinamis
│   └── pages/
│       ├── Home.jsx             # Layar 1: Beranda Konverter Dokumen
│       ├── Catalog.jsx          # Layar 2: Katalog 42+ Alat
│       ├── BatchQueue.jsx       # Layar 3: Antrean & Pemrosesan Batch
│       └── DownloadHistory.jsx  # Layar 4: Pratinjau & Riwayat Unduhan
└── supabase/
    └── schema.sql               # Skrip SQL tabel conversions & storage bucket
```

---

## ⚡ Integrasi Supabase

Aplikasi terhubung langsung dengan Supabase untuk pencatatan antrean, riwayat konversi, dan sinkronisasi real-time.

* **Project URL**: `https://hvyvumdfrnvkqmnimuot.supabase.co`
* **File Konfigurasi**: [`.env.local`](file:///c:/Users/user/Pictures/placeboo/.env.local) & [`.env`](file:///c:/Users/user/Pictures/placeboo/.env)
* **Client Library**: [`src/services/supabase.js`](file:///c:/Users/user/Pictures/placeboo/src/services/supabase.js)

### Menjalankan Skrip Schema di Supabase
Untuk membuat tabel `public.conversions` dan bucket penyimpanan `documents`:
1. Buka [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/hvyvumdfrnvkqmnimuot/sql).
2. Salin seluruh isi dari file [`supabase/schema.sql`](file:///c:/Users/user/Pictures/placeboo/supabase/schema.sql).
3. Klik **Run** untuk mengeksekusi.
4. Aplikasi akan secara otomatis mendeteksi koneksi dan mengaktifkan badge status hijau **"Supabase Terhubung"** di bagian navbar.

---

## 💻 Cara Menjalankan Secara Lokal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev

# 3. Build untuk production
npm run build
```

Buka browser di `http://localhost:5174/` (atau port yang ditampilkan di terminal).
