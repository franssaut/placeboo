import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProModal from './components/ProModal';
import Toast from './components/Toast';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import BatchQueue from './pages/BatchQueue';
import DownloadHistory from './pages/DownloadHistory';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen text-on-surface bg-surface selection:bg-primary-container selection:text-on-primary">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/semua-alat" element={<Catalog />} />
          <Route path="/batch-queue" element={<BatchQueue />} />
          <Route path="/riwayat-unduhan" element={<DownloadHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <ProModal />
      <Toast />
    </div>
  );
}
