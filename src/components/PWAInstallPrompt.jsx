import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

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

    // 2. Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    const isDroid = /android/.test(ua);

    setIsIOS(isApple && isSafari);
    setIsAndroid(isDroid);

    // 3. Check dismissed flag in localStorage
    const hasDismissed = localStorage.getItem('placeboo_pwa_dismissed');

    // Always show banner after 1.2s delay if not dismissed (on mobile or desktop)
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1200);
      return () => clearTimeout(timer);
    }

    // 4. Capture native beforeinstallprompt (Android Chrome, Edge, Chromium)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for manual trigger from Navbar / Home banner
    const handleOpenInstall = () => {
      setShowPrompt(true);
      handleInstallClick();
    };
    window.addEventListener('open-pwa-install', handleOpenInstall);

    // 6. Listen for app installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setShowGuideModal(false);
      localStorage.setItem('placeboo_pwa_installed', 'true');
      console.log('[PWA] Aplikasi Placeboo berhasil diinstal');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, [deferredPrompt, isIOS]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('[PWA] Pengguna menyetujui instalasi PWA');
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
        setShowGuideModal(true);
      }
    } else {
      // If browser doesn't support automatic prompt (e.g. iOS Safari, HTTP connection, or Firefox)
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('placeboo_pwa_dismissed', 'true');
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      {showPrompt && !showGuideModal && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-50 animate-bounce-in">
          <div className="bg-surface-container-lowest border-2 border-primary/30 rounded-2xl p-4 shadow-[0_10px_35px_rgba(79,70,229,0.25)] flex items-start gap-3.5 backdrop-blur-xl">
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
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="font-bold text-sm text-on-surface truncate">
                    Pasang Aplikasi Placeboo
                  </h4>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
                  title="Tutup"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Pasang di layar utama HP Anda. Akses instan tanpa buka browser, hemat kuota & bisa offline.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 bg-primary text-white text-xs font-bold py-2.5 px-3.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                  <span>Pasang Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-on-surface-variant hover:text-on-surface py-2 px-2.5 rounded-xl hover:bg-surface-container-low transition-colors font-medium"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructional Guide Modal (When Browser Cannot Trigger Native Prompt Automatically) */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-md overflow-hidden">
                  <img src="/icons/icon-192.png" alt="Placeboo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Pasang Aplikasi Placeboo</h3>
                  <p className="text-xs text-primary font-semibold">
                    {isIOS ? 'Khusus iPhone / iPad (Safari)' : 'Khusus Android / Chrome'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Instruction Steps */}
            {isIOS ? (
              <div className="space-y-2.5 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    1
                  </span>
                  <p className="leading-snug">
                    Ketuk tombol <strong className="text-on-surface">Bagikan (Share)</strong>{' '}
                    <span className="inline-block bg-surface-container-high px-1.5 py-0.5 rounded text-[11px] font-mono text-on-surface font-bold">
                      ⎋
                    </span>{' '}
                    di bagian bawah layar Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    2
                  </span>
                  <p className="leading-snug">
                    Gulir menu ke bawah lalu pilih{' '}
                    <strong className="text-on-surface">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    3
                  </span>
                  <p className="leading-snug">
                    Ketuk <strong className="text-on-surface">Tambah (Add)</strong> di pojok kanan atas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    1
                  </span>
                  <p className="leading-snug">
                    Ketuk menu <strong className="text-on-surface">titik tiga (⋮)</strong> di pojok kanan atas browser Chrome / Samsung Internet.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    2
                  </span>
                  <p className="leading-snug">
                    Pilih menu <strong className="text-on-surface">"Instal Aplikasi"</strong> atau{' '}
                    <strong className="text-on-surface">"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    3
                  </span>
                  <p className="leading-snug">
                    Ketuk <strong className="text-on-surface">Instal / Pasang</strong>. Ikon aplikasi Placeboo akan langsung muncul di menu HP Anda!
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-primary text-white text-xs font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              Siap, Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
