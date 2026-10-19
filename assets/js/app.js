/**
 * Placeboo / DocuMorph - Core Application JavaScript
 * Manages shared state, cross-page file queuing, modals, navigation, and interactive utilities.
 */

// Toast notification helper
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');
  const bg = type === 'success' ? 'bg-tertiary-container text-on-tertiary-container border-tertiary' : 
             (type === 'error' ? 'bg-error-container text-on-error-container border-error' : 'bg-surface-container-highest text-on-surface border-primary');

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto ${bg}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px]">${icon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Download helper for generated demo files
function triggerDownload(filename, textContent = 'Placeboo Converted Document Sample') {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Mengunduh ${filename}...`);
}

// Pro Upgrade Modal Handler
function initProModal() {
  const modalHtml = `
    <div id="pro-modal" class="fixed inset-0 z-50 hidden bg-on-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden transform transition-all p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button onclick="closeProModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined text-[28px]">bolt</span>
          </div>
          <div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Peningkatan Placeboo Pro</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Akses tanpa batas ke mesin pemrosesan enterprise</p>
          </div>
        </div>

        <div class="space-y-3 py-2 border-y border-outline-variant/20">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
            <p class="font-body-md text-body-md text-on-surface">Ukuran berkas tanpa batas hingga <strong class="text-primary font-semibold">2.0 GB per file</strong></p>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
            <p class="font-body-md text-body-md text-on-surface">Batch Queue simultan hingga <strong class="text-primary font-semibold">100+ dokumen sekaligus</strong></p>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
            <p class="font-body-md text-body-md text-on-surface">Prioritas pemrosesan Dedicated SG-1 Cluster (0 antrean)</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
            <p class="font-body-md text-body-md text-on-surface">OCR Teks Cerdas & Multi-Language AI Extraction</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
            <p class="font-body-md text-body-md text-on-surface">Penyimpanan cloud kustom & Integrasi Webhook API</p>
          </div>
        </div>

        <div class="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
          <div>
            <p class="font-headline-sm text-primary font-bold text-headline-sm">Rp 49.000 <span class="font-body-sm text-on-surface-variant text-[14px] font-normal">/ bulan</span></p>
            <p class="font-code-mono text-[11px] text-tertiary">Garansi uang kembali 30 hari</p>
          </div>
          <button onclick="handleSubscribePro()" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container shadow-md active:scale-95 transition-all">
            Coba Gratis 14 Hari
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.querySelectorAll('[data-path="peningkatan-pro"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openProModal();
    });
  });
}

function openProModal() {
  const modal = document.getElementById('pro-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeProModal() {
  const modal = document.getElementById('pro-modal');
  if (modal) modal.classList.add('hidden');
}

function handleSubscribePro() {
  showToast('Selamat! Akses uji coba Placeboo Pro 14 Hari telah diaktifkan!');
  closeProModal();
}

// Global Header Search Handler
function initHeaderSearch() {
  const headerInputs = document.querySelectorAll('header input[type="text"]');
  headerInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = encodeURIComponent(e.target.value.trim());
        if (q) {
          window.location.href = `semua-alat.html?q=${q}`;
        }
      }
    });
  });
}

// Mobile Navigation Drawer
function initMobileNav() {
  const navContainer = document.querySelector('header .h-16');
  if (!navContainer) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Check if mobile button exists, if not add it
  if (!document.getElementById('mobile-menu-btn')) {
    const mobileBtn = document.createElement('button');
    mobileBtn.id = 'mobile-menu-btn';
    mobileBtn.className = 'xl:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors ml-1';
    mobileBtn.innerHTML = '<span class="material-symbols-outlined text-[24px]">menu</span>';
    navContainer.appendChild(mobileBtn);

    const drawer = document.createElement('div');
    drawer.id = 'mobile-drawer';
    drawer.className = 'fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-sm hidden flex justify-end';
    drawer.innerHTML = `
      <div class="bg-surface-container-lowest w-72 h-full shadow-2xl p-6 flex flex-col justify-between transform transition-transform">
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-outline-variant/20">
            <span class="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">Placeboo</span>
            <button id="close-mobile-drawer" class="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <nav class="space-y-1">
            <a href="index.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${currentPath === 'index.html' || currentPath === '' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}">
              <span class="material-symbols-outlined text-[20px]">home</span>
              Konversi PDF / Dokumen
            </a>
            <a href="semua-alat.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${currentPath === 'semua-alat.html' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}">
              <span class="material-symbols-outlined text-[20px]">grid_view</span>
              Semua Alat (42+)
            </a>
            <a href="batch-queue.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${currentPath === 'batch-queue.html' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}">
              <span class="material-symbols-outlined text-[20px]">folder_copy</span>
              Batch Queue
            </a>
            <a href="riwayat-unduhan.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${currentPath === 'riwayat-unduhan.html' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}">
              <span class="material-symbols-outlined text-[20px]">download_done</span>
              Riwayat & Unduhan
            </a>
          </nav>
        </div>
        <div class="pt-4 border-t border-outline-variant/20 space-y-3">
          <a href="#" data-path="peningkatan-pro" class="w-full py-2.5 rounded-lg bg-primary text-on-primary text-center font-label-md text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md">
            <span class="material-symbols-outlined text-[18px]">bolt</span> Peningkatan Pro
          </a>
          <p class="text-xs text-center text-outline">Enkripsi TLS 1.3 • Zero Data Retention</p>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    mobileBtn.addEventListener('click', () => drawer.classList.remove('hidden'));
    document.getElementById('close-mobile-drawer').addEventListener('click', () => drawer.classList.add('hidden'));
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) drawer.classList.add('hidden');
    });
  }
}

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initProModal();
  initHeaderSearch();
  initMobileNav();
});
