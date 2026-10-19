import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { supabaseStatus, openProModal, showToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/semua-alat?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navItemClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg font-label-md text-label-md transition-colors ${
      isActive
        ? 'bg-surface-container text-primary font-semibold'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }`;

  const renderBadge = () => {
    if (supabaseStatus === 'connected') {
      return (
        <button
          onClick={() => showToast('Database Supabase aktif & tersinkronisasi secara real-time!')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm bg-tertiary-container/15 text-tertiary border border-tertiary/20"
          title="Terhubung ke Supabase Database & Realtime Sync"
        >
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          Supabase Sync Aktif
        </button>
      );
    }
    if (supabaseStatus === 'schema_pending') {
      return (
        <button
          onClick={() =>
            alert(
              'Koneksi Supabase aktif! Jalankan skrip supabase/schema.sql di SQL Editor Dashboard Supabase Anda untuk mengaktifkan tabel cloud penuh.'
            )
          }
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm bg-surface-container text-primary border border-primary/20"
          title="Koneksi online. Jalankan supabase/schema.sql untuk mengaktifkan cloud table."
        >
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Supabase (Mode Lokal)
        </button>
      );
    }
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-code-mono font-medium shadow-sm bg-surface-container-low text-on-surface-variant">
        <span className="w-2 h-2 rounded-full bg-outline"></span>
        Mode Offline
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(15,23,42,0.05)]">
      <div className="h-16 max-w-7xl mx-auto px-margin flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-gutter">
          <NavLink to="/" className="flex items-center gap-space-sm flex-shrink-0">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
              Placeboo
            </span>
          </NavLink>

          <nav className="hidden sm:flex items-center gap-space-xs">
            <NavLink to="/" end className={navItemClass}>
              Konversi Dokumen
            </NavLink>
            <NavLink to="/semua-alat" className={navItemClass}>
              Semua Alat (42+)
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-space-md flex-shrink-0">
          {renderBadge()}

          <div className="relative hidden lg:block w-52">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Cari konverter alat..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            onClick={openProModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm shadow-[0_2px_4px_rgba(79,70,229,0.2)] hover:bg-primary transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Peningkatan Pro
          </button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-sm flex justify-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-surface-container-lowest w-72 h-full shadow-2xl p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                  Placeboo
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <nav className="space-y-1">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-surface-container text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">home</span>
                  Konversi Dokumen
                </NavLink>

                <NavLink
                  to="/semua-alat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-surface-container text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  Semua Alat (42+)
                </NavLink>
              </nav>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openProModal();
                }}
                className="w-full py-2.5 rounded-lg bg-primary text-on-primary text-center font-label-md text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Peningkatan Pro
              </button>
              <p className="text-xs text-center text-outline">
                Enkripsi TLS 1.3 • Zero Data Retention
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
