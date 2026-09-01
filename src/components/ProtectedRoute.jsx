import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLocalAdmin = localStorage.getItem('admin_auth') === 'true';
      setAuthenticated(!!user || isLocalAdmin);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-sans)' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #e2e8f0', 
          borderTopColor: '#059669', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Memuat data autentikasi...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
