import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, ArrowLeft, LogIn, Info } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin/warga');
    } catch (err) {
      console.error('Firebase Login Error:', err);

      // Handle missing Firebase Auth configuration gracefully
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        if (email === 'admin@gmail.com' && password === '123321') {
          localStorage.setItem('admin_auth', 'true');
          navigate('/admin/warga');
          return;
        } else {
          setError('Fitur Firebase Auth belum diaktifkan di Firebase Console. Gunakan email default (admin@gmail.com / 123321) atau aktifkan Email/Password pada Firebase Console proyek Anda.');
        }
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        // Fallback check if user hasn't created user in Firebase Console yet
        if (email === 'admin@gmail.com' && password === '123321') {
          localStorage.setItem('admin_auth', 'true');
          navigate('/admin/warga');
          return;
        }
        setError('Email atau Kata Sandi admin salah.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else {
        setError('Gagal masuk: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900 px-6 py-12 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative border border-slate-100">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Beranda
        </button>

        <div className="text-center mt-6 mb-8">
          <span className="text-5xl">♻️</span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-3">Portal Admin</h2>
          <p className="text-xs text-slate-500 mt-1">Masuk untuk mengelola data Bank Sampah Desa Krejengan</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">Alamat Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                placeholder="admin@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/15 transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
            ) : (
              <><LogIn className="w-4 h-4" /> Masuk Portal</>
            )}
          </button>
        </form>

        {/* Default Account Info Box */}

      </div>
    </div>
  );
};

export default Login;
