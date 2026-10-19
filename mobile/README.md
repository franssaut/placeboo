# Placeboo Mobile (React Native / Expo)

Aplikasi mobile resmi **Placeboo Document Converter** berbasis **React Native** dan **Expo**. Dirancang untuk pemrosesan dokumen secepat kilat langsung dari smartphone (Android & iOS) tanpa login, bebas antrean, dan didukung batas ukuran berkas hingga **50 MB**.

---

## 🚀 Fitur Utama Mobile

1. **Konverter Dokumen Multi-Format**:
   - PDF ke Excel (`.xlsx`)
   - PDF ke Word (`.docx`)
   - PDF ke Gambar Raster (`.png` / `.jpg`)
   - Gambar ke PDF
   - Excel ke PDF
   - OCR Scanner Teks AI (`.txt`)
2. **Penyimpanan & Berbagi Native**:
   - Terintegrasi dengan Sheet Berbagi Android & iOS (`expo-sharing`).
   - Berkas hasil konversi dapat langsung disimpan ke folder Unduhan perangkat atau dibagikan ke WhatsApp, Telegram, Google Drive, Email, dll.
3. **Pemilih Berkas Storage HP (`expo-document-picker`)**:
   - Memilih dokumen apa pun dari penyimpanan lokal HP atau cloud storage.
   - Pengecekan otomatis batas berkas **maksimal 50 MB**.
4. **100% Bebas Login & Privasi Zero-Retention**:
   - Tanpa akun, tanpa email, dan tanpa pelacakan data pribadi.
5. **Katalog 42+ Alat Lengkap**:
   - Navigasi tab untuk mencari dan menjelajahi seluruh kategori alat konversi.

---

## 📲 Cara Menjalankan di Smartphone

### 1. Prasyarat
- Pasang aplikasi **Expo Go** dari Google Play Store (Android) atau App Store (iOS).

### 2. Jalankan Server Pengembangan
Masuk ke folder `mobile` dan jalankan:

```bash
cd mobile
npx expo start
```

### 3. Pindai QR Code
- Di **Android**: Buka aplikasi Expo Go dan pilih **"Scan QR code"** pada terminal.
- Di **iOS**: Buka kamera bawaan iPhone dan arahkan ke QR code.

---

## 📦 Cara Build Menjadi File APK Android (Standar & Siap Pasang)

Untuk menghasilkan file installer `.apk` mandiri tanpa Expo Go:

1. Pasang EAS CLI (jika belum):
   ```bash
   npm install -g eas-cli
   ```
2. Login ke akun Expo:
   ```bash
   eas login
   ```
3. Bangun APK Preview:
   ```bash
   eas build -p android --profile preview
   ```
4. Unduh dan pasang file `.apk` langsung ke smartphone Android Anda.

---

© 2026 Placeboo Inc. Hak Cipta Dilindungi.
