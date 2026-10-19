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

const AppContext = createContext();

const initialMockJobs = (sessionId) => [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: 'sample-5',
    session_id: sessionId,
    filename: 'Scan_Kontrak_Kerjasama_Legalisir.jpg',
    source_format: 'JPG',
    target_format: 'PDF',
    file_size: 3800000,
    result_size: 1200000,
    status: 'queued',
    progress: 12,
    created_at: new Date(Date.now() - 20 * 60000).toISOString()
  }
];

export const AppProvider = ({ children }) => {
  const [sessionId] = useState(getSessionId);
  const [supabaseStatus, setSupabaseStatus] = useState('offline');
  const [conversions, setConversions] = useState(() => {
    const saved = localStorage.getItem('placeboo_react_conversions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialMockJobs(sessionId);
  });
  const [activePreview, setActivePreview] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('placeboo_react_conversions', JSON.stringify(conversions));
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
          if (mounted && fresh && fresh.length > 0) {
            setConversions(fresh);
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
    }, 3000);
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

  const triggerDownload = (filename, content = 'Placeboo Converted Document Content') => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Mengunduh ${filename}...`);
  };

  const addJobs = async (files, targetFormat) => {
    const newItems = [];
    for (const file of files) {
      const ext = file.name.split('.').pop().toUpperCase();
      const job = {
        id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        session_id: sessionId,
        filename: file.name,
        source_format: ext,
        target_format: targetFormat,
        file_size: file.size || 1024 * 500,
        result_size: Math.floor((file.size || 1024 * 500) * 0.65),
        status: 'queued',
        progress: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      };

      if (supabaseStatus === 'connected') {
        const cloudItem = await insertJob(job);
        newItems.push(cloudItem || job);
      } else {
        newItems.push(job);
      }
    }

    setConversions(prev => [...newItems, ...prev]);
    showToast(`${newItems.length} berkas berhasil ditambahkan ke antrean.`);
  };

  const updateJobProgress = (id, progress, status) => {
    setConversions(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, progress, status };
          if (supabaseStatus === 'connected') {
            updateJobStatus(id, { progress, status });
          }
          return updated;
        }
        return item;
      })
    );
  };

  const deleteJob = async (id) => {
    setConversions(prev => prev.filter(item => item.id !== id));
    if (supabaseStatus === 'connected') {
      await deleteJobRecord(id);
    }
    showToast('Berkas dihapus.');
  };

  const purgeAll = async () => {
    setConversions([]);
    if (supabaseStatus === 'connected') {
      await purgeSessionJobs(sessionId);
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
