import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function BatchQueue() {
  const navigate = useNavigate();
  const {
    conversions,
    updateJobProgress,
    deleteJob,
    addJobs,
    sessionId,
    showToast,
    triggerDownload
  } = useApp();

  const [isPaused, setIsPaused] = useState(false);
  const [ocrLang, setOcrLang] = useState('id'); // 'id' | 'en'
  const [compressionMode, setCompressionMode] = useState('balanced'); // 'high' | 'balanced' | 'max'
  const [emailNotify, setEmailNotify] = useState(true);
  const [gdriveSync, setGdriveSync] = useState(false);
  const fileInputRef = useRef(null);

  // Live simulation tick for queued / processing items
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      conversions.forEach((item) => {
        if (item.status === 'processing' && (item.progress || 0) < 100) {
          const nextProgress = Math.min(100, (item.progress || 0) + Math.floor(Math.random() * 8) + 5);
          const nextStatus = nextProgress >= 100 ? 'completed' : 'processing';
          updateJobProgress(item.id, nextProgress, nextStatus);
        } else if (item.status === 'queued') {
          updateJobProgress(item.id, 15, 'processing');
        }
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [conversions, isPaused, updateJobProgress]);

  const activeJobs = conversions.filter(c => c.status !== 'completed' && (c.progress || 0) < 100);
  const completedJobs = conversions.filter(c => c.status === 'completed' || (c.progress || 0) >= 100);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    addJobs(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadAllZip = () => {
    triggerDownload('Placeboo_Batch_Converted_Files.zip');
  };

  const getFormatBadgeStyle = (format) => {
    const ext = (format || 'DOC').toUpperCase();
    switch (ext) {
      case 'PDF':
        return 'bg-error-container text-error';
      case 'PPTX':
      case 'PPT':
        return 'bg-secondary-fixed text-on-secondary-fixed';
      case 'XLSX':
      case 'XLS':
      case 'CSV':
        return 'bg-emerald-500/15 text-emerald-700';
      case 'JPG':
      case 'PNG':
      case 'WEBP':
        return 'bg-cyan-500/15 text-cyan-700';
      default:
        return 'bg-surface-container text-primary';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '1.5 MB';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      <main className="w-full flex-grow py-space-xl">
        <div className="max-w-7xl mx-auto px-margin">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl pb-space-lg border-b border-surface-container">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-2">
                <span className="font-code-mono text-code-mono text-on-surface-variant flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  Sesi: #{sessionId.slice(0, 8)}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-code-mono text-code-mono text-[11px] font-semibold">
                  Sandbox Terenkripsi
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Batch Processing Queue
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {conversions.length} berkas dalam antrean • {completedJobs.length} selesai • Transcoding paralel via worker thread
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-space-sm">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Tambah Berkas
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPaused(!isPaused);
                  showToast(isPaused ? 'Melanjutkan proses transcoding...' : 'Antrean dijeda sementara', 'info');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all shadow-sm ${
                  isPaused
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPaused ? 'play_arrow' : 'pause'}
                </span>
                {isPaused ? 'Lanjutkan Semua' : 'Jeda Semua'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/riwayat-unduhan')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-sm hover:bg-primary"
              >
                <span className="material-symbols-outlined text-[18px]">folder</span>
                Buka Unduhan ({completedJobs.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
            {/* LEFT: Queue Item List (8 Cols) */}
            <div className="lg:col-span-8 space-y-space-md">
              {conversions.length === 0 ? (
                <div className="rounded-xl bg-surface-container-lowest p-12 text-center shadow-sm space-y-4">
                  <span className="material-symbols-outlined text-outline text-[48px]">cloud_queue</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Antrean Anda Saat Ini Kosong</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                    Unggah dokumen dari komputer Anda untuk memulai konversi massal berkecepatan tinggi.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md"
                  >
                    Pilih Berkas Sekarang
                  </button>
                </div>
              ) : (
                conversions.map((item, idx) => {
                  const fileName = item.filename || item.file_name || item.name || 'Dokumen_Konversi';
                  const ext = (item.source_format || 'DOC').toUpperCase();
                  const targetExt = (item.target_format || 'PDF').toUpperCase();
                  const progress = item.progress || 0;
                  const isDone = item.status === 'completed' || progress >= 100;

                  return (
                    <div
                      key={item.id || idx}
                      className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-3 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                        <div className="flex items-center gap-space-sm min-w-0">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-grab text-[20px] select-none">
                            drag_indicator
                          </span>
                          <div
                            className={`w-10 h-10 rounded-lg ${getFormatBadgeStyle(
                              ext
                            )} flex items-center justify-center flex-shrink-0 font-code-mono text-code-mono font-bold text-xs`}
                          >
                            {ext}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[220px] sm:max-w-xs md:max-w-sm">
                                {fileName}
                              </span>
                              {!isDone && (
                                <span className="material-symbols-outlined text-[16px] text-primary animate-spin">
                                  refresh
                                </span>
                              )}
                              {isDone && (
                                <span className="material-symbols-outlined text-[18px] text-tertiary">
                                  check_circle
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                              <span>{formatFileSize(item.file_size)}</span>
                              <span>•</span>
                              <span className="font-code-mono text-code-mono text-on-surface-variant">
                                Target: {targetExt}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-space-md flex-shrink-0">
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-label-sm text-label-sm font-medium ${
                                isDone
                                  ? 'bg-tertiary-container/20 text-tertiary font-semibold'
                                  : 'bg-surface-container text-primary'
                              }`}
                            >
                              {isDone
                                ? 'Selesai 100%'
                                : item.status === 'queued'
                                ? 'Menunggu Giliran'
                                : `Mengonversi (${progress}%)`}
                            </span>
                            <p className="font-code-mono text-code-mono text-on-surface-variant pt-0.5">
                              {isDone ? 'Siap Unduh' : `Sisa ~${Math.max(1, Math.round((100 - progress) / 10))}s`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isDone ? (
                              <button
                                type="button"
                                onClick={() => triggerDownload(item)}
                                className="w-9 h-9 rounded-lg bg-primary-container text-on-primary hover:bg-primary flex items-center justify-center transition-colors shadow-sm"
                                title="Unduh Hasil"
                              >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  updateJobProgress(item.id, 100, 'completed');
                                  showToast(`Konversi selesai! Berkas siap diunduh.`, 'success');
                                }}
                                className="w-9 h-9 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                                title="Selesaikan Langsung"
                              >
                                <span className="material-symbols-outlined text-[18px]">fast_forward</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteJob(item.id)}
                              className="w-9 h-9 rounded-lg bg-surface-container-low text-error hover:bg-error-container flex items-center justify-center transition-colors"
                              title="Batalkan / Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone ? 'bg-tertiary' : 'bg-primary-container'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bottom Zip Action */}
              <div className="rounded-xl bg-surface-container-low p-space-md flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined">cloud_done</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">
                      Tindakan Pasca Konversi Otomatis
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Semua berkas hasil konversi akan disatukan dalam arsip ZIP siap unduh.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">folder_zip</span>
                  Unduh Semua (.ZIP)
                </button>
              </div>
            </div>

            {/* RIGHT: Parameters & Telemetry (4 Cols) */}
            <div className="lg:col-span-4 space-y-space-md">
              <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm space-y-space-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Parameter Konversi</h3>
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">tune</span>
                </div>

                {/* OCR Settings */}
                <div className="space-y-space-sm pt-space-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                    <span>Pengenalan Teks OCR</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-code-mono text-code-mono text-[10px] font-bold uppercase">
                      Multi-Bahasa
                    </span>
                  </label>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Pilih bahasa dokumen untuk akurasi konversi pindaian gambar/tabel ke format teks.
                  </p>
                  <div className="grid grid-cols-2 gap-space-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOcrLang('id')}
                      className={`px-3 py-2 rounded-lg font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                        ocrLang === 'id'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {ocrLang === 'id' && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                      Bahasa Indonesia
                    </button>
                    <button
                      type="button"
                      onClick={() => setOcrLang('en')}
                      className={`px-3 py-2 rounded-lg font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                        ocrLang === 'en'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {ocrLang === 'en' && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                      English (US/UK)
                    </button>
                  </div>
                </div>

                {/* Compression Level */}
                <div className="space-y-space-sm pt-space-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">
                      Kompresi Dokumen Otomatis
                    </label>
                    <span className="font-code-mono text-code-mono text-primary font-bold text-xs">
                      {compressionMode === 'high' ? 'Ekstrem (48 DPI)' : compressionMode === 'balanced' ? 'Seimbang (72 DPI)' : 'Lossless (300 DPI)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs text-center font-label-sm text-label-sm">
                    <div
                      onClick={() => setCompressionMode('high')}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        compressionMode === 'high'
                          ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <p className={compressionMode === 'high' ? 'text-on-primary' : 'font-semibold text-on-surface'}>Tinggi</p>
                      <p className="font-code-mono text-code-mono text-[10px] opacity-80">Ukuran Min</p>
                    </div>
                    <div
                      onClick={() => setCompressionMode('balanced')}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        compressionMode === 'balanced'
                          ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <p className={compressionMode === 'balanced' ? 'text-on-primary' : 'font-semibold text-on-surface'}>Seimbang</p>
                      <p className="font-code-mono text-code-mono text-[10px] opacity-90">Rekomendasi</p>
                    </div>
                    <div
                      onClick={() => setCompressionMode('max')}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        compressionMode === 'max'
                          ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <p className={compressionMode === 'max' ? 'text-on-primary' : 'font-semibold text-on-surface'}>Maksimal</p>
                      <p className="font-code-mono text-code-mono text-[10px] opacity-80">Lossless HD</p>
                    </div>
                  </div>
                </div>

                {/* Automation & Distribution */}
                <div className="space-y-space-sm pt-space-xs">
                  <span className="font-label-md text-label-md text-on-surface font-semibold block">
                    Otomasi &amp; Distribusi
                  </span>
                  <label className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={emailNotify}
                      onChange={(e) => setEmailNotify(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded text-primary focus:ring-0"
                    />
                    <div className="space-y-0.5">
                      <p className="font-label-md text-label-md text-on-surface font-medium">Notifikasi Email</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Kirim tautan unduhan instan saat semua berkas selesai diproses.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={gdriveSync}
                      onChange={(e) => setGdriveSync(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded text-primary focus:ring-0"
                    />
                    <div className="space-y-0.5">
                      <p className="font-label-md text-label-md text-on-surface font-medium">Sinkronisasi Cloud Backup</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Otomatis buat salinan di folder: <code className="font-code-mono text-code-mono text-primary font-semibold">/Placeboo/Batch_2026/</code>
                      </p>
                    </div>
                  </label>
                </div>

                {/* Security Guarantee */}
                <div className="p-space-md rounded-xl bg-surface-container space-y-space-xs">
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span className="font-label-sm text-label-sm font-semibold">Jaminan Keamanan Dokumen</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Semua berkas sementara dihapus permanen dari server transcode dalam waktu <strong>60 menit</strong> secara otomatis.
                  </p>
                </div>
              </div>

              {/* Load Metrics */}
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-3">
                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className="font-semibold text-on-surface">Beban Mesin Pemrosesan</span>
                  <span className="text-tertiary font-code-mono text-code-mono font-medium">Optimal</span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm text-center">
                  <div className="p-2 rounded bg-surface-container-low">
                    <p className="font-code-mono text-code-mono text-body-lg text-primary font-bold">12 ms</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Latensi Cloud</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-low">
                    <p className="font-code-mono text-code-mono text-body-lg text-secondary font-bold">6 Core</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Transcoder Thread</p>
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
