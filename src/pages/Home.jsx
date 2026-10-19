import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { addJobs, formatBytes, showToast, triggerDownload, convertAndCacheBlob } = useApp();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [targetFormat, setTargetFormat] = useState('DOCX');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConvertingHome, setIsConvertingHome] = useState(false);
  const [homeProgress, setHomeProgress] = useState(0);
  const [lastConvertedJob, setLastConvertedJob] = useState(null);

  useEffect(() => {
    const fmt = searchParams.get('format') || searchParams.get('target');
    if (fmt) {
      setTargetFormat(fmt.toUpperCase());
    }
  }, [searchParams]);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFileSelect = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    // Validate 50MB file size limit
    const oversized = rawFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      showToast(
        `Berkas "${oversized[0].name}" melebihi batas maksimal 50 MB (${formatBytes(oversized[0].size)}).`,
        'error'
      );
    }

    const files = rawFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    if (!files.length) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLastConvertedJob(null);
    setIsConvertingHome(false);

    const ext = files[0].name.includes('.') ? files[0].name.split('.').pop().toLowerCase() : '';
    if (ext === 'pdf' && targetFormat.toUpperCase() === 'PDF') {
      setTargetFormat('DOCX');
    } else if (['jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx', 'txt'].includes(ext) && targetFormat.toLowerCase() === ext) {
      setTargetFormat('PDF');
    }

    setSelectedFiles([files[0]]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const rawFiles = Array.from(e.dataTransfer.files || []);
    if (!rawFiles.length) return;

    // Validate 50MB file size limit
    const oversized = rawFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      showToast(
        `Berkas "${oversized[0].name}" melebihi batas maksimal 50 MB (${formatBytes(oversized[0].size)}).`,
        'error'
      );
    }

    const files = rawFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    if (!files.length) return;

    setLastConvertedJob(null);
    setIsConvertingHome(false);

    const ext = files[0].name.includes('.') ? files[0].name.split('.').pop().toLowerCase() : '';
    if (ext === 'pdf' && targetFormat.toUpperCase() === 'PDF') {
      setTargetFormat('DOCX');
    } else if (['jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx', 'txt'].includes(ext) && targetFormat.toLowerCase() === ext) {
      setTargetFormat('PDF');
    }

    setSelectedFiles([files[0]]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      setLastConvertedJob(null);
      setIsConvertingHome(false);
    }
  };

  const handleStartConversion = async () => {
    let filesToProcess = selectedFiles;
    if (filesToProcess.length === 0) {
      showToast('Pilih berkas dari komputer atau tarik ke sini terlebih dahulu', 'warning');
      fileInputRef.current?.click();
      return;
    }

    // Run REAL conversion immediately
    setIsConvertingHome(true);
    setHomeProgress(10);

    try {
      // Step 1: Register the job and cache the raw file
      setHomeProgress(15);
      const createdJobs = await addJobs(filesToProcess, targetFormat);
      const currentJob = createdJobs[0] || {
        name: filesToProcess[0].name,
        filename: filesToProcess[0].name,
        source_format: 'DOCX',
        target_format: targetFormat
      };

      // Attach the raw file directly
      if (filesToProcess[0]) {
        currentJob.rawFile = filesToProcess[0];
      }

      setHomeProgress(30);

      // Step 2: Run the REAL conversion NOW (not on download)
      const resultBlob = await convertAndCacheBlob(
        filesToProcess[0],           // actual raw File from user
        targetFormat,                // target format
        currentJob.id                // job id for caching
      );

      setHomeProgress(85);

      if (resultBlob && resultBlob.size > 0) {
        setHomeProgress(100);
        setIsConvertingHome(false);
        setLastConvertedJob(currentJob);
        showToast('Konversi berhasil! Berkas siap diunduh.', 'success');
      } else {
        throw new Error('Conversion produced empty result');
      }
    } catch (err) {
      console.error('[handleStartConversion Error]:', err);
      setHomeProgress(0);
      setIsConvertingHome(false);
      showToast('Gagal mengonversi berkas. Silakan coba lagi atau pilih format target lain.', 'error');
    }
  };

  const handleQuickDownload = (job) => {
    if (!job) return;
    triggerDownload(job);
  };

  const triggerCloudPick = (service) => {
    showToast(`Membuka pemilih berkas aman dari ${service}...`, 'info');
    setTimeout(() => {
      const sampleBlob = new Blob(['Cloud Document Content'], { type: 'text/plain' });
      const sampleFile = new File([sampleBlob], `Laporan_Finansial_${service.replace(/\s+/g, '')}.xlsx`, { type: 'text/csv' });
      setSelectedFiles([sampleFile]);
      showToast(`Berkas dari ${service} berhasil diimpor!`, 'success');
    }, 600);
  };

  return (
    <main className="w-full pt-16 flex-1 bg-surface">
      <div className="flex flex-col w-full">
        {/* Ambient Glow */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-primary/10 via-secondary-fixed/30 to-surface-tint/5 blur-3xl pointer-events-none -z-10 rounded-full"></div>

          {/* Hero Content */}
          <div className="max-w-7xl mx-auto px-margin pt-space-xl pb-space-lg">
            <div className="text-center max-w-3xl mx-auto space-y-space-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-primary font-code-mono text-code-mono font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Placeboo Core v4.8 • Cloud Engine Tercepat
              </div>
              <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight">
                Ubah Dokumen Apapun Secara{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Instan &amp; Aman
                </span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                Konversi dokumen presisi mikron antar PDF, Word, Excel, PPTX, JPG, EPUB, hingga OCR ekstraksi teks pintar.
                Dilindungi enkripsi TLS 256-bit dan garansi auto-hapus permanen setelah 2 jam.
              </p>
            </div>

            {/* Main Converter Hub & Dropzone */}
            <div className="mt-space-xl max-w-4xl mx-auto">
              <div className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden border border-outline-variant/15">
                {/* Controller Top Bar */}
                <div className="bg-surface-container-low px-space-lg py-space-sm flex flex-wrap items-center justify-between gap-space-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                    </div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Konversi Dokumen Instan
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">transform</span>
                      Konversi ke:
                    </span>
                    <div className="relative">
                      <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value)}
                        className="appearance-none bg-surface-container-lowest pl-3 pr-8 py-1.5 rounded-lg text-on-surface font-code-mono text-code-mono font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      >
                        <option value="PDF">PDF (.pdf)</option>
                        <option value="DOCX">WORD (.docx)</option>
                        <option value="XLSX">EXCEL (.xlsx)</option>
                        <option value="PPTX">PPT (.pptx)</option>
                        <option value="PNG">PNG Image (.png)</option>
                        <option value="JPG">JPG Image (.jpg)</option>
                        <option value="TXT">TXT / OCR (.txt)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dropzone Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`p-space-xl transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer m-space-md rounded-xl bg-surface-container-lowest group border-2 border-dashed ${
                    isDragging
                      ? 'border-primary bg-primary-fixed/20 scale-[0.99]'
                      : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center mb-space-md group-hover:scale-105 group-hover:bg-primary-fixed transition-all duration-300">
                    <span className="material-symbols-outlined text-[44px]">cloud_upload</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-semibold">
                    Tarik &amp; Lepaskan berkas Anda ke sini
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
                    Mendukung lebih dari 200+ format dokumen, spreadsheet, presentasi, dan gambar resolusi penuh.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-space-md" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_circle</span>
                      Pilih Berkas dari Komputer
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple={false}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Cloud Import */}
                  <div
                    className="mt-space-lg pt-space-md flex flex-wrap items-center justify-center gap-space-sm text-on-surface-variant"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-label-sm text-label-sm text-outline">Atau impor dari:</span>
                    <button
                      type="button"
                      onClick={() => triggerCloudPick('Google Drive')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px] text-tertiary">add_to_drive</span>
                      Google Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerCloudPick('Dropbox')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">cloud</span>
                      Dropbox
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerCloudPick('URL Web')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      URL Langsung
                    </button>
                  </div>

                  {/* File Queue List */}
                  {selectedFiles.length > 0 && (
                    <div className="w-full mt-space-lg text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="font-label-sm text-label-sm text-on-surface font-semibold mb-space-sm flex items-center justify-between">
                        <span>Daftar Berkas Siap Konversi ({selectedFiles.length} berkas)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFiles([]);
                            setLastConvertedJob(null);
                            setIsConvertingHome(false);
                          }}
                          className="text-error hover:underline font-code-mono text-body-sm"
                        >
                          Hapus Semua
                        </button>
                      </div>

                      <div className="space-y-space-xs max-h-56 overflow-y-auto pr-1">
                        {selectedFiles.map((file, idx) => {
                          const ext = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'DOC';
                          return (
                            <div
                              key={idx}
                              className="bg-surface-container-low px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-on-surface"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-code-mono text-code-mono font-bold text-[11px]">
                                  {ext}
                                </span>
                                <div className="truncate">
                                  <p className="font-body-md text-body-md font-medium truncate">{file.name}</p>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                                    {formatBytes(file.size)} • Target:{' '}
                                    <span className="font-semibold text-primary">{targetFormat}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-code-mono text-code-mono text-tertiary flex items-center gap-1 font-medium text-[12px]">
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span> Siap
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="text-on-surface-variant hover:text-error transition-colors p-1"
                                  title="Batalkan berkas"
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Converting Progress Bar if Converting */}
                      {isConvertingHome && (
                        <div className="mt-space-md p-space-md bg-surface-container rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-body-sm">
                            <span className="font-semibold text-primary flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                              Mengonversi berkas ke format {targetFormat}...
                            </span>
                            <span className="font-code-mono text-primary font-bold">{homeProgress}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${homeProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Instant Download Action Banner if Converted */}
                      {lastConvertedJob && (
                        <div className="mt-space-md p-space-md bg-tertiary-container/10 border border-tertiary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center">
                              <span className="material-symbols-outlined text-[22px]">check</span>
                            </div>
                            <div>
                              <p className="font-label-md text-label-md font-semibold text-on-surface">
                                Konversi Selesai!
                              </p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant font-code-mono">
                                Siap diunduh sebagai berkas .{targetFormat.toLowerCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleQuickDownload(lastConvertedJob)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md shadow-md transition-all active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                              Unduh Berkas Sekarang
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Convert Button */}
                      {!lastConvertedJob && !isConvertingHome && (
                        <div className="mt-space-md flex flex-col sm:flex-row items-center justify-between bg-surface-container-low p-space-md rounded-lg gap-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[20px]">task_alt</span>
                            <span className="font-body-sm text-body-sm text-on-surface">
                              Siap dieksekusi dengan mesin Placeboo Cloud Cluster
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleStartConversion}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95 shadow-md w-full sm:w-auto justify-center"
                          >
                            <span className="material-symbols-outlined text-[18px]">bolt</span>
                            Mulai Konversi Sekarang
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="bg-surface-container-low/70 px-space-lg py-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">lock</span>
                    <span>Gratis hingga <strong>50 MB</strong> per berkas. Enkripsi end-to-end terjamin.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">history</span>
                    <span>Penghapusan otomatis tanpa jejak dalam 2 jam.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Metrics Strip */}
        <div className="w-full bg-surface-container-low py-space-md mt-space-lg border-y border-outline-variant/15">
          <div className="max-w-7xl mx-auto px-margin flex flex-wrap items-center justify-around gap-space-md text-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">insert_drive_file</span>
              </div>
              <div className="text-left">
                <p className="font-headline-sm text-headline-sm text-on-surface font-bold">4.2M+</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Dokumen Sukses Bulan Ini</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">speed</span>
              </div>
              <div className="text-left">
                <p className="font-headline-sm text-headline-sm text-on-surface font-bold">&lt; 3.8 Detik</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Rata-rata Durasi Pemrosesan</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">star</span>
              </div>
              <div className="text-left">
                <p className="font-headline-sm text-headline-sm text-on-surface font-bold">4.9 / 5.0</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Skor Kepuasan 68K+ Profesional</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div className="text-left">
                <p className="font-headline-sm text-headline-sm text-on-surface font-bold">99.98%</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Akurasi Tata Letak Format</p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Quick Tools Hub */}
        <section className="max-w-7xl mx-auto px-margin py-space-xl w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-lg">
            <div>
              <span className="font-code-mono text-code-mono text-primary uppercase tracking-wider font-semibold">
                Akses Cepat Sekali Klik
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 font-bold">
                Alat Konversi Terpopuler
              </h2>
            </div>
            <Link
              to="/semua-alat"
              className="font-label-md text-label-md text-primary hover:text-primary-container font-semibold flex items-center gap-1 group"
            >
              Jelajahi Semua 42+ Alat Dokumen
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[
              { title: 'PDF ke Word', tag: 'PDF → DOCX', desc: 'Ekstraksi dokumen teks dan tata letak tabel yang tetap dapat disunting dengan presisi 100%.', icon: 'article', format: 'DOCX', bg: 'bg-surface-container text-primary' },
              { title: 'PDF ke Gambar', tag: 'PDF → JPG/PNG', desc: 'Ekstrak setiap halaman berkas PDF menjadi gambar raster resolusi tinggi (PNG/JPG) tajam 300 DPI.', icon: 'photo_library', format: 'PNG', bg: 'bg-cyan-500/15 text-cyan-700' },
              { title: 'Gambar ke PDF', tag: 'IMG → PDF', desc: 'Gabungkan album foto, pindaian kuitansi, atau diagram berformat JPG/PNG dalam satu berkas PDF.', icon: 'image', format: 'PDF', bg: 'bg-secondary-fixed text-secondary' },
              { title: 'Excel ke PDF', tag: 'XLSX → PDF', desc: 'Ubah tabel spreadsheet dan formula rumit menjadi dokumen PDF siap cetak dengan margin rapi.', icon: 'table_chart', format: 'PDF', bg: 'bg-tertiary-fixed text-tertiary' },
              { title: 'Gabung Berkas PDF', tag: 'MULTI-PAGE', desc: 'Satukan puluhan lembar PDF acak menjadi satu bundel portofolio rapi dengan urutan halaman kustom.', icon: 'call_merge', format: 'PDF', bg: 'bg-surface-container-high text-primary' },
              { title: 'OCR Scanner AI', tag: 'AI VISION', desc: 'Deteksi dan ekstrak teks dari pindaian foto kuitansi atau dokumen fisik ke format teks murni siap salin.', icon: 'document_scanner', format: 'TXT', bg: 'bg-secondary-fixed text-secondary' }
            ].map((tool, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setTargetFormat(tool.format);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                  fileInputRef.current?.click();
                  showToast(`Alat "${tool.title}" aktif. Pilih berkas untuk dikonversi.`, 'info');
                }}
                className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group block cursor-pointer border border-outline-variant/15"
              >
                <div className="flex items-start justify-between mb-space-md">
                  <div className={`w-12 h-12 rounded-lg ${tool.bg} flex items-center justify-center transition-colors`}>
                    <span className="material-symbols-outlined text-[28px]">{tool.icon}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-code-mono text-code-mono text-on-surface-variant font-semibold text-xs">
                    {tool.tag}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors font-semibold">
                  {tool.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  {tool.desc}
                </p>
                <div className="mt-space-md flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                  <span>Gunakan Sekarang</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Step Bento Workflow */}
        <section className="w-full bg-surface-container-low py-space-xl border-y border-outline-variant/15">
          <div className="max-w-7xl mx-auto px-margin">
            <div className="text-center max-w-2xl mx-auto mb-space-xl">
              <span className="font-code-mono text-code-mono text-primary uppercase tracking-wider font-semibold">
                Alur Kerja Tanpa Hambatan
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 font-bold">
                Konversi Dalam 3 Langkah Sederhana
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                Dirancang efisien agar Anda dapat kembali fokus ke pekerjaan utama tanpa terbebani teknis format.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-outline-variant/15">
                <span className="absolute top-3 right-4 font-display-hero text-display-hero text-surface-container font-black select-none pointer-events-none opacity-40">
                  01
                </span>
                <div className="space-y-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">upload_file</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    1. Unggah Berkas
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Tarik dan letakkan dokumen satuan atau puluhan berkas sekaligus dari komputer maupun cloud storage Anda.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center gap-1.5 font-code-mono text-code-mono text-xs text-tertiary font-medium">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Enkripsi Otomatis TLS 1.3
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-outline-variant/15">
                <span className="absolute top-3 right-4 font-display-hero text-display-hero text-surface-container font-black select-none pointer-events-none opacity-40">
                  02
                </span>
                <div className="space-y-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">precision_manufacturing</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    2. Transcoding Presisi
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Mesin cloud Placeboo merekonstruksi struktur teks, tata letak, dan vektor dengan akurasi 99.98%.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center gap-1.5 font-code-mono text-code-mono text-xs text-primary font-medium">
                  <span className="material-symbols-outlined text-[16px]">memory</span>
                  Sandbox Komputasi Terisolasi
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-outline-variant/15">
                <span className="absolute top-3 right-4 font-display-hero text-display-hero text-surface-container font-black select-none pointer-events-none opacity-40">
                  03
                </span>
                <div className="space-y-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">download_for_offline</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    3. Unduh &amp; Auto-Purge
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Unduh berkas individual atau paket ZIP. Seluruh data di server dihapus permanen dalam 2 jam secara otomatis.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center gap-1.5 font-code-mono text-code-mono text-xs text-secondary font-medium">
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  Zero-Knowledge Guarantee
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Security Trust Pillars */}
        <section className="max-w-7xl mx-auto px-margin py-space-xl">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-outline-variant/15 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
              <div className="lg:col-span-5 space-y-space-sm">
                <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary font-code-mono text-code-mono font-bold text-xs uppercase tracking-wider">
                  Standar Industri Enterprise
                </span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                  Keamanan Dokumen Tanpa Kompromi
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Kami mengerti bahwa dokumen bisnis, faktur keuangan, dan berkas identitas Anda sangat rahasia.
                  Infrastruktur Placeboo didesain dengan prinsip nihil retensi (*Zero Data Retention*).
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-space-xs">
                  <div className="flex items-center gap-2 text-primary font-semibold font-label-md">
                    <span className="material-symbols-outlined text-[20px]">encrypted</span>
                    Enkripsi TLS 1.3 &amp; AES-256
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Semua transmisi berkas diamankan dengan protokol enkripsi militer tingkat perbankan.
                  </p>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-space-xs">
                  <div className="flex items-center gap-2 text-tertiary font-semibold font-label-md">
                    <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                    Penghapusan Otomatis 2 Jam
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Sistem pembersihan cronjob membersihkan berkas sementara secara permanen dari server transcode.
                  </p>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-space-xs">
                  <div className="flex items-center gap-2 text-secondary font-semibold font-label-md">
                    <span className="material-symbols-outlined text-[20px]">shield</span>
                    Kepatuhan Regulasi GDPR
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Tidak ada pelacakan identitas, pembacaan konten rahasia, maupun pembagian ke pihak ketiga.
                  </p>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-space-xs">
                  <div className="flex items-center gap-2 text-on-surface font-semibold font-label-md">
                    <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                    Supabase Realtime Sync
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Dukungan sinkronisasi database cloud Supabase dengan fallback penyimpanan lokal otomatis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
