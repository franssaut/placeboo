import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low mt-auto border-t border-outline-variant/15">
      <div className="max-w-7xl mx-auto px-margin py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl">
          <div className="lg:col-span-2 space-y-space-md">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Placeboo Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Placeboo</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
              Platform konversi multi-format enterprise berkecepatan tinggi dengan enkripsi file TLS 1.3 dan garansi penghapusan data instan otomatis.
            </p>
            <div className="flex items-center gap-space-sm pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-tertiary font-code-mono text-code-mono font-semibold text-xs">
                <span className="material-symbols-outlined text-[15px]">verified_user</span> ISO 27001
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-code-mono text-code-mono text-xs">
                <span className="material-symbols-outlined text-[15px]">shield</span> GDPR Ready
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-space-md">Direktori Format</h4>
            <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <li><Link to="/?format=DOCX" className="hover:text-primary transition-colors">PDF ke Word (DOCX)</Link></li>
              <li><Link to="/?format=PDF" className="hover:text-primary transition-colors">Excel ke PDF Spreadsheet</Link></li>
              <li><Link to="/?format=PNG" className="hover:text-primary transition-colors">JPG / PNG ke Vector SVG</Link></li>
              <li><Link to="/semua-alat" className="hover:text-primary transition-colors">Kompres Dokumen PDF</Link></li>
              <li><Link to="/?format=TXT" className="hover:text-primary transition-colors">OCR Ekstraksi Teks</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-space-md">Keamanan & Regulasi</h4>
            <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <li><span className="hover:text-on-surface transition-colors cursor-pointer">Enkripsi Zero-Knowledge</span></li>
              <li><span className="hover:text-on-surface transition-colors cursor-pointer">Garansi Auto-Delete (2 Jam)</span></li>
              <li><span className="hover:text-on-surface transition-colors cursor-pointer">Kebijakan Privasi Global</span></li>
              <li><span className="hover:text-on-surface transition-colors cursor-pointer">Ketentuan Layanan SaaS</span></li>
              <li><span className="hover:text-on-surface transition-colors cursor-pointer">Laporan Audit Keamanan</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-space-lg border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center sm:text-left">
            © 2025 Placeboo Inc. Hak Cipta Dilindungi. Diproses di lingkungan cloud terenkripsi.
          </p>
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span className="font-semibold text-primary">ID</span>
              <span className="text-outline-variant">|</span>
              <span className="hover:text-on-surface transition-colors cursor-pointer">EN</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
