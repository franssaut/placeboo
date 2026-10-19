# Placeboo - Document Converter Web App

Platform aplikasi web modern untuk konversi, pengelolaan, optimasi, dan keamanan dokumen multi-format secara instan dengan enkripsi TLS 1.3 dan kebijakan privasi *zero-data retention*.

Proyek ini dibangun berdasarkan spesifikasi desain Google Stitch (**Project ID: `18387929855629239932`**) dengan tema token desain **Precision Slate & Indigo**.

🌐 **Live Production URL**: [https://placeboo.vercel.app](https://placeboo.vercel.app)

---

## 🚀 Fitur Utama & Struktur Layar (Screens)

Aplikasi terdiri dari 4 layar utama yang telah terintegrasi secara dinamis dan responsif:

### 1. Beranda Konverter Dokumen (`index.html`)
* **Interactive Dropzone**: Area unggah tarik-dan-lepas (*drag & drop*) yang mendukung dokumen satuan maupun multi-berkas (*Batch Mode*).
* **Format Selector**: Konversi langsung ke PDF, Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), PNG, JPG, dan OCR Teks (`.txt`).
* **Integrasi Antrean Instan**: Klik *"Mulai Konversi Sekarang"* akan menyimpan daftar berkas ke antrean lokal dan secara otomatis mengarahkan ke halaman **Batch Queue**.
* **Statistik Realtime**: Metrik performa cloud (4.2M+ dokumen, <3.8 detik rata-rata pemrosesan, 99.98% akurasi tata letak).
* **Quick Tools Hub**: Kartu akses cepat untuk konversi terpopuler (PDF ke Word, Excel ke PDF, Gambar ke PDF, Kompres PDF, Gabung PDF, dan OCR Scanner).
* **3-Langkah Alur Kerja & Pilar Keamanan**: Penjelasan transparan proses enkripsi dan keamanan berstandar enterprise ISO 27001.

### 2. Katalog Lengkap Seluruh Alat Dokumen (`semua-alat.html`)
* **42+ Utilitas Dokumen**: Katalog lengkap alat pemrosesan dokumen kantor, PDF, gambar, spreadsheet, keamanan, dan ekstraksi teks.
* **Pencarian Cepat Real-time**: Input pencarian dengan tombol reset instan.
* **Filter Berdasarkan Kategori**:
  * Semua Alat (42)
  * Konversi ke PDF
  * Konversi dari PDF
  * Organisasi & Kelola
  * Optimasi & Kompres
  * Keamanan & Tanda Tangan
  * OCR & Ekstraksi AI
* **One-Click Converter Activation**: Mengklik kartu alat langsung membuka konverter dengan format tujuan yang sesuai.

### 3. Batch Queue Pemrosesan (`batch-queue.html`)
* **Live Batch Transformation**: Menampilkan progres unggah dan konversi total dengan animasi progres bar multi-warna gradien.
* **Cluster Telemetry**: Indikator kecepatan server live (3.2 MB/s SG-1 Cluster, 12 ms latensi awan, 6 core transcoder threads).
* **Daftar Berkas Terperinci**: Status per berkas (*Siap Diunduh*, *Mengonversi 84%*, *Optimasi Gambar 45%*, *Analisis OCR 12%*, *Menunggu Giliran*).
* **Kontrol Antrean**: Tombol *Jeda Semua / Lanjutkan Semua*, *Batalkan Semua*, dan *Tambah Berkas*.
* **Tindakan Pasca Konversi**: Opsi unduh sekaligus dalam satu paket `.ZIP` atau langsung melihat pratinjau di halaman unduhan.
* **Parameter Konversi**: Pilihan bahasa OCR (Bahasa Indonesia / English), kompresi otomatis (Tinggi, Seimbang, Lossless HD), notifikasi email, dan sinkronisasi cloud.

### 4. Riwayat & Pratinjau Hasil Unduhan (`riwayat-unduhan.html`)
* **Zero-Retention Countdown Timer**: Timer mundur pemusnahan berkas (otomatis dihapus dalam 2 jam) dengan tombol pembersihan darurat (*Hapus Sekarang*).
* **Interactive Document Previewer**:
  * Pratinjau simulated spreadsheet (*Laporan Konsolidasi Finansial Placeboo Enterprise Corp*).
  * Kontrol zoom in / zoom out (70% - 140%).
  * Navigasi halaman dokumen (1 / 12).
  * Mode Layar Penuh (*Fullscreen Canvas*).
* **Itemized File Download Cards**:
  * Tombol *Pratinjau* yang langsung mengganti lembar pratinjau aktif di sebelah kiri.
  * Tombol *Unduh* untuk mengunduh berkas individual.
  * Tombol *Salin Tautan Terenkripsi* dengan animasi feedback toast.
  * Tombol *Hapus Berkas* dengan animasi soft fade-out.
* **Ekspor Cloud & Mobile QR**: Opsi simpan langsung ke Google Drive & Dropbox, serta QR Code untuk unduh di smartphone tanpa login.

---

## 🎨 Token Desain (Precision Slate & Indigo)

Sistem styling menggunakan konfigurasi Tailwind CSS sesuai panduan `DESIGN.md`:
* **Warna Utama (Primary)**: `#3525cd` (Indigo) & `primary-container`: `#4f46e5`
* **Warna Sekunder (Secondary)**: `#00687a` (Teal Slate) & `secondary-container`: `#57dffe`
* **Warna Aksen / Sukses (Tertiary)**: `#005338` (Emerald Deep) & `tertiary-fixed`: `#6ffbbe`
* **Latar Belakang (Surface & Background)**: `#f8f9ff` (Soft Slate White)
* **Tipografi**:
  * *Headlines & Hero*: **Plus Jakarta Sans** (SemiBold 600, Bold 700)
  * *Body & Labels*: **Inter** (Regular 400, Medium 500, SemiBold 600)
  * *Code & Badges*: **JetBrains Mono** (Medium 500)
  * *Ikon*: **Material Symbols Outlined**

---

## 📁 Struktur Direktori

```text
placeboo/
├── index.html                   # Halaman Utama / Konverter Dokumen
├── semua-alat.html              # Katalog Lengkap 42+ Alat Dokumen
├── batch-queue.html             # Layar Antrean & Pemrosesan Batch
├── riwayat-unduhan.html         # Layar Pratinjau & Unduhan Berkas
├── build_site.js                # Generator / Builder Script untuk sinkronisasi
├── package.json                 # Konfigurasi npm & server script
├── assets/
│   ├── js/
│   │   └── app.js               # Shared logic, Pro Modal, Toasts, Navigasi Mobile
│   ├── css/
│   └── screenshots/
│       ├── 01_beranda_konverter.png
│       └── 04_hasil_unduhan.png
└── stitch_document_converter_web_app/ # Sumber file desain Stitch
    ├── documorph_beranda_konverter_dokumen/
    ├── documorph_katalog_lengkap_seluruh_alat_dokumen/
    ├── documorph_batch_queue_pemrosesan/
    ├── documorph_hasil_unduhan_dokumen/
    └── precision_slate_indigo/DESIGN.md
```

---

## ⚡ Integrasi Supabase

Aplikasi terhubung langsung dengan Supabase untuk pencatatan antrean, riwayat konversi, dan sinkronisasi real-time.

* **Project URL**: `https://hvyvumdfrnvkqmnimuot.supabase.co`
* **File Konfigurasi**: [`.env.local`](file:///c:/Users/user/Pictures/placeboo/.env.local) & [`.env`](file:///c:/Users/user/Pictures/placeboo/.env)
* **Client Library**: [`assets/js/supabaseClient.js`](file:///c:/Users/user/Pictures/placeboo/assets/js/supabaseClient.js)

### Menjalankan Skrip Schema di Supabase
Untuk membuat tabel `public.conversions` dan bucket penyimpanan `documents`:
1. Buka [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/hvyvumdfrnvkqmnimuot/sql).
2. Salin seluruh isi dari file [`supabase/schema.sql`](file:///c:/Users/user/Pictures/placeboo/supabase/schema.sql).
3. Klik **Run** untuk mengeksekusi.
4. Aplikasi akan secara otomatis mendeteksi koneksi dan mengaktifkan badge status hijau **"Supabase Sync Aktif"** di bagian header.

---

## 💻 Cara Menjalankan

### Cara 1: Buka Langsung di Browser
Anda dapat langsung membuka file `index.html` dengan mengklik dua kali di File Explorer atau membukanya di browser apa pun (Google Chrome, Edge, Firefox).

### Cara 2: Menjalankan via Local Server (Rekomendasi)
Jika ingin menjalankan menggunakan local web server:

```bash
# Opsi A: Menggunakan Vite
npm run dev

# Opsi B: Menggunakan npx serve
npx serve .

# Opsi C: Menggunakan Python
python -m http.server 3000
```
Buka browser di `http://localhost:5174/` (atau port yang ditampilkan di terminal).
