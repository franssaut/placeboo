import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function DownloadHistory() {
  const navigate = useNavigate();
  const {
    conversions,
    deleteJob,
    purgeAll,
    sessionId,
    showToast,
    triggerDownload
  } = useApp();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(7140); // 1h 59m

  // Countdown timer for 2h zero-retention guarantee
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(150, Math.max(70, prev + delta)));
  };

  const completedFiles = conversions.filter(c => c.status === 'completed' || (c.progress || 0) >= 100);
  const currentItem = conversions.find(c => c.id === selectedFileId) || completedFiles[0] || conversions[0];

  const handleDownloadSingle = (file) => {
    triggerDownload(file);
  };

  const handleDownloadAllZip = () => {
    triggerDownload('Placeboo_Semua_Dokumen_Terproses.zip');
  };

  const handleCloudExport = (service) => {
    showToast(`Menghubungkan ke ${service} untuk sinkronisasi otomatis...`, 'info');
  };

  const handlePurge = () => {
    if (window.confirm('Hapus seluruh berkas dan riwayat konversi sekarang? Tindakan ini tidak dapat dibatalkan.')) {
      purgeAll();
      showToast('Seluruh riwayat dan berkas telah dibersihkan secara permanen', 'info');
    }
  };

  const currentFileName = currentItem
    ? (currentItem.filename || currentItem.file_name || currentItem.name || 'Laporan_Keuangan_Q3.xlsx')
    : 'Laporan_Keuangan_Q3.xlsx';

  return (
    <div className={`min-h-screen bg-surface flex flex-col justify-between ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto bg-surface' : ''}`}>
      <main className="w-full flex-grow py-space-xl">
        <div className="max-w-7xl mx-auto px-margin space-y-space-xl">
          {/* Top Header / Retention Alert */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md border-b border-surface-container">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-code-mono text-code-mono text-on-surface-variant flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  Sesi #{sessionId.slice(0, 8)}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-code-mono text-code-mono text-[11px] font-semibold">
                  Zero Retention
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
                Hasil Unduhan &amp; Pratinjau Dokumen
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Semua dokumen telah diproses secara presisi. Berkas akan otomatis dihapus permanen dalam{' '}
                <strong className="text-primary font-code-mono">{formatCountdown(secondsRemaining)}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePurge}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container text-error hover:bg-error-container font-label-md text-label-md transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                Hapus Semua Sekarang
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-sm hover:bg-primary"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Konversi Berkas Baru
              </button>
            </div>
          </div>

          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
            {/* LEFT: Document Preview Canvas (7 Cols) */}
            <div className="lg:col-span-7 space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60 space-y-3">
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between border-b border-surface-container pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate max-w-xs">
                      {currentFileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-code-mono text-code-mono text-body-sm text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => handleZoom(-10)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                      title="Perkecil (-10%)"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-medium min-w-[50px] text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleZoom(10)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                      title="Perbesar (+10%)"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors ml-1"
                      title="Fullscreen"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isFullscreen ? 'close_fullscreen' : 'fullscreen'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Simulated High-Res Canvas */}
                <div className="relative bg-surface-container-low rounded-lg p-space-md overflow-hidden min-h-[460px] flex flex-col justify-between transition-all">
                  <div
                    className="space-y-space-md transition-transform origin-top-left"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                  >
                    {/* Header of Document */}
                    <div className="flex justify-between items-start pb-space-sm border-b border-surface-container">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">table_chart</span>
                        </div>
                        <div>
                          <div className="font-headline-sm text-headline-sm text-on-surface text-[15px] leading-tight">
                            Placeboo Enterprise Corp
                          </div>
                          <div className="font-code-mono text-body-sm text-on-surface-variant">
                            {currentFileName}
                          </div>
                        </div>
                      </div>
                      <span className="font-code-mono text-body-sm bg-tertiary-container/10 text-tertiary px-2 py-0.5 rounded font-semibold">
                        STATUS: VERIFIED
                      </span>
                    </div>

                    {/* Simulated Spreadsheet Table Grid */}
                    <div className="w-full space-y-1.5 font-code-mono text-[11px]">
                      <div className="grid grid-cols-5 gap-2 bg-surface-container-high py-1 px-2 rounded font-semibold text-on-surface">
                        <span>KODE POS</span>
                        <span>DESKRIPSI AKUN</span>
                        <span className="text-right">JULI (IDR)</span>
                        <span className="text-right">AGUSTUS (IDR)</span>
                        <span className="text-right">TOTAL Q3</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 bg-surface-container-lowest py-1 px-2 text-on-surface-variant rounded">
                        <span>101.402</span>
                        <span className="truncate">Pendapatan SaaS Cloud</span>
                        <span className="text-right">845.200.000</span>
                        <span className="text-right">912.450.000</span>
                        <span className="text-right text-tertiary font-semibold">2.684.150.000</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 bg-surface-container-low/50 py-1 px-2 text-on-surface-variant rounded">
                        <span>102.100</span>
                        <span className="truncate">Lisensi Enterprise Dedicated</span>
                        <span className="text-right">310.000.000</span>
                        <span className="text-right">340.500.000</span>
                        <span className="text-right text-tertiary font-semibold">1.025.500.000</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 bg-surface-container-lowest py-1 px-2 text-on-surface-variant rounded">
                        <span>201.050</span>
                        <span className="truncate">Beban Komputasi Cloud (AWS)</span>
                        <span className="text-right">(124.500.000)</span>
                        <span className="text-right">(138.200.000)</span>
                        <span className="text-right text-error font-semibold">(394.700.000)</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 bg-surface-container-low/50 py-1 px-2 text-on-surface-variant rounded">
                        <span>301.210</span>
                        <span className="truncate">Margin Laba Bersih Q3</span>
                        <span className="text-right">1.030.700.000</span>
                        <span className="text-right">1.114.750.000</span>
                        <span className="text-right text-primary font-bold">3.314.950.000</span>
                      </div>
                    </div>

                    {/* Financial Chart Mini Sparkline SVG */}
                    <div className="pt-2 bg-surface-container-low/40 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-body-sm text-on-surface-variant mb-1">
                        <span>Tren Pertumbuhan Triwulan</span>
                        <span className="font-code-mono text-tertiary font-semibold">+22.4% MoM</span>
                      </div>
                      <svg className="w-full h-14" fill="none" preserveAspectRatio="none" viewBox="0 0 400 60">
                        <path
                          className="fill-primary/10"
                          d="M0,50 Q40,38 80,42 T160,28 T240,32 T320,14 T400,6 L400,60 L0,60 Z"
                        />
                        <path
                          className="stroke-primary"
                          d="M0,50 Q40,38 80,42 T160,28 T240,32 T320,14 T400,6"
                          strokeLinecap="round"
                          strokeWidth="2.5"
                        />
                        <circle className="fill-primary" cx="400" cy="6" r="4" />
                      </svg>
                    </div>
                  </div>

                  {/* Watermark & Meta info */}
                  <div className="pt-4 border-t border-surface-container-high/60 flex items-center justify-between text-[11px] text-outline font-code-mono">
                    <span>Dokumen Validasi SHA-256: 7f89b0...3a88c</span>
                    <span>Halaman 1 dari 12 • High-Res 300 DPI</span>
                  </div>

                  {/* Floating Badge */}
                  <div className="absolute bottom-4 right-4 bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface px-3 py-1.5 rounded-lg flex items-center gap-2 text-body-sm shadow-md pointer-events-none">
                    <span className="material-symbols-outlined text-[16px] text-secondary-fixed">visibility</span>
                    Pratinjau Resolusi Tinggi
                  </div>
                </div>

                {/* Bottom Preview Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
                    Formula Excel &amp; Makro dipertahankan utuh tanpa distorsi cell.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentItem) handleDownloadSingle(currentItem);
                    }}
                    className="text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    Unduh Berkas Ini
                    <span className="material-symbols-outlined text-[14px]">download</span>
                  </button>
                </div>
              </div>

              {/* Itemized Conversion Cards List */}
              <div className="space-y-space-sm pt-2">
                <h3 className="font-label-md text-label-md font-semibold text-on-surface">
                  Pilih Dokumen untuk Pratinjau ({conversions.length} Berkas):
                </h3>
                <div className="space-y-2">
                  {conversions.map((file) => {
                    const isSelected = (currentItem && currentItem.id === file.id);
                    const fileTitle = file.filename || file.file_name || file.name || 'Dokumen';
                    const targetFormat = (file.target_format || 'PDF').toUpperCase();

                    return (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-primary/5 border-primary/40 shadow-sm'
                            : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center font-code-mono text-xs font-bold text-primary flex-shrink-0">
                            {(file.source_format || 'DOC').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-md text-label-md font-semibold text-on-surface truncate">
                              {fileTitle}
                            </p>
                            <p className="font-code-mono text-[11px] text-on-surface-variant">
                              Target: {targetFormat} • {file.status === 'completed' || (file.progress || 0) >= 100 ? 'Selesai' : 'Sedang Diproses'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(file);
                            }}
                            className="p-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors shadow-sm"
                            title="Unduh Berkas Ini"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJob(file.id);
                            }}
                            className="p-2 rounded-lg bg-surface-container text-error hover:bg-error-container transition-colors"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Download Controls & Cloud Export (5 Cols) */}
            <div className="lg:col-span-5 space-y-space-md">
              {/* Primary Batch Download Action Card */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md border border-surface-container-high/60">
                <div>
                  <span className="font-code-mono text-code-mono text-primary font-semibold tracking-wide uppercase">
                    Paket Berkas Lengkap
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mt-1">
                    Siap Diunduh Sekaligus
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Seluruh {conversions.length} dokumen telah dikemas rapi dalam satu arsip terkompresi ZIP yang aman.
                  </p>
                </div>

                {/* Big Primary Action Button */}
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="w-full flex items-center justify-between px-space-md py-3.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">folder_zip</span>
                    </div>
                    <div className="text-left">
                      <div className="font-label-md text-label-md font-semibold leading-tight">
                        Unduh Semua Berkas
                      </div>
                      <div className="font-code-mono text-body-sm text-on-primary-container">
                        Format .ZIP • Arsip Lengkap
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[24px] group-hover:translate-y-0.5 transition-transform">
                    arrow_downward
                  </span>
                </button>

                {/* Direct Cloud Export Options */}
                <div className="pt-space-xs space-y-2">
                  <div className="text-body-sm font-label-sm text-on-surface-variant font-medium">
                    Atau simpan langsung ke cloud storage Anda:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCloudExport('Google Drive')}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container hover:text-on-surface text-on-surface transition-colors font-label-sm text-label-sm"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 87.3 78">
                        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA" />
                        <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 50 0 51.55 0 53.1h27.5L43.65 25z" fill="#00AC47" />
                        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.95 10.3 7.8 13.5z" fill="#EA4335" />
                        <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2L43.65 25z" fill="#00832D" />
                        <path d="M59.8 53.1H87.3c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28.1z" fill="#2684FC" />
                        <path d="M73.55 76.8L59.8 53.1H27.5l13.75 23.8c1.35.8 2.9 1.2 4.45 1.2h23.5c1.55 0 3.1-.4 4.35-1.3z" fill="#FFBA00" />
                      </svg>
                      Google Drive
                    </button>
                    <button
                      onClick={() => handleCloudExport('Dropbox')}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container hover:text-on-surface text-on-surface transition-colors font-label-sm text-label-sm"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="#0061FE" viewBox="0 0 24 24">
                        <path d="M6 2l-6 4 6 4 6-4-6-4zm12 0l-6 4 6 4 6-4-6-4zM0 14l6 4 6-4-6-4-6 4zm18-4l-6 4 6 4 6-4-6-4zM6 19.5l6-4-6-4-6 4 6 4zm12 0l6-4-6-4-6 4 6 4z" />
                      </svg>
                      Dropbox
                    </button>
                  </div>
                </div>

                {/* Direct QR Code Download Card for Mobile */}
                <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between gap-space-md">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
                      <span className="material-symbols-outlined text-[15px]">smartphone</span>
                      Download di HP Cepat
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Pindai QR ini untuk mengunduh semua berkas langsung ke smartphone tanpa login.
                    </p>
                    <span className="font-code-mono text-[11px] text-tertiary">
                      Enkripsi Token Berlaku 1 Jam
                    </span>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg shadow-sm flex-shrink-0">
                    <svg className="w-20 h-20" fill="none" viewBox="0 0 100 100">
                      <rect fill="white" height="100" width="100" />
                      <rect fill="#0B1C30" height="24" width="24" x="10" y="10" />
                      <rect fill="white" height="16" width="16" x="14" y="14" />
                      <rect fill="#4F46E5" height="8" width="8" x="18" y="18" />
                      <rect fill="#0B1C30" height="24" width="24" x="66" y="10" />
                      <rect fill="white" height="16" width="16" x="70" y="14" />
                      <rect fill="#4F46E5" height="8" width="8" x="74" y="18" />
                      <rect fill="#0B1C30" height="24" width="24" x="10" y="66" />
                      <rect fill="white" height="16" width="16" x="14" y="70" />
                      <rect fill="#4F46E5" height="8" width="8" x="18" y="74" />
                      <rect fill="#0B1C30" height="6" width="6" x="38" y="12" />
                      <rect fill="#0B1C30" height="6" width="8" x="48" y="18" />
                      <rect fill="#4F46E5" height="6" width="18" x="38" y="28" />
                      <rect fill="#0B1C30" height="8" width="8" x="14" y="42" />
                      <rect fill="#0B1C30" height="14" width="6" x="28" y="44" />
                      <rect fill="#0B1C30" height="16" width="16" x="42" y="40" />
                      <rect fill="#0B1C30" height="6" width="10" x="64" y="42" />
                      <rect fill="#0B1C30" height="10" width="8" x="80" y="40" />
                      <rect fill="#0B1C30" height="6" width="12" x="40" y="64" />
                      <rect fill="#4F46E5" height="10" width="14" x="42" y="78" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Security & Compliance Checklist */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
                <div className="font-label-md text-label-md font-semibold text-on-surface">
                  Sertifikasi &amp; Keamanan Privasi
                </div>
                <div className="space-y-2 text-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                    <span>Terenkripsi AES-256 Bit saat transmisi &amp; penyimpanan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                    <span>Pembersihan memori otomatis sesuai standar GDPR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                    <span>Tidak ada salinan berkas tersimpan di cache CDN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
