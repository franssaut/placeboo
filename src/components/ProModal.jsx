import React from 'react';
import { useApp } from '../context/AppContext';

export default function ProModal() {
  const { isProModalOpen, closeProModal, showToast } = useApp();

  if (!isProModalOpen) return null;

  const handleSubscribe = () => {
    showToast('Selamat! Akses uji coba Placeboo Pro 14 Hari telah diaktifkan!');
    closeProModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={closeProModal}
    >
      <div
        className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeProModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[28px]">bolt</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Peningkatan Placeboo Pro
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Akses tanpa batas ke mesin pemrosesan enterprise
            </p>
          </div>
        </div>

        <div className="space-y-3 py-2 border-y border-outline-variant/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
              check_circle
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              Ukuran berkas tanpa batas hingga <strong className="text-primary font-semibold">2.0 GB per file</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
              check_circle
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              Batch Queue simultan hingga <strong className="text-primary font-semibold">100+ dokumen sekaligus</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
              check_circle
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              Prioritas pemrosesan Dedicated SG-1 Cluster (0 antrean)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
              check_circle
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              OCR Teks Cerdas & Multi-Language AI Extraction
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
              check_circle
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              Penyimpanan cloud kustom & Integrasi Webhook API
            </p>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-headline-sm text-primary font-bold text-headline-sm">
              Rp 49.000 <span className="font-body-sm text-on-surface-variant text-[14px] font-normal">/ bulan</span>
            </p>
            <p className="font-code-mono text-[11px] text-tertiary">Garansi uang kembali 30 hari</p>
          </div>
          <button
            onClick={handleSubscribe}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container shadow-md active:scale-95 transition-all"
          >
            Coba Gratis 14 Hari
          </button>
        </div>
      </div>
    </div>
  );
}
