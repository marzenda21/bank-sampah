import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Image, BookOpen, PhoneCall, UserCheck, ShieldAlert } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/' + id);
      setTimeout(() => {
        const element = document.getElementById(id.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Removed FAQ from the nav list to keep it responsive and clean on mobile
  const navItems = [
    { label: 'Beranda', icon: <Home className="w-5 h-5" />, action: () => scrollToSection('#welcome') },
    { label: 'Tabungan', icon: <ClipboardList className="w-5 h-5" />, action: () => scrollToSection('#story') },
    { label: 'Galeri', icon: <Image className="w-5 h-5" />, action: () => scrollToSection('#gallery') },
    { label: 'Edukasi', icon: <BookOpen className="w-5 h-5" />, action: () => scrollToSection('#articles') },
    { label: 'Kontak', icon: <PhoneCall className="w-5 h-5" />, action: () => scrollToSection('#contact') },
  ];

  return (
    <>
      {/* Desktop Navigation (strictly fixed at the top) */}
      <nav className="hidden md:flex items-center justify-between px-8 py-4 bg-emerald-950 text-white fixed top-0 left-0 right-0 w-full z-50 shadow-md">
        <div 
          className="flex items-center gap-2 cursor-pointer font-bold text-lg hover:text-emerald-400 transition"
          onClick={() => scrollToSection('#welcome')}
        >
          <span className="text-xl">♻️</span>
          <span>Bank Sampah Krejengan</span>
        </div>
        <div className="flex items-center gap-6">
          {navItems.map((item, index) => (
            <button 
              key={index} 
              onClick={item.action} 
              className="text-sm font-medium text-slate-300 hover:text-white hover:bg-emerald-900 px-3 py-1.5 rounded-md transition cursor-pointer"
            >
              {item.label}
            </button>
          ))}
          {isLoggedIn ? (
            <button 
              onClick={() => navigate('/admin/warga')} 
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-md transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" /> Admin Panel
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="flex items-center gap-1.5 px-4 py-2 border border-emerald-500 hover:bg-emerald-900 text-emerald-400 hover:text-white text-sm font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" /> Login Admin
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation (strictly fixed at the bottom, 5 clean items) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full h-16 bg-emerald-950 text-slate-400 border-t border-emerald-900 flex items-center justify-around z-50 shadow-lg px-2 pb-safe">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium transition active:text-emerald-400 focus:outline-none cursor-pointer"
          >
            <div className="p-1 rounded-full active:bg-emerald-900">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
        {isLoggedIn ? (
          <button
            onClick={() => navigate('/admin/warga')}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium text-emerald-400 transition cursor-pointer"
          >
            <UserCheck className="w-5 h-5" />
            <span>Admin</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium hover:text-emerald-400 transition cursor-pointer"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Login</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default Navbar;
