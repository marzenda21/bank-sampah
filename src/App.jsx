import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminWarga from './pages/AdminWarga';
import AdminSampah from './pages/AdminSampah';
import AdminRekap from './pages/AdminRekap';
import AdminGaleri from './pages/AdminGaleri';
import AdminArtikel from './pages/AdminArtikel';
import ProtectedRoute from './components/ProtectedRoute';
import { seedDatabase } from './utils/seeder';

function App() {
  useEffect(() => {
    // Seed database if collections are empty
    seedDatabase();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin/warga" 
          element={
            <ProtectedRoute>
              <AdminWarga />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/sampah" 
          element={
            <ProtectedRoute>
              <AdminSampah />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/rekap" 
          element={
            <ProtectedRoute>
              <AdminRekap />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/galeri" 
          element={
            <ProtectedRoute>
              <AdminGaleri />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/artikel" 
          element={
            <ProtectedRoute>
              <AdminArtikel />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
