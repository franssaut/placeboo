import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Home from './pages/Home';
import Catalog from './pages/Catalog';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen text-on-surface bg-surface selection:bg-primary-container selection:text-on-primary">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/semua-alat" element={<Catalog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <Toast />
    </div>
  );
}
