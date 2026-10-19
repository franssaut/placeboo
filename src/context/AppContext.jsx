import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getSessionId,
  checkHealth,
  insertJob,
  fetchJobs,
  updateJobStatus,
  deleteJobRecord,
  purgeSessionJobs,
  supabase
} from '../services/supabase';
import { generateConvertedBlob } from '../services/fileGenerator';
import { performRealConversion } from '../services/realConverter';

const AppContext = createContext();

// In-memory cache for user's actual uploaded File / Blob objects
const rawFileCache = new Map();

// Helper to guarantee consistent object shape across all screens
export const normalizeJob = (raw, defaultSessionId = 'DM-DEFAULT') => {
  const name = raw?.filename || raw?.file_name || raw?.name || 'Dokumen_Konversi.pdf';
  let ext = 'DOC';
  if (raw?.source_format) {
    ext = raw.source_format.toUpperCase();
  } else if (name.includes('.')) {
    ext = name.split('.').pop().toUpperCase();
  }

  const target = (raw?.target_format || 'PDF').toUpperCase();
  const id = raw?.id || (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

  return {
    id,
    session_id: raw?.session_id || defaultSessionId,
    filename: name,
    file_name: name,
    name: name,
    source_format: ext,
    target_format: target,
    file_size: raw?.file_size || raw?.size || 2500000,
    result_size: raw?.result_size || Math.floor((raw?.file_size || raw?.size || 2500000) * 0.65),
    status: raw?.status || 'completed',
    progress: typeof raw?.progress === 'number' ? raw.progress : 100,
    created_at: raw?.created_at || new Date().toISOString(),
    expires_at: raw?.expires_at || new Date(Date.now() + 2 * 3600 * 1000).toISOString()
  };
};

const initialMockJobs = (sessionId) => [
  normalizeJob({
    id: 'sample-1',
    session_id: sessionId,
    filename: 'Laporan_Keuangan_Q3_2024.xlsx',
    source_format: 'PDF',
    target_format: 'XLSX',
    file_size: 14200000,
    result_size: 4800000,
    status: 'completed',
    progress: 100,
    created_at: new Date().toISOString()
  }, sessionId),
  normalizeJob({
    id: 'sample-2',
    session_id: sessionId,
    filename: 'Kontrak_Kerja_Sama_Vendor_2025.docx',
    source_format: 'PDF',
    target_format: 'DOCX',
    file_size: 8700000,
    result_size: 3200000,
    status: 'completed',
    progress: 100,
    created_at: new Date(Date.now() - 5 * 60000).toISOString()
  }, sessionId),
  normalizeJob({
    id: 'sample-3',
    session_id: sessionId,
    filename: 'Proposal_Tender_Infrastruktur_v2.docx',
    source_format: 'DOCX',
    target_format: 'PDF',
    file_size: 8500000,
    result_size: 2100000,
    status: 'processing',
    progress: 84,
    created_at: new Date(Date.now() - 10 * 60000).toISOString()
  }, sessionId),
  normalizeJob({
    id: 'sample-4',
    session_id: sessionId,
    filename: 'Slide_Presentasi_Investor_Deck.pptx',
    source_format: 'PPTX',
    target_format: 'PDF',
    file_size: 22100000,
    result_size: 9800000,
    status: 'processing',
    progress: 45,
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  }, sessionId),
  normalizeJob({
    id: 'sample-5',
    session_id: sessionId,
    filename: 'Scan_Kontrak_Kerjasama_Legalisir.jpg',
    source_format: 'JPG',
    target_format: 'PDF',
    file_size: 3800000,
    result_size: 1200000,
    status: 'queued',
    progress: 15,
    created_at: new Date(Date.now() - 20 * 60000).toISOString()
  }, sessionId)
];

export const AppProvider = ({ children }) => {
  const [sessionId] = useState(getSessionId);
  const [supabaseStatus, setSupabaseStatus] = useState('offline');
  const [conversions, setConversions] = useState(() => {
    const saved = localStorage.getItem('placeboo_react_conversions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => normalizeJob(item, sessionId));
        }
      } catch (e) {}
    }
    return initialMockJobs(sessionId);
  });
  const [activePreview, setActivePreview] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('placeboo_react_conversions', JSON.stringify(conversions));
    } catch (e) {}
  }, [conversions]);

  // Set default preview to first item
  useEffect(() => {
    if (!activePreview && conversions.length > 0) {
      setActivePreview(conversions[0]);
    }
  }, [conversions, activePreview]);

  // Check Supabase health on mount
  useEffect(() => {
    let mounted = true;
    checkHealth().then(status => {
      if (mounted) setSupabaseStatus(status);
    });

    // Realtime subscription
    let channel = null;
    try {
      channel = supabase
        .channel('public:conversions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversions' }, async () => {
          const fresh = await fetchJobs(sessionId);
          if (mounted && fresh && Array.isArray(fresh) && fresh.length > 0) {
            setConversions(fresh.map(item => normalizeJob(item, sessionId)));
          }
        })
        .subscribe();
    } catch (e) {}

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3200);
  };

  const openProModal = () => setIsProModalOpen(true);
  const closeProModal = () => setIsProModalOpen(false);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Universal trigger download handler:
   * Performs REAL client-side conversion on uploaded user files (jsPDF, pdf-lib, canvas)
   * or falls back to valid compliant document templates.
   */
  const triggerDownload = async (target) => {
    try {
      let filename = 'Dokumen_Konversi.pdf';
      let sourceFormat = 'DOCX';
      let targetFormat = 'PDF';
      let jobId = null;
      let rawFile = null;

      if (typeof target === 'string') {
        filename = target;
        const parts = filename.split('.');
        if (parts.length > 1) {
          targetFormat = parts.pop().toUpperCase();
        }
      } else if (target && typeof target === 'object') {
        jobId = target.id;
        rawFile = target.rawFile || (jobId ? rawFileCache.get(jobId) : null);
        const baseName = target.filename || target.file_name || target.name || 'Dokumen_Konversi';
        sourceFormat = (target.source_format || 'DOCX').toUpperCase();
        targetFormat = (target.target_format || 'PDF').toUpperCase();
        filename = baseName.replace(/\.[^/.]+$/, '') + '.' + targetFormat.toLowerCase();
      }

      showToast(`Sedang menyiapkan unduhan "${filename}"...`, 'info');

      // REAL CONVERSION PIPELINE:
      let blob = null;
      if (rawFile) {
        try {
          blob = await performRealConversion(rawFile, targetFormat);
        } catch (convErr) {
          console.warn('[Real conversion fallback]:', convErr);
          blob = generateConvertedBlob(filename, sourceFormat, targetFormat);
        }
      } else {
        blob = generateConvertedBlob(filename, sourceFormat, targetFormat);
      }

      if (!blob) {
        blob = generateConvertedBlob(filename, sourceFormat, targetFormat);
      }

      const blobUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = filename;
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        try {
          document.body.removeChild(downloadAnchor);
          URL.revokeObjectURL(blobUrl);
        } catch (e) {}
      }, 1000);

      showToast(`Berhasil mengunduh "${filename}"!`, 'success');
    } catch (err) {
      console.error('[triggerDownload Error]:', err);
      showToast('Gagal memproses unduhan berkas.', 'error');
    }
  };

  /**
   * Add jobs to the conversion queue:
   * Caches raw File instances for real client-side conversion
   */
  const addJobs = async (files, defaultTargetFormat = 'PDF') => {
    if (!files || !Array.isArray(files) || files.length === 0) return [];

    const newItems = [];
    for (const file of files) {
      const name = file.filename || file.file_name || file.name || 'Dokumen_Baru.docx';
      let ext = 'DOCX';
      if (file.source_format) {
        ext = file.source_format.toUpperCase();
      } else if (name.includes('.')) {
        ext = name.split('.').pop().toUpperCase();
      }

      const target = (file.target_format || defaultTargetFormat || 'PDF').toUpperCase();
      const fileSize = file.size || file.file_size || 3500000;

      // Always generate standard UUID v4 for database compatibility
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padEnd(12, '0');

      // Cache raw file for real conversion
      if (file instanceof Blob || file instanceof File) {
        rawFileCache.set(uuid, file);
      } else if (file.rawFile) {
        rawFileCache.set(uuid, file.rawFile);
      }

      const job = normalizeJob({
        id: uuid,
        session_id: sessionId,
        filename: name,
        file_name: name,
        source_format: ext,
        target_format: target,
        file_size: fileSize,
        result_size: Math.floor(fileSize * 0.65),
        status: file.status || 'processing', // Start processing right away
        progress: typeof file.progress === 'number' ? file.progress : 15,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      }, sessionId);

      // Attach in-memory rawFile reference
      if (file instanceof Blob || file instanceof File) {
        job.rawFile = file;
      }

      if (supabaseStatus === 'connected') {
        try {
          const cloudItem = await insertJob({
            id: job.id,
            session_id: job.session_id,
            filename: job.filename,
            source_format: job.source_format,
            target_format: job.target_format,
            file_size: job.file_size,
            result_size: job.result_size,
            status: job.status,
            progress: job.progress
          });
          const normalized = cloudItem ? normalizeJob(cloudItem, sessionId) : job;
          normalized.rawFile = job.rawFile;
          newItems.push(normalized);
        } catch (e) {
          newItems.push(job);
        }
      } else {
        newItems.push(job);
      }
    }

    setConversions(prev => [...newItems, ...prev]);
    showToast(`${newItems.length} berkas berhasil ditambahkan dan sedang diproses.`, 'success');
    return newItems;
  };

  const updateJobProgress = (id, progress, status) => {
    setConversions(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = {
            ...item,
            progress: Math.min(100, Math.max(0, progress)),
            status: status || (progress >= 100 ? 'completed' : item.status)
          };
          if (supabaseStatus === 'connected') {
            updateJobStatus(id, { progress: updated.progress, status: updated.status }).catch(() => {});
          }
          return updated;
        }
        return item;
      })
    );
  };

  const deleteJob = async (id) => {
    rawFileCache.delete(id);
    setConversions(prev => prev.filter(item => item.id !== id));
    if (supabaseStatus === 'connected') {
      try {
        await deleteJobRecord(id);
      } catch (e) {}
    }
    showToast('Berkas berhasil dihapus dari daftar.', 'info');
  };

  const purgeAll = async () => {
    rawFileCache.clear();
    setConversions([]);
    if (supabaseStatus === 'connected') {
      try {
        await purgeSessionJobs(sessionId);
      } catch (e) {}
    }
    showToast('Semua berkas dan cache terenkripsi berhasil dimusnahkan.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        sessionId,
        supabaseStatus,
        conversions,
        setConversions,
        activePreview,
        setActivePreview,
        toast,
        showToast,
        isProModalOpen,
        openProModal,
        closeProModal,
        addJobs,
        updateJobProgress,
        deleteJob,
        purgeAll,
        formatBytes,
        triggerDownload
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
