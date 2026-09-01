import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Trash2, FileSpreadsheet, LogOut, Globe, Image, BookOpen } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLocalAdmin = localStorage.getItem('admin_auth') === 'true';
      if (user) {
        setUserEmail(user.email || 'admin@gmail.com');
      } else if (isLocalAdmin) {
        setUserEmail('admin@gmail.com');
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
      try {
        localStorage.removeItem('admin_auth');
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        localStorage.removeItem('admin_auth');
        navigate('/');
      }
    }
  };

  const menuItems = [
    { label: 'Data Warga', icon: <Users className="w-5 h-5" />, path: '/admin/warga' },
    { label: 'Data Sampah', icon: <Trash2 className="w-5 h-5" />, path: '/admin/sampah' },
    { label: 'Rekap Sampah', icon: <FileSpreadsheet className="w-5 h-5" />, path: '/admin/rekap' },
    { label: 'Kelola Galeri', icon: <Image className="w-5 h-5" />, path: '/admin/galeri' },
    { label: 'Kelola Artikel', icon: <BookOpen className="w-5 h-5" />, path: '/admin/artikel' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans w-full max-w-full overflow-x-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 h-screen sticky top-0 border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-1">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>♻️</span>
            <span>Admin Portal</span>
          </div>
          <span className="text-xs text-slate-400 truncate" title={userEmail}>
            {userEmail}
          </span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-left transition cursor-pointer shrink-0 ${
                  isActive 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <hr className="border-slate-800 my-4" />

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-left text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <Globe className="w-5 h-5" />
            <span>Lihat Website</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-left text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 max-w-full w-full">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Navbar for Admin (Fixed Bottom Tab Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 shadow-lg px-2 pb-safe overflow-x-auto">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-medium transition cursor-pointer shrink-0 min-w-[50px] ${
                isActive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span>{item.label.replace('Data ', '').replace('Kelola ', '').replace('Rekap ', 'Rekap')}</span>
            </button>
          );
        })}
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-medium text-slate-400 transition cursor-pointer shrink-0 min-w-[50px]"
        >
          <Globe className="w-5 h-5" />
          <span>Web</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-medium text-rose-400 transition cursor-pointer shrink-0 min-w-[50px]"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminLayout;
