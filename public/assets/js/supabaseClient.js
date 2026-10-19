/**
 * Placeboo / DocuMorph - Supabase Client Integration
 * Connects Document Converter directly to Supabase Database (conversions table) & Storage.
 */

const SUPABASE_URL = 'https://hvyvumdfrnvkqmnimuot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eXZ1bWRmcm52a3FtbmltdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MjU2MDcsImV4cCI6MjEwNzIwMTYwN30.5p430JniYNxcSzrvqEKqUgVgt7AQdFiCVWhiCWMTp3Y';

let supabaseClient = null;
let isSupabaseOnline = false;
let isTableAvailable = false;

// Generate or retrieve persistent Session ID
function getSessionId() {
  let sid = localStorage.getItem('placeboo_session_id');
  if (!sid) {
    sid = 'DM-' + Math.floor(10000 + Math.random() * 90000);
    localStorage.setItem('placeboo_session_id', sid);
  }
  return sid;
}

// Initialize Supabase Client
function initSupabase() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }
      });
      checkSupabaseHealth();
    } catch (e) {
      console.warn('[Placeboo Supabase] Client init error:', e);
    }
  } else {
    // Retry once script loads
    window.addEventListener('load', () => {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        checkSupabaseHealth();
      }
    });
  }
}

// Health check to detect if conversions table exists
async function checkSupabaseHealth() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('conversions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find')) {
        isTableAvailable = false;
        isSupabaseOnline = true;
        updateSupabaseBadge('schema_pending');
      } else {
        isTableAvailable = false;
        isSupabaseOnline = false;
        updateSupabaseBadge('error');
      }
    } else {
      isTableAvailable = true;
      isSupabaseOnline = true;
      updateSupabaseBadge('connected');
      subscribeToRealtime();
    }
  } catch (err) {
    isSupabaseOnline = false;
    updateSupabaseBadge('offline');
  }
}

// UI Status Badge in Header
function updateSupabaseBadge(status) {
  let badge = document.getElementById('supabase-status-badge');
  if (!badge) {
    const headerTools = document.querySelector('header .flex.items-center.gap-space-md');
    if (!headerTools) return;

    badge = document.createElement('div');
    badge.id = 'supabase-status-badge';
    badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm cursor-pointer transition-all';
    headerTools.insertBefore(badge, headerTools.firstChild);
  }

  if (status === 'connected') {
    badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm bg-tertiary-container/15 text-tertiary border border-tertiary/20';
    badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span> Supabase Sync Aktif';
    badge.title = 'Terhubung ke Supabase Database & Realtime Sync';
    badge.onclick = () => showToast('Database Supabase aktif & tersinkronisasi secara real-time!');
  } else if (status === 'schema_pending') {
    badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm bg-surface-container text-primary border border-primary/20';
    badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-primary"></span> Supabase (Mode Lokal)';
    badge.title = 'Koneksi online. Jalankan supabase/schema.sql untuk mengaktifkan cloud table.';
    badge.onclick = () => {
      alert('Koneksi Supabase aktif! Untuk mengaktifkan tabel cloud penuh, silakan jalankan skrip supabase/schema.sql di SQL Editor Dashboard Supabase Anda.');
    };
  } else {
    badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm bg-surface-container-low text-on-surface-variant';
    badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-outline"></span> Mode Offline';
  }
}

// Subscribe to Realtime Updates
function subscribeToRealtime() {
  if (!supabaseClient || !isTableAvailable) return;

  try {
    supabaseClient
      .channel('public:conversions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversions' }, payload => {
        console.log('[Supabase Realtime] Event:', payload);
        // Dispatch custom event for UI components to reload
        window.dispatchEvent(new CustomEvent('placeboo:conversions-updated', { detail: payload }));
      })
      .subscribe();
  } catch (e) {
    console.warn('[Placeboo Supabase] Realtime error:', e);
  }
}

// 1. Create / Add Conversion Record
async function addConversionToSupabase(job) {
  const localJob = {
    id: job.id || 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    session_id: getSessionId(),
    filename: job.filename || job.name || 'Dokumen_Tanpa_Judul',
    source_format: job.source_format || job.ext || 'PDF',
    target_format: job.target_format || job.targetFormat || 'DOCX',
    file_size: job.file_size || job.size || 1024 * 500,
    result_size: job.result_size || Math.floor((job.file_size || 1024 * 500) * 0.7),
    status: job.status || 'queued',
    progress: job.progress || 0,
    download_url: job.download_url || '',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
  };

  // Always save to resilient local storage
  saveLocalConversion(localJob);

  if (supabaseClient && isTableAvailable) {
    try {
      const { data, error } = await supabaseClient
        .from('conversions')
        .insert([localJob])
        .select();

      if (error) {
        console.warn('[Supabase Insert Error]:', error.message);
      } else if (data && data[0]) {
        return data[0];
      }
    } catch (e) {
      console.warn('[Supabase Insert Exception]:', e);
    }
  }

  return localJob;
}

// 2. Fetch Conversion Records
async function fetchConversionsFromSupabase() {
  if (supabaseClient && isTableAvailable) {
    try {
      const { data, error } = await supabaseClient
        .from('conversions')
        .select('*')
        .eq('session_id', getSessionId())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Sync local storage with cloud
        localStorage.setItem('placeboo_cloud_conversions', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('[Supabase Fetch Exception]:', e);
    }
  }

  return getLocalConversions();
}

// 3. Update Progress / Status
async function updateConversionProgress(id, progress, status, downloadUrl = null) {
  const updates = { progress, status };
  if (downloadUrl) updates.download_url = downloadUrl;

  updateLocalConversion(id, updates);

  if (supabaseClient && isTableAvailable) {
    try {
      await supabaseClient
        .from('conversions')
        .update(updates)
        .eq('id', id);
    } catch (e) {}
  }
}

// 4. Delete Conversion Job
async function deleteConversionFromSupabase(id) {
  deleteLocalConversion(id);

  if (supabaseClient && isTableAvailable) {
    try {
      await supabaseClient
        .from('conversions')
        .delete()
        .eq('id', id);
    } catch (e) {}
  }
}

// 5. Purge All Conversion Jobs (Zero-Retention Policy)
async function purgeAllConversionsFromSupabase() {
  localStorage.removeItem('placeboo_cloud_conversions');
  localStorage.removeItem('placeboo_custom_queue');

  if (supabaseClient && isTableAvailable) {
    try {
      await supabaseClient
        .from('conversions')
        .delete()
        .eq('session_id', getSessionId());
    } catch (e) {}
  }
}

// --- Local Storage Resilient Fallbacks ---
function getLocalConversions() {
  const stored = localStorage.getItem('placeboo_cloud_conversions');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }

  // Default seed data for immediate rich preview
  const defaultItems = [
    {
      id: 'sample-1',
      session_id: getSessionId(),
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
      session_id: getSessionId(),
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
      session_id: getSessionId(),
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
      session_id: getSessionId(),
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
      session_id: getSessionId(),
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

  localStorage.setItem('placeboo_cloud_conversions', JSON.stringify(defaultItems));
  return defaultItems;
}

function saveLocalConversion(item) {
  const list = getLocalConversions();
  list.unshift(item);
  localStorage.setItem('placeboo_cloud_conversions', JSON.stringify(list));
}

function updateLocalConversion(id, updates) {
  const list = getLocalConversions();
  const idx = list.findIndex(item => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem('placeboo_cloud_conversions', JSON.stringify(list));
  }
}

function deleteLocalConversion(id) {
  let list = getLocalConversions();
  list = list.filter(item => item.id !== id);
  localStorage.setItem('placeboo_cloud_conversions', JSON.stringify(list));
}

// Auto-run on load
initSupabase();
