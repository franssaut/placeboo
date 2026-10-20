import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return;
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    const isAppleSafari = isAppleDevice && isSafariBrowser;
    setIsIOS(isAppleSafari);

    // 3. Check dismissed flag in localStorage
    const hasDismissed = localStorage.getItem('placeboo_pwa_dismissed');

    // 4. Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. If iOS Safari and not standalone, show prompt after 3s if not dismissed
    if (isAppleSafari && !hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 6. Listen for manual trigger from Navbar / Footer
    const handleOpenInstall = () => {
      setShowPrompt(true);
      if (isAppleSafari) {
        setShowIOSModal(true);
      }
    };
    window.addEventListener('open-pwa-install', handleOpenInstall);

    // 7. Listen for app installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setShowIOSModal(false);
      localStorage.setItem('placeboo_pwa_installed', 'true');
      console.log('[PWA] Aplikasi Placeboo berhasil diinstal');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Untuk memasang di perangkat Anda: Buka menu browser (titik 3 di kanan atas) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User menyetujui instalasi PWA');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (err) {
      console.error('[PWA Install Error]:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('placeboo_pwa_dismissed', 'true');
  };

  if (isStandalone || (!showPrompt && !showIOSModal)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      {showPrompt && !showIOSModal && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] z-50 animate-bounce-in">
          <div className="bg-surface-container-lowest border border-primary/20 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 backdrop-blur-xl">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden">
              <img
                src="/icons/icon-192.png"
                alt="Placeboo Icon"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* App Info & Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm text-on-surface truncate">
                  Pasang Aplikasi Placeboo
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
                  title="Tutup"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Akses instan di layar utama HP Anda. Lebih cepat, hemat kuota, dan bisa dibuka offline.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 bg-primary text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                  <span>Pasang Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-on-surface-variant hover:text-on-surface py-2 px-2.5 rounded-lg hover:bg-surface-container-low transition-colors font-medium"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/icons/icon-192.png" alt="Placeboo" className="w-10 h-10 rounded-xl" />
                <div>
                  <h3 className="font-bold text-base text-on-surface">Pasang di iPhone / iPad</h3>
                  <p className="text-xs text-on-surface-variant">Panduan Safari iOS</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-on-surface-variant">
              <div className="flex items-start gap-2.5 bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-bold text-primary text-sm">1.</span>
                <p>
                  Ketuk tombol <strong className="text-on-surface">Bagikan (Share)</strong>{' '}
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded text-[11px] font-mono">
                    ⎋
                  </span>{' '}
                  di bilah bawah Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-bold text-primary text-sm">2.</span>
                <p>
                  Gulir ke bawah dan ketuk opsi{' '}
                  <strong className="text-on-surface">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-bold text-primary text-sm">3.</span>
                <p>
                  Ketuk <strong className="text-on-surface">Tambah (Add)</strong> di pojok kanan atas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-primary text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
