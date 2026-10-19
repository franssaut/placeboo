import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Catalog() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Semua Kategori', count: 42, icon: 'apps' },
    { id: 'to-pdf', label: 'Konversi ke PDF', count: 8, icon: 'picture_as_pdf' },
    { id: 'from-pdf', label: 'Konversi dari PDF', count: 7, icon: 'swap_horiz' },
    { id: 'organize', label: 'Organisasi Berkas', count: 9, icon: 'folder_copy' },
    { id: 'optimize', label: 'Optimasi & Kompresi', count: 6, icon: 'speed' },
    { id: 'security', label: 'Keamanan & Legalitas', count: 6, icon: 'verified_user' },
    { id: 'ai', label: 'AI & Smart Utilities', count: 6, icon: 'psychology' },
  ];

  const toolsData = useMemo(() => [
    // To PDF
    {
      id: 'word-to-pdf',
      title: 'Word ke PDF',
      description: 'Ubah berkas DOC dan DOCX ke dokumen PDF standar cetak secara instan dengan presisi layout 100%.',
      category: 'to-pdf',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'article',
      iconBg: 'bg-blue-500/10 text-blue-600',
      tagColor: 'bg-blue-600',
      flow: 'DOCX → PDF',
      defaultExt: 'docx',
      target: 'pdf'
    },
    {
      id: 'excel-to-pdf',
      title: 'Excel ke PDF',
      description: 'Ubah sheet tabel XLSX dan XLS menjadi lembaran PDF rapi dengan penyesuaian margin otomatis.',
      category: 'to-pdf',
      badge: 'Auto-Fit Page',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'table_chart',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      tagColor: 'bg-emerald-600',
      flow: 'XLSX → PDF',
      defaultExt: 'xlsx',
      target: 'pdf'
    },
    {
      id: 'ppt-to-pdf',
      title: 'PPT ke PDF',
      description: 'Konversi slide PowerPoint PPTX menjadi format berkas presentasi PDF yang tajam dan mudah dibagikan.',
      category: 'to-pdf',
      badge: 'Vector Support',
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed',
      icon: 'slideshow',
      iconBg: 'bg-orange-500/10 text-orange-600',
      tagColor: 'bg-orange-600',
      flow: 'PPTX → PDF',
      defaultExt: 'pptx',
      target: 'pdf'
    },
    {
      id: 'jpg-to-pdf',
      title: 'JPG ke PDF',
      description: 'Satukan ratusan file foto JPG/JPEG menjadi satu buku PDF rapi dengan orientasi dan margin kustom.',
      category: 'to-pdf',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'photo_library',
      iconBg: 'bg-cyan-500/10 text-cyan-600',
      tagColor: 'bg-cyan-600',
      flow: 'JPG → PDF',
      defaultExt: 'jpg',
      target: 'pdf'
    },
    {
      id: 'png-to-pdf',
      title: 'PNG ke PDF',
      description: 'Pertahankan transparansi latar belakang PNG ke dalam tata letak dokumen PDF berstandar cetak.',
      category: 'to-pdf',
      badge: 'Alpha Channel',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'image',
      iconBg: 'bg-cyan-500/10 text-cyan-600',
      tagColor: 'bg-cyan-600',
      flow: 'PNG → PDF',
      defaultExt: 'png',
      target: 'pdf'
    },
    {
      id: 'heic-to-pdf',
      title: 'HEIC ke PDF / JPG',
      description: 'Buka dan ubah format foto eksklusif iPhone / iOS (HEIC) menjadi dokumen PDF atau gambar JPG universal.',
      category: 'to-pdf',
      badge: 'Baru',
      badgeClass: 'bg-primary-fixed text-on-primary-fixed',
      icon: 'phone_iphone',
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      tagColor: 'bg-indigo-600',
      flow: 'HEIC → PDF',
      defaultExt: 'heic',
      target: 'pdf'
    },

    // From PDF
    {
      id: 'pdf-to-word',
      title: 'PDF ke Word (DOCX)',
      description: 'Ekstrak konten PDF menjadi file Word yang sepenuhnya dapat diedit dengan preservasi paragraf dan font.',
      category: 'from-pdf',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'picture_as_pdf',
      iconBg: 'bg-rose-500/10 text-rose-600',
      tagColor: 'bg-rose-600',
      flow: 'PDF → DOCX',
      defaultExt: 'pdf',
      target: 'docx'
    },
    {
      id: 'pdf-to-excel',
      title: 'PDF ke Excel',
      description: 'Deteksi otomatis kisi tabel keuangan dan faktur dari PDF langsung menjadi kolom baris Excel yang hidup.',
      category: 'from-pdf',
      badge: 'Baru',
      badgeClass: 'bg-primary-fixed text-on-primary-fixed',
      icon: 'view_kanban',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      tagColor: 'bg-emerald-600',
      flow: 'PDF → XLSX',
      defaultExt: 'pdf',
      target: 'xlsx'
    },
    {
      id: 'pdf-to-ppt',
      title: 'PDF ke PowerPoint',
      description: 'Ubah setiap lembar dokumen PDF kembali menjadi susunan slide presentasi PPTX yang dapat direvisi.',
      category: 'from-pdf',
      badge: 'Multi-Page',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'co_present',
      iconBg: 'bg-orange-500/10 text-orange-600',
      tagColor: 'bg-orange-600',
      flow: 'PDF → PPTX',
      defaultExt: 'pdf',
      target: 'pptx'
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF ke JPG High-Res',
      description: 'Ekstrak setiap halaman PDF menjadi foto JPG beresolusi ultra-tinggi untuk kebutuhan publikasi cetak.',
      category: 'from-pdf',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'photo_library',
      iconBg: 'bg-cyan-500/10 text-cyan-600',
      tagColor: 'bg-cyan-600',
      flow: 'PDF → JPG/PNG',
      defaultExt: 'pdf',
      target: 'png'
    },
    {
      id: 'webp-converter',
      title: 'WEBP Converter',
      description: 'Transkode gambar WEBP generasi baru ke PDF, PNG, atau JPG tanpa penurunan kualitas visual.',
      category: 'from-pdf',
      badge: 'Web Optimized',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'wb_cloudy',
      iconBg: 'bg-teal-500/10 text-teal-600',
      tagColor: 'bg-teal-600',
      flow: 'WEBP ↔ PDF/JPG',
      defaultExt: 'webp',
      target: 'png'
    },

    // Organize
    {
      id: 'merge-pdf',
      title: 'Gabungkan PDF',
      description: 'Kombinasikan beberapa berkas PDF terpisah menjadi satu dokumen utuh dengan urutan kustom.',
      category: 'organize',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'call_merge',
      iconBg: 'bg-rose-500/10 text-rose-600',
      tagColor: 'bg-rose-600',
      flow: 'Unlimited Pages',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'split-pdf',
      title: 'Pisahkan Halaman PDF',
      description: 'Pisahkan halaman tertentu atau pecah seluruh dokumen PDF menjadi berkas-berkas mandiri.',
      category: 'organize',
      badge: 'Batch Split',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono font-semibold',
      icon: 'call_split',
      iconBg: 'bg-rose-500/10 text-rose-600',
      tagColor: 'bg-rose-600',
      flow: 'Visual Range Selector',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'rotate-pdf',
      title: 'Putar Halaman PDF',
      description: 'Koreksi orientasi lembar dokumen yang miring atau terbalik ke mode portrait maupun landscape.',
      category: 'organize',
      badge: '90° / 180° / 270°',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'rotate_right',
      iconBg: 'bg-rose-500/10 text-rose-600',
      tagColor: 'bg-rose-600',
      flow: 'Semua atau Pilihan',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'delete-pages',
      title: 'Hapus Halaman Spesifik',
      description: 'Buang halaman kosong, lembar tanda tangan ganda, atau lampiran yang tidak diinginkan dari PDF Anda.',
      category: 'organize',
      badge: 'Quick Purge',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'delete_sweep',
      iconBg: 'bg-rose-500/10 text-rose-600',
      tagColor: 'bg-rose-600',
      flow: 'Thumbnail Preview',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'reorder-pages',
      title: 'Urutkan Ulang Halaman',
      description: 'Susun tata urutan berkas secara visual melalui kanvas drag-and-drop interaktif berkecepatan tinggi.',
      category: 'organize',
      badge: 'Baru',
      badgeClass: 'bg-primary-fixed text-on-primary-fixed',
      icon: 'reorder',
      iconBg: 'bg-rose-500/10 text-rose-600',
      tagColor: 'bg-rose-600',
      flow: 'Interactive Drag',
      defaultExt: 'pdf',
      target: 'pdf'
    },

    // Optimize
    {
      id: 'compress-pdf',
      title: 'Kompres Ukuran PDF',
      description: 'Reduksi hingga 90% bobot berkas PDF tanpa mengurangi keterbacaan teks dan ketajaman gambar.',
      category: 'optimize',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'compress',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      tagColor: 'bg-emerald-600',
      flow: '-85% Avg Ratio',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'repair-pdf',
      title: 'Perbaiki Dokumen Rusak',
      description: 'Analisis dan pulihkan struktur data internal dokumen PDF yang korup, rusak, atau gagal dibuka.',
      category: 'optimize',
      badge: 'Hex Reconstruction',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'healing',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      tagColor: 'bg-emerald-600',
      flow: 'Deep Parser Engine',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'cmyk-print',
      title: 'Optimasi Format Cetak',
      description: 'Konversi profil warna RGB ke CMYK serta standardisasi PDF/X untuk kelancaran percetakan profesional.',
      category: 'optimize',
      badge: 'Baru',
      badgeClass: 'bg-primary-fixed text-on-primary-fixed',
      icon: 'print',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      tagColor: 'bg-emerald-600',
      flow: 'PDF/X Prepress Ready',
      defaultExt: 'pdf',
      target: 'pdf'
    },

    // Security
    {
      id: 'lock-pdf',
      title: 'Kunci & Enkripsi Sandi',
      description: 'Terapkan kata sandi kuat serta batasan izin salin, cetak, dan sunting terhadap dokumen rahasia Anda.',
      category: 'security',
      badge: 'AES-256 Bit',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'lock',
      iconBg: 'bg-primary-container/10 text-primary-container',
      tagColor: 'bg-primary-container',
      flow: 'Standard Military Grade',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'unlock-pdf',
      title: 'Buka Proteksi PDF',
      description: 'Hilangkan pembatasan izin keamanan pada dokumen PDF milik Anda sendiri untuk kemudahan akses penuh.',
      category: 'security',
      badge: 'Fast Decrypt',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'lock_open',
      iconBg: 'bg-primary-container/10 text-primary-container',
      tagColor: 'bg-primary-container',
      flow: 'Pemilik Sah Dokumen',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'esign-pdf',
      title: 'Tanda Tangan Digital (e-Sign)',
      description: 'Bubuhi tanda tangan elektronik tersertifikasi atau gambar tanda tangan tangan Anda pada kontrak resmi.',
      category: 'security',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'draw',
      iconBg: 'bg-primary-container/10 text-primary-container',
      tagColor: 'bg-primary-container',
      flow: 'Timestamp & Audit Log',
      defaultExt: 'pdf',
      target: 'pdf'
    },
    {
      id: 'watermark-pdf',
      title: 'Beri Watermark Kustom',
      description: 'Tambahkan cap air teks kustom atau stempel logo berbayang untuk memproteksi hak kekayaan intelektual.',
      category: 'security',
      badge: 'Custom Stamp',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'branding_watermark',
      iconBg: 'bg-primary-container/10 text-primary-container',
      tagColor: 'bg-primary-container',
      flow: 'Rotasi & Opasitas Bebas',
      defaultExt: 'pdf',
      target: 'pdf'
    },

    // AI
    {
      id: 'ocr-scanner',
      title: 'Scan OCR Multi-Bahasa',
      description: 'Pindai dokumen hasil foto atau scanner menjadi teks digital yang dapat disalin dengan akurasi 99.4%.',
      category: 'ai',
      badge: 'Paling Populer',
      badgeClass: 'bg-amber-500/15 text-amber-800',
      icon: 'document_scanner',
      iconBg: 'bg-purple-500/10 text-purple-600',
      tagColor: 'bg-purple-600',
      flow: 'Mendukung 118 Bahasa',
      defaultExt: 'png',
      target: 'txt'
    },
    {
      id: 'ai-summary',
      title: 'Ringkas Dokumen AI',
      description: 'Dapatkan poin-poin eksekutif, tabel kesimpulan, dan tanya-jawab instan dari ratusan lembar berkas PDF.',
      category: 'ai',
      badge: 'Baru',
      badgeClass: 'bg-primary-fixed text-on-primary-fixed',
      icon: 'auto_awesome',
      iconBg: 'bg-purple-500/10 text-purple-600',
      tagColor: 'bg-purple-600',
      flow: 'LLM Deep Digest',
      defaultExt: 'pdf',
      target: 'docx'
    },
    {
      id: 'ai-table-extract',
      title: 'Ekstrak Tabel PDF ke CSV',
      description: 'Konversi otomatis matriks laporan keuangan, neraca, dan faktur menjadi file CSV terstruktur siap olah.',
      category: 'ai',
      badge: 'Vision AI Engine',
      badgeClass: 'bg-surface-container text-on-surface-variant font-code-mono',
      icon: 'dataset',
      iconBg: 'bg-purple-500/10 text-purple-600',
      tagColor: 'bg-purple-600',
      flow: 'Zero Alignment Drift',
      defaultExt: 'pdf',
      target: 'csv'
    }
  ], []);

  const filteredTools = useMemo(() => {
    return toolsData.filter(tool => {
      const matchCat = activeCategory === 'all' || tool.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat;
      const matchText = tool.title.toLowerCase().includes(query) ||
                        tool.description.toLowerCase().includes(query) ||
                        tool.flow.toLowerCase().includes(query);
      return matchCat && matchText;
    });
  }, [toolsData, activeCategory, searchQuery]);

  const handleToolClick = (tool) => {
    showToast(`Membuka alat "${tool.title}"...`, 'info');
    navigate(`/?tool=${tool.id}&target=${tool.target}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      <main className="w-full flex-grow">
        {/* Header Hero Section */}
        <div className="w-full bg-surface-container-low border-b border-surface-container py-space-xl">
          <div className="max-w-7xl mx-auto px-margin">
            <div className="max-w-3xl space-y-space-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                Direktori Ekstensif
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Katalog Lengkap Seluruh Alat Dokumen
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Pilih dari 42+ modul transcoding tingkat industri. Dirancang untuk kecepatan instan, keamanan zero-retention, dan kompatibilitas format tanpa celah.
              </p>

              {/* Live Search Bar */}
              <div className="pt-space-xs relative">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[22px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari alat (misal: 'Word ke PDF', 'Kompres', 'OCR', 'Excel')..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 shadow-sm border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 text-on-surface-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Tab Navigation */}
        <div className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-container-high py-3">
          <div className="max-w-7xl mx-auto px-margin overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-code-mono ${
                        isActive
                          ? 'bg-on-primary/20 text-on-primary'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tools Content Grid */}
        <div className="max-w-7xl mx-auto px-margin py-space-xl">
          {filteredTools.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl p-8 max-w-xl mx-auto">
              <span className="material-symbols-outlined text-outline text-[48px] mb-2">search_off</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Tidak ada alat yang cocok</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Kata kunci &ldquo;{searchQuery}&rdquo; tidak ditemukan pada kategori ini. Silakan coba kata kunci lain.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-4 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-space-xl">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Menampilkan <strong className="text-on-surface">{filteredTools.length}</strong> alat konversi
                </span>
                <span className="font-code-mono text-code-mono text-tertiary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  Semua Mesin Online
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="group bg-surface-container-lowest p-space-md rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 border border-transparent transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-space-sm">
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-lg ${tool.iconBg} flex items-center justify-center`}>
                          <span className="material-symbols-outlined text-[26px]">{tool.icon}</span>
                        </div>
                        {tool.badge && (
                          <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${tool.badgeClass}`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                        {tool.description}
                      </p>
                    </div>

                    <div className="pt-space-md flex items-center justify-between text-on-surface-variant font-code-mono text-code-mono mt-4 border-t border-surface-container-high/40">
                      <span className="flex items-center gap-1.5">
                        {tool.tagColor && <span className={`w-2 h-2 rounded-full ${tool.tagColor}`}></span>}
                        {tool.flow}
                      </span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1.5 transition-transform text-primary">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Performance Visualizer / Reliability Metrics */}
          <div className="mt-space-xl p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-center justify-between gap-space-lg">
            <div className="space-y-space-xs max-w-xl">
              <span className="font-code-mono text-code-mono text-tertiary flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> Cluster Cloud Global Aktif
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Kapasitas Mesin Transcoding Otomatis</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Seluruh konversi diproses di sandbox terisolasi tanpa jejak permanen. Bebas antrean dengan alokasi memori khusus.
              </p>
            </div>
            <div className="flex items-center gap-space-md flex-shrink-0">
              <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg">
                <svg className="w-12 h-12 -rotate-90 text-primary" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="98, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">99.98%</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Ketersediaan Sistem</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[24px]">timer</span>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">&lt; 1.8s</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Rata-rata Eksekusi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
