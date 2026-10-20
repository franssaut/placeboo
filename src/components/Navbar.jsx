import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
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

        <div className="flex items-center gap-space-sm sm:gap-space-md flex-shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-semibold transition-all border border-primary/20"
            title="Pasang Aplikasi Placeboo di HP / Komputer"
          >
            <span className="material-symbols-outlined text-[16px]">install_mobile</span>
            <span>Pasang App</span>
          </button>

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

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-pwa-install'));
                  }}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-md active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                  Pasang Aplikasi di HP
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 space-y-2">
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
