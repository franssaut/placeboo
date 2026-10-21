import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { getPdfJs, readFileAsArrayBuffer, readFileAsDataURL } from '../services/realConverter';

export default function MobilePWAConverter() {
  const [activeMode, setActiveMode] = useState('pdf_to_image'); // 'pdf_to_image' | 'image_to_pdf'

  // PDF to Image state
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [targetFormat, setTargetFormat] = useState('PNG'); // 'PNG' | 'JPG'
  const [renderDpi, setRenderDpi] = useState('300'); // '600' (Master HD) | '300' (Ultra HD) | '200' (Tinggi) | '150' (Standar)
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfPages, setPdfPages] = useState([]); // array of { pageNumber, blob, url, name }
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [selectedPageIndices, setSelectedPageIndices] = useState([]);
  const pdfInputRef = useRef(null);

  // Image to PDF state
  const [selectedImages, setSelectedImages] = useState([]); // array of { file, previewUrl, name, size }
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [convertedPdfResult, setConvertedPdfResult] = useState(null); // { blob, url, name, size }
  const imgInputRef = useRef(null);

  const MAX_IMAGES_LIMIT = 20;

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      pdfPages.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      selectedImages.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
      if (convertedPdfResult?.url) URL.revokeObjectURL(convertedPdfResult.url);
    };
  }, []);

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Switch between PDF to Image and Image to PDF
  const handleSwitchMode = (mode) => {
    setActiveMode(mode);
    setPdfPages([]);
    setSelectedPageIndices([]);
    setSelectedPdf(null);
    setConvertedPdfResult(null);
    setActivePageIdx(0);
  };

  // ----------------------------------------------------
  // 1. PDF TO IMAGE LOGIC (Separate Page Rendering)
  // ----------------------------------------------------
  const handlePdfFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Silakan pilih berkas dokumen berformat PDF.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Ukuran berkas melebihi batas maksimal 50 MB.');
      return;
    }

    setSelectedPdf(file);
    setPdfPages([]);
    setSelectedPageIndices([]);
    setActivePageIdx(0);
  };

  const handleConvertPdfToImages = async () => {
    if (!selectedPdf) return;

    setIsConvertingPdf(true);
    setPdfProgress(10);

    try {
      const buffer = await readFileAsArrayBuffer(selectedPdf);
      setPdfProgress(25);

      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/standard_fonts/'
      });

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      setPdfProgress(40);

      const mime = targetFormat === 'JPG' ? 'image/jpeg' : 'image/png';
      const ext = targetFormat.toLowerCase();
      const baseName = selectedPdf.name.replace(/\.[^/.]+$/, '');
      const rendered = [];

      // Determine DPI & base scaling (600 DPI = ~8.333, 300 DPI = ~4.166, 200 DPI = ~2.77, 150 DPI = ~2.08)
      const selectedDpiNum = renderDpi === '600' ? 600 : renderDpi === '300' ? 300 : renderDpi === '200' ? 200 : 150;
      const baseScale = selectedDpiNum / 72;

      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);

        // Memory protection guard: clamp scale if dimension exceeds 8192px (fits A4 at 600 DPI which is 7016px)
        let pageScale = baseScale;
        const rawVp = page.getViewport({ scale: 1.0 });
        const maxDim = Math.max(rawVp.width, rawVp.height) || 842;
        if (maxDim * pageScale > 8192) {
          pageScale = 8192 / maxDim;
        }

        const viewport = page.getViewport({ scale: pageScale, rotation: page.rotate });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Optimized 2D context with hardware smoothing
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Pure white background for maximum readability and clean printing
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render with print intent & annotation storage for crisp glyphs, stamps, vector forms
        await page.render({
          canvasContext: ctx,
          viewport,
          intent: 'print',
          annotationMode: pdfjs.AnnotationMode?.ENABLE_STORAGE ?? 3
        }).promise;

        // 98% quality for JPG to eliminate compression noise while preserving small text
        const jpegQuality = 0.98;
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, mime, targetFormat === 'JPG' ? jpegQuality : undefined)
        );
        const url = URL.createObjectURL(blob);

        rendered.push({
          pageNumber: p,
          blob,
          url,
          name: `${baseName}_halaman_${p}.${ext}`,
          width: canvas.width,
          height: canvas.height,
          dpi: selectedDpiNum
        });

        const progressVal = Math.round(40 + (p / numPages) * 55);
        setPdfProgress(progressVal);
      }

      setPdfPages(rendered);
      setSelectedPageIndices(rendered.map((_, i) => i)); // Default select all
      setActivePageIdx(0);
    } catch (err) {
      console.error('[PDF to Image Error]:', err);
      alert('Gagal mengonversi PDF: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsConvertingPdf(false);
      setPdfProgress(0);
    }
  };

  const togglePageSelection = (idx) => {
    setSelectedPageIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const handleDownloadSinglePage = (pageIdx) => {
    const page = pdfPages[pageIdx];
    if (!page) return;
    const a = document.createElement('a');
    a.href = page.url;
    a.download = page.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSelectedPages = async () => {
    const selected = pdfPages.filter((_, idx) => selectedPageIndices.includes(idx));
    if (selected.length === 0) {
      alert('Silakan pilih minimal 1 halaman untuk di-download.');
      return;
    }

    // Trigger sequential download for each selected page
    for (let i = 0; i < selected.length; i++) {
      const page = selected[i];
      const a = document.createElement('a');
      a.href = page.url;
      a.download = page.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  const handleSharePageWhatsApp = async (pageIdx) => {
    const page = pdfPages[pageIdx];
    if (!page) return;

    // Check if navigator.share with files is supported
    const file = new File([page.blob], page.name, { type: page.blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Halaman ${page.pageNumber} - Placeboo`,
          text: `Hasil konversi PDF Halaman ${page.pageNumber}`
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    // Fallback: download file and open WhatsApp
    handleDownloadSinglePage(pageIdx);
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(`Dokumen Halaman ${page.pageNumber} telah diunduh dari Placeboo.`), '_blank');
  };

  const handleShareSelectedWhatsApp = async () => {
    const selected = pdfPages.filter((_, idx) => selectedPageIndices.includes(idx));
    if (selected.length === 0) {
      alert('Silakan pilih minimal 1 halaman terlebih dahulu.');
      return;
    }

    const files = selected.map(
      (p) => new File([p.blob], p.name, { type: p.blob.type })
    );

    if (navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({
          files,
          title: 'Halaman Terpilih - Placeboo',
          text: `Hasil konversi ${selected.length} halaman dokumen Placeboo`
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    // Fallback: download all selected and open WhatsApp
    await handleDownloadSelectedPages();
    alert(`Semua ${selected.length} foto telah diunduh ke HP Anda! Sekarang membuka WhatsApp agar Anda dapat melampirkannya.`);
    window.open('https://api.whatsapp.com/send', '_blank');
  };

  // ----------------------------------------------------
  // 2. IMAGE TO PDF LOGIC
  // ----------------------------------------------------
  const handleImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES_LIMIT - selectedImages.length;
    if (remaining <= 0) {
      alert(`Batas maksimal ${MAX_IMAGES_LIMIT} gambar telah tercapai.`);
      return;
    }

    const validFiles = files.slice(0, remaining).filter((f) => f.type.startsWith('image/'));
    const newItems = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setSelectedImages((prev) => [...prev, ...newItems]);
    setConvertedPdfResult(null);
  };

  const handleRemoveImage = (idx) => {
    setSelectedImages((prev) => {
      const target = prev[idx];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
    setConvertedPdfResult(null);
  };

  const handleClearImages = () => {
    selectedImages.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
    setConvertedPdfResult(null);
  };

  const handleConvertImagesToPdf = async () => {
    if (selectedImages.length === 0) return;

    setIsConvertingImg(true);
    setImgProgress(15);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const usableW = pageWidth - margin * 2;
      const usableH = pageHeight - margin * 2;

      for (let i = 0; i < selectedImages.length; i++) {
        if (i > 0) doc.addPage();

        const imgItem = selectedImages[i];
        const dataUrl = await readFileAsDataURL(imgItem.file);

        // Load image to calculate aspect ratio
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = dataUrl;
        });

        const aspect = img.width / img.height;
        let w = usableW;
        let h = usableW / aspect;

        if (h > usableH) {
          h = usableH;
          w = usableH * aspect;
        }

        const x = margin + (usableW - w) / 2;
        const y = margin + (usableH - h) / 2;
        const fmt = imgItem.file.type.includes('png') ? 'PNG' : 'JPEG';

        doc.addImage(dataUrl, fmt, x, y, w, h);

        const p = Math.round(15 + ((i + 1) / selectedImages.length) * 80);
        setImgProgress(p);
      }

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const cleanName = selectedImages[0].name.replace(/\.[^/.]+$/, '');

      setConvertedPdfResult({
        blob: pdfBlob,
        url: pdfUrl,
        name: `${cleanName}_koleksi.pdf`,
        size: pdfBlob.size
      });
    } catch (err) {
      console.error('[Image to PDF Error]:', err);
      alert('Gagal menggabungkan gambar ke PDF: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsConvertingImg(false);
      setImgProgress(0);
    }
  };

  const handleDownloadPdfResult = () => {
    if (!convertedPdfResult) return;
    const a = document.createElement('a');
    a.href = convertedPdfResult.url;
    a.download = convertedPdfResult.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSharePdfWhatsApp = async () => {
    if (!convertedPdfResult) return;

    const file = new File([convertedPdfResult.blob], convertedPdfResult.name, {
      type: 'application/pdf'
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: convertedPdfResult.name,
          text: 'Berkas PDF hasil penggabungan gambar dari Placeboo'
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    // Fallback: download and open WhatsApp
    handleDownloadPdfResult();
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(`Berkas ${convertedPdfResult.name} telah diunduh dari Placeboo.`), '_blank');
  };

  // ----------------------------------------------------
  // RENDER PWA MOBILE UI
  // ----------------------------------------------------
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 sm:py-6">
      {/* 1. Header Title & Badge */}
      <div className="text-center mb-5 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Placeboo Mascot"
          className="w-16 h-16 object-contain mb-2 drop-shadow-md hover:scale-105 transition-transform"
        />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Placeboo Mobile PWA
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
          {activeMode === 'pdf_to_image' ? 'Konversi PDF ke Gambar' : 'Konversi Gambar ke PDF'}
        </h1>
        <p className="text-xs text-on-surface-variant mt-1">
          {activeMode === 'pdf_to_image'
            ? 'Ubah berkas PDF jadi lembar gambar terpisah (PNG/JPG)'
            : 'Gabungkan hingga 20 foto dari HP menjadi 1 file PDF'}
        </p>
      </div>

      {/* 2. Mode Switcher Segmented Tabs */}
      <div className="flex rounded-xl bg-surface-container p-1 mb-5 border border-outline-variant/30">
        <button
          type="button"
          onClick={() => handleSwitchMode('pdf_to_image')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeMode === 'pdf_to_image'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">photo_library</span>
          <span>PDF ke Gambar</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('image_to_pdf')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeMode === 'image_to_pdf'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          <span>Gambar ke PDF</span>
        </button>
      </div>

      {/* 3. Main Action Container */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/20 space-y-4">
        {/* ==================================================== */}
        {/* MODE 1: PDF KE GAMBAR                               */}
        {/* ==================================================== */}
        {activeMode === 'pdf_to_image' && (
          <>
            {/* Upload Area or Selected File */}
            {!selectedPdf ? (
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">picture_as_pdf</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface mb-1">Pilih Berkas PDF</h3>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Ketuk untuk memilih file PDF dari HP (Maks. 50 MB)
                </p>
                <input
                  type="file"
                  ref={pdfInputRef}
                  accept=".pdf,application/pdf"
                  onChange={handlePdfFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-on-surface truncate">{selectedPdf.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatBytes(selectedPdf.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdf(null);
                      setPdfPages([]);
                    }}
                    className="text-on-surface-variant hover:text-red-500 p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <input
                    type="file"
                    ref={pdfInputRef}
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Target Format Options */}
            {!pdfPages.length && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Format Gambar Output:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetFormat('PNG')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      targetFormat === 'PNG'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">image</span>
                    <span>PNG (Resolusi Tinggi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetFormat('JPG')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      targetFormat === 'JPG'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">photo</span>
                    <span>JPG (Ukuran Ringan)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Resolution & DPI Quality Selector */}
            {!pdfPages.length && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface">Resolusi &amp; Ketajaman Teks:</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                    {renderDpi === '600'
                      ? 'Master HD (600 DPI)'
                      : renderDpi === '300'
                      ? 'Ultra HD (300 DPI)'
                      : renderDpi === '200'
                      ? 'Tinggi (200 DPI)'
                      : 'Standar (150 DPI)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRenderDpi('600')}
                    className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      renderDpi === '600'
                        ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-amber-300">verified</span>
                      <span>Master HD</span>
                    </span>
                    <span className={`text-[10px] font-normal ${renderDpi === '600' ? 'text-white/85' : 'text-on-surface-variant'}`}>
                      600 DPI (Arsip)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenderDpi('300')}
                    className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      renderDpi === '300'
                        ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">high_quality</span>
                      <span>Ultra HD</span>
                    </span>
                    <span className={`text-[10px] font-normal ${renderDpi === '300' ? 'text-white/85' : 'text-on-surface-variant'}`}>
                      300 DPI (Cetak)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenderDpi('200')}
                    className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      renderDpi === '200'
                        ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">hd</span>
                      <span>Tinggi</span>
                    </span>
                    <span className={`text-[10px] font-normal ${renderDpi === '200' ? 'text-white/85' : 'text-on-surface-variant'}`}>
                      200 DPI (Tajam)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenderDpi('150')}
                    className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      renderDpi === '150'
                        ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">speed</span>
                      <span>Standar</span>
                    </span>
                    <span className={`text-[10px] font-normal ${renderDpi === '150' ? 'text-white/85' : 'text-on-surface-variant'}`}>
                      150 DPI (Cepat)
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Convert Button */}
            {!pdfPages.length && (
              <button
                type="button"
                disabled={!selectedPdf || isConvertingPdf}
                onClick={handleConvertPdfToImages}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isConvertingPdf ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    <span>Mengonversi Halaman ({pdfProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Konversi PDF ke Gambar Sekarang</span>
                  </>
                )}
              </button>
            )}

            {/* RESULTS: MULTI-PAGE RENDERED CARDS */}
            {pdfPages.length > 0 && (
              <div className="space-y-4 pt-2">
                {/* Active Preview */}
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface">Pratinjau Hasil Dokumen:</span>
                    <div className="flex items-center gap-1.5">
                      {pdfPages[activePageIdx]?.width && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                          {pdfPages[activePageIdx].width}×{pdfPages[activePageIdx].height} px • {pdfPages[activePageIdx].dpi || 300} DPI
                        </span>
                      )}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Hal {activePageIdx + 1} / {pdfPages.length}
                      </span>
                    </div>
                  </div>

                  {/* Navigation prev/next */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      type="button"
                      disabled={activePageIdx === 0}
                      onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container disabled:opacity-40 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      <span>Sebelumnya</span>
                    </button>

                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Halaman {activePageIdx + 1}
                    </span>

                    <button
                      type="button"
                      disabled={activePageIdx >= pdfPages.length - 1}
                      onClick={() => setActivePageIdx((p) => Math.min(pdfPages.length - 1, p + 1))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container disabled:opacity-40 flex items-center gap-1"
                    >
                      <span>Berikutnya</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>

                  <div className="w-full bg-white rounded-lg overflow-hidden border border-outline-variant/20 flex items-center justify-center p-1">
                    <img
                      src={pdfPages[activePageIdx]?.url}
                      alt={`Halaman ${activePageIdx + 1}`}
                      className="max-h-72 w-auto object-contain mx-auto"
                    />
                  </div>
                </div>

                {/* Page Selection Strip */}
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">checklist</span>
                      <span className="text-xs font-bold text-on-surface">
                        Pilih Lembar ({selectedPageIndices.length}/{pdfPages.length} Terpilih)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPageIndices.length === pdfPages.length) {
                          setSelectedPageIndices([]);
                        } else {
                          setSelectedPageIndices(pdfPages.map((_, i) => i));
                        }
                      }}
                      className="text-[11px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10"
                    >
                      {selectedPageIndices.length === pdfPages.length ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  <p className="text-[11px] text-on-surface-variant">
                    Ketuk lembar halaman untuk mencentang yang ingin Anda unduh / kirim:
                  </p>

                  {/* Horizontal Scroll Cards */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                    {pdfPages.map((page, idx) => {
                      const isSelected = selectedPageIndices.includes(idx);
                      const isActive = idx === activePageIdx;

                      return (
                        <div
                          key={idx}
                          className={`flex-shrink-0 w-28 bg-white rounded-xl p-2 border-2 transition-all space-y-1.5 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/30'
                              : 'border-outline-variant/30'
                          } ${isActive ? 'ring-2 ring-primary/40' : ''}`}
                        >
                          <div
                            onClick={() => {
                              setActivePageIdx(idx);
                              togglePageSelection(idx);
                            }}
                            className="cursor-pointer relative"
                          >
                            <img
                              src={page.url}
                              alt={`Hal ${page.pageNumber}`}
                              className="w-full h-28 object-contain bg-surface-container rounded"
                            />
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Hal {page.pageNumber}
                            </span>
                            <span
                              className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] ${
                                isSelected ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                            >
                              {isSelected ? '✓' : '+'}
                            </span>
                          </div>

                          {/* Individual Action Row */}
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadSinglePage(idx)}
                              className="flex-1 py-1 rounded bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-[12px]">download</span>
                              <span>Unduh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSharePageWhatsApp(idx)}
                              className="flex-1 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center gap-0.5"
                            >
                              <span>WA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Batch Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* Download All Selected */}
                  <button
                    type="button"
                    disabled={selectedPageIndices.length === 0}
                    onClick={handleDownloadSelectedPages}
                    className="w-full py-3 px-4 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    <span>
                      {selectedPageIndices.length === pdfPages.length
                        ? `Download Semua (${pdfPages.length}) Halaman Langsung`
                        : selectedPageIndices.length > 0
                        ? `Download (${selectedPageIndices.length}) Halaman yang Dipilih Langsung`
                        : 'Pilih Halaman untuk Di-download'}
                    </span>
                  </button>

                  {/* Share Selected to WhatsApp */}
                  <button
                    type="button"
                    disabled={selectedPageIndices.length === 0}
                    onClick={handleShareSelectedWhatsApp}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <span>
                      {selectedPageIndices.length === pdfPages.length
                        ? 'Kirim Semua Halaman ke WhatsApp'
                        : `Kirim (${selectedPageIndices.length}) Halaman Terpilih ke WhatsApp`}
                    </span>
                  </button>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdf(null);
                      setPdfPages([]);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-surface-container text-on-surface-variant font-semibold text-xs hover:bg-surface-container-high flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>Konversi Dokumen Lain</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* MODE 2: GAMBAR KE PDF                               */}
        {/* ==================================================== */}
        {activeMode === 'image_to_pdf' && (
          <>
            {/* Upload Area */}
            {selectedImages.length === 0 ? (
              <div
                onClick={() => imgInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface mb-1">Pilih Gambar (Maks. 20)</h3>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Bisa pilih banyak foto sekaligus (JPG, PNG, WEBP). Semua akan digabung menjadi 1 file PDF.
                </p>
                <input
                  type="file"
                  ref={imgInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleImagesSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header Controls */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">
                    {selectedImages.length} dari {MAX_IMAGES_LIMIT} Gambar Dipilih
                  </span>

                  <div className="flex items-center gap-2">
                    {selectedImages.length < MAX_IMAGES_LIMIT && (
                      <button
                        type="button"
                        onClick={() => imgInputRef.current?.click()}
                        className="text-[11px] font-bold text-primary px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Tambah</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearImages}
                      className="text-[11px] font-bold text-red-600 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100"
                    >
                      Hapus Semua
                    </button>
                    <input
                      type="file"
                      ref={imgInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handleImagesSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Grid of Image Thumbnails */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border border-outline-variant/20 rounded-xl bg-surface-container-low">
                  {selectedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden bg-white border border-outline-variant/30 group"
                    >
                      <img src={img.previewUrl} alt={img.name} className="w-full h-20 object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Action Convert Button */}
                {!convertedPdfResult && (
                  <button
                    type="button"
                    disabled={isConvertingImg}
                    onClick={handleConvertImagesToPdf}
                    className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {isConvertingImg ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        <span>Menggabungkan ({imgProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                        <span>Gabungkan {selectedImages.length} Foto Menjadi 1 PDF</span>
                      </>
                    )}
                  </button>
                )}

                {/* Converted PDF Result */}
                {convertedPdfResult && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[22px]">check_circle</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-emerald-950 truncate">{convertedPdfResult.name}</p>
                        <p className="text-[10px] text-emerald-700">
                          {selectedImages.length} halaman digabung • {formatBytes(convertedPdfResult.size)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadPdfResult}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Download Berkas PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSharePdfWhatsApp}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-md hover:bg-emerald-800 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        <span>Kirim PDF ke WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearImages}
                        className="w-full py-2 px-4 rounded-xl bg-white text-on-surface-variant font-semibold text-xs border border-outline-variant/30 hover:bg-gray-50 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Gabungkan Gambar Lain</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
