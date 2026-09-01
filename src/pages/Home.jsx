import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import { 
  Trash2, MessageCircle, HelpCircle, BookOpen, MapPin, 
  Send, FileText, ChevronDown, Award, Sparkles, Scale, Info, CheckCircle2, Leaf, HeartHandshake, Zap, Landmark
} from 'lucide-react';

// Custom inline SVG icons because brand icons are not exported in this Lucide version
const InstagramIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

const TikTokIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Home = () => {
  const [stories, setStories] = useState([]);
  const [wargaCount, setWargaCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeSortingTab, setActiveSortingTab] = useState('organik');

  // Dynamic Gallery and Articles States
  const [gallery, setGallery] = useState([]);
  const [articles, setArticles] = useState([]);

  // Simulator State
  const [simulatedTrashId, setSimulatedTrashId] = useState('');
  const [simulatedWeight, setSimulatedWeight] = useState('');
  const [simulationResult, setSimulationResult] = useState(0);

  // Trash categories from firestore for simulator selection
  const [trashCategories, setTrashCategories] = useState([]);

  // Fetch data for stories and stats
  useEffect(() => {
    // 1. Fetch stories (limit 10 transactions)
    const qStories = query(collection(db, 'rekap'), orderBy('tanggalSetor', 'desc'), limit(10));
    const unsubscribeStories = onSnapshot(qStories, (snapshot) => {
      const rekapData = [];
      snapshot.forEach((doc) => {
        rekapData.push({ id: doc.id, ...doc.data() });
      });
      setStories(rekapData);
      setLoadingStories(false);
    }, (error) => {
      console.error("Error fetching stories: ", error);
      setLoadingStories(false);
    });

    // 2. Fetch all rekap for stats calculation
    const unsubscribeStats = onSnapshot(collection(db, 'rekap'), (snapshot) => {
      let weight = 0;
      let payout = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        weight += Number(data.jumlah || 0);
        payout += Number(data.totalRupiah || 0);
      });
      setTotalWeight(weight);
      setTotalPayout(payout);
    });

    // 3. Fetch citizen count
    const unsubscribeWarga = onSnapshot(collection(db, 'warga'), (snapshot) => {
      setWargaCount(snapshot.size);
    });

    // 4. Fetch trash categories for Simulator
    const unsubscribeTrash = onSnapshot(collection(db, 'sampah'), (snapshot) => {
      const categories = [];
      snapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
      });
      setTrashCategories(categories);
      if (categories.length > 0) {
        setSimulatedTrashId(categories[0].id);
      }
    });

    // 5. Fetch Gallery from Firestore
    const unsubscribeGallery = onSnapshot(query(collection(db, 'galeri')), (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setGallery(data);
    });

    // 6. Fetch Articles from Firestore
    const unsubscribeArticles = onSnapshot(query(collection(db, 'artikel')), (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setArticles(data);
    });

    return () => {
      unsubscribeStories();
      unsubscribeStats();
      unsubscribeWarga();
      unsubscribeTrash();
      unsubscribeGallery();
      unsubscribeArticles();
    };
  }, []);

  // Recalculate Simulator Results
  useEffect(() => {
    if (simulatedTrashId && simulatedWeight) {
      const selected = trashCategories.find(t => t.id === simulatedTrashId);
      if (selected) {
        setSimulationResult(Number(simulatedWeight) * Number(selected.hargaPerSatuan));
      } else {
        setSimulationResult(0);
      }
    } else {
      setSimulationResult(0);
    }
  }, [simulatedTrashId, simulatedWeight, trashCategories]);

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const faqData = [
    {
      question: "Apa itu Program Bank Sampah Desa Krejengan?",
      answer: "Program Bank Sampah Desa Krejengan adalah inisiatif pengelolaan sampah berbasis masyarakat yang mendorong warga untuk mengumpulkan, memilah, dan menyetorkan sampah kering ke bank sampah. Sebagai imbalannya, warga mendapatkan tabungan dalam bentuk saldo Rupiah yang bisa dicairkan sewaktu-waktu."
    },
    {
      question: "Bagaimana cara menjadi nasabah Bank Sampah?",
      answer: "Warga cukup mendatangi sekretariat Bank Sampah di Kantor Desa Krejengan dengan membawa KTP/KK. Petugas akan mencatatkan identitas warga ke database admin, memberikan nomor anggota, dan warga bisa langsung menyetorkan sampah yang telah dipilah."
    },
    {
      question: "Jenis sampah apa saja yang diterima?",
      answer: "Kami menerima sampah kering non-organik bernilai ekonomis, seperti botol plastik (PET/HDPE), gelas plastik, kertas karton/kardus, kertas koran, logam (besi, tembaga, aluminium), serta sampah kaleng. Sampah harus disetor dalam kondisi bersih dan kering."
    },
    {
      question: "Bagaimana sistem perhitungan tabungan sampah?",
      answer: "Setiap jenis sampah memiliki harga per kilogram atau liter yang berbeda yang ditentukan oleh admin berdasarkan harga pasar industri daur ulang. Ketika warga menyetorkan sampah, beratnya ditimbang dan hasilnya otomatis dikalikan dengan tarif jenis sampah tersebut, lalu langsung masuk ke rekap tabungan warga."
    },
    {
      question: "Kapan tabungan sampah warga bisa dicairkan?",
      answer: "Tabungan sampah dalam bentuk saldo Rupiah dapat dicairkan setiap bulan pada tanggal yang ditentukan oleh pengelola desa, atau saat akumulasi saldo telah mencapai batas minimal pencairan (misal Rp 50.000) untuk menjaga kestabilan kas bank sampah."
    }
  ];

  // Data variables are now loaded dynamically from Firestore

  // Calculate environmental equivalents
  const co2Equivalent = (totalWeight * 1.5).toFixed(1); // 1.5kg CO2 saved per kg recycled on average
  const treesSaved = Math.floor(totalWeight * 0.05); // Estimate tree equivalent saved from cardboard/paper

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section id="welcome" className="relative bg-gradient-to-b from-emerald-50 to-white pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Program Lingkungan Desa Krejengan
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mt-4 leading-tight">
              Ubah Sampah Menjadi <br/>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Tabungan & Berkah</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-600 text-base md:text-lg mt-6 leading-relaxed">
              Selamat datang di portal informasi resmi Bank Sampah Krejengan. Bersama mewujudkan desa sehat, asri, minim plastik, serta berdaya ekonomi secara sirkular.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <a href="#simulator" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition cursor-pointer">
                Simulasi Tabungan
              </a>
              <a href="#story" className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition cursor-pointer">
                Lihat Cerita Warga
              </a>
            </div>
          </div>

          {/* YouTube Video + Village Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-6">
            {/* Left side: Youtube video player */}
            <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white relative self-center">
              <iframe
                src="https://www.youtube.com/embed/AKjXdIeiT9s?si=6ZSrPQC1bReKH7FA" 
                title="Edukasi Bank Sampah Desa Krejengan"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-none"
              ></iframe>
            </div>

            {/* Right side: Village profile details */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🏡</span>
                  <h3 className="text-2xl font-bold text-slate-900">Profil Desa Krejengan</h3>
                </div>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4">
                  Desa Krejengan berlokasi di jantung Kecamatan Krejengan, Kabupaten Probolinggo. Dipimpin oleh kepala desa yang visioner, kami mendorong partisipasi aktif masyarakat dalam melestarikan lingkungan melalui pembentukan unit bank sampah terpusat.
                </p>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Melalui sistem tabungan berbasis digital ini, warga Krejengan tidak hanya dilatih memilah limbah kering rumah tangga saja, melainkan diajak untuk berinvestasi jangka pendek demi masa depan lingkungan yang lestari bagi generasi mendatang.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>📍 Kec. Krejengan, Probolinggo</span>
                <span>🇮🇩 Jawa Timur, Indonesia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eco-Impact stats dashboard */}
      <section className="bg-emerald-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Eco-Impact Dashboard Desa Krejengan</h2>
            <p className="text-emerald-300 text-sm mt-2">Dampak ekologis dan ekonomis riil yang telah kita kumpulkan bersama nasabah</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-6 text-center hover:bg-emerald-900/60 transition">
              <span className="inline-flex p-3 bg-emerald-800/60 text-emerald-400 rounded-xl mb-3">
                <Leaf className="w-6 h-6" />
              </span>
              <h3 className="text-3xl font-extrabold">{totalWeight.toFixed(1)} <span className="text-sm font-normal text-emerald-300">kg</span></h3>
              <p className="text-xs text-emerald-200 mt-1">Total Sampah Terkumpul</p>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-6 text-center hover:bg-emerald-900/60 transition">
              <span className="inline-flex p-3 bg-emerald-800/60 text-emerald-400 rounded-xl mb-3">
                <Landmark className="w-6 h-6" />
              </span>
              <h3 className="text-3xl font-extrabold">{formatRupiah(totalPayout)}</h3>
              <p className="text-xs text-emerald-200 mt-1">Total Tabungan Dicairkan</p>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-6 text-center hover:bg-emerald-900/60 transition">
              <span className="inline-flex p-3 bg-emerald-800/60 text-emerald-400 rounded-xl mb-3">
                <HeartHandshake className="w-6 h-6" />
              </span>
              <h3 className="text-3xl font-extrabold">{wargaCount} <span className="text-sm font-normal text-emerald-300">Jiwa</span></h3>
              <p className="text-xs text-emerald-200 mt-1">Nasabah Terdaftar</p>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-6 text-center hover:bg-emerald-900/60 transition">
              <span className="inline-flex p-3 bg-emerald-800/60 text-emerald-400 rounded-xl mb-3">
                <Zap className="w-6 h-6" />
              </span>
              <h3 className="text-3xl font-extrabold">{co2Equivalent} <span className="text-sm font-normal text-emerald-300">kg</span></h3>
              <p className="text-xs text-emerald-200 mt-1">Reduksi Emisi CO₂</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Warga Mendapatkan Uang Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-full shadow-sm">
              💰 Panduan Menabung
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              Cara Warga Mendapatkan Uang dari Tabungan Sampah
            </h2>
            <p className="max-w-xl mx-auto text-slate-500 text-sm mt-2 leading-relaxed">
              Ubah sampah rumah tangga menjadi penghasilan tambahan melalui 4 langkah mudah berikut:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 hover:shadow-md transition duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Pilah Sampah</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pilah sampah kering non-organik bernilai ekonomis (plastik, kertas, logam, dll) dari rumah Anda. Bersihkan dan keringkan sebelum disetor.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 hover:shadow-md transition duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Bawa ke Bank Sampah</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kunjungi Sekretariat Bank Sampah di Kantor Desa Krejengan pada hari operasional dengan membawa sampah terpilah Anda.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 hover:shadow-md transition duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Timbang & Catat</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Petugas menimbang sampah Anda. Hasil timbangan dikalikan tarif kategori sampah dan saldonya langsung tercatat secara digital.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 hover:shadow-md transition duration-300 flex flex-col items-center text-center border-emerald-200/60 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg mb-4 animate-bounce">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Cairkan Rupiah</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Saldo tabungan sampah Anda yang terkumpul dapat dicairkan menjadi uang tunai setiap akhir tahun sesuai keputusan mitra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator Calculator Section */}
      <section id="simulator" className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full mb-3">
                <Info className="w-3.5 h-3.5" /> Simulasi Penghasilan
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Kalkulator Tabungan Sampah</h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mt-4">
                Ingin tahu seberapa besar nilai sampah anorganik di rumah Anda? Masukkan taksiran berat atau volume sampah Anda di simulator sebelah kanan, dan saksikan langsung perkiraan saldo rupiah yang akan Anda kantongi!
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600 text-sm">Menghitung otomatis berdasarkan daftar harga sampah pasar terupdate.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600 text-sm">Membantu memperkirakan isi tabungan sebelum disetorkan ke pengelola.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600 text-sm">Tarif transparan dan adil, disesuaikan berdasarkan kategori jenis sampah.</span>
                </div>
              </div>
            </div>

            {/* Simulated Widget Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                🧮 Hitung Tabunganmu
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="sim-sampah">Pilih Jenis Sampah</label>
                  <select
                    id="sim-sampah"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    value={simulatedTrashId}
                    onChange={(e) => setSimulatedTrashId(e.target.value)}
                  >
                    {trashCategories.length === 0 ? (
                      <option value="">-- Kategori Kosong --</option>
                    ) : (
                      trashCategories.map(t => (
                        <option key={t.id} value={t.id}>{t.namaSampah} ({formatRupiah(t.hargaPerSatuan)}/{t.satuan})</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="sim-berat">Taksiran Jumlah / Berat</label>
                  <div className="relative">
                    <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="sim-berat"
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Masukkan berat dalam kg/liter..."
                      className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      value={simulatedWeight}
                      onChange={(e) => setSimulatedWeight(e.target.value)}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      {simulatedTrashId && trashCategories.find(t => t.id === simulatedTrashId)?.satuan || 'kg'}
                    </span>
                  </div>
                </div>

                {simulatedTrashId && simulatedWeight && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mt-6 text-center">
                    <p className="text-xs text-emerald-800 font-semibold mb-1">Perkiraan Dana yang Diterima:</p>
                    <h4 className="text-3xl font-extrabold text-emerald-700">{formatRupiah(simulationResult)}</h4>
                    <p className="text-[10px] text-emerald-600/70 mt-1">*Nilai di atas bersifat simulasi taksiran sementara</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sorting Guide Section */}
      <section className="py-16 bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Panduan Pilah Sampah</h2>
            <p className="text-slate-500 text-sm mt-2">Pahami jenis pengelompokan sampah berikut agar tidak salah memilah di rumah</p>
          </div>

          {/* Guide Tabs */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setActiveSortingTab('organik')}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs transition cursor-pointer ${
                activeSortingTab === 'organik' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              🟢 Sampah Organik
            </button>
            <button
              onClick={() => setActiveSortingTab('anorganik')}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs transition cursor-pointer ${
                activeSortingTab === 'anorganik' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              🔵 Sampah Anorganik
            </button>
            <button
              onClick={() => setActiveSortingTab('b3')}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs transition cursor-pointer ${
                activeSortingTab === 'b3' 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              🔴 Sampah B3
            </button>
          </div>

          {/* Sorting Content Display */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-200 max-w-3xl mx-auto">
            {activeSortingTab === 'organik' && (
              <div>
                <h4 className="text-lg font-bold text-emerald-800 mb-2">Sampah Organik (Bisa Membusuk)</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Sampah organik adalah limbah yang berasal dari makhluk hidup dan dapat terurai secara alami oleh bakteri tanpa merusak ekosistem.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <span className="font-bold text-xs text-emerald-800">✅ Contoh yang Diterima</span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-1">
                      <li>Minyak Jelantah bekas</li>
                      <li>Sisa potongan buah & sayur</li>
                      <li>Dedaunan / rumput kering</li>
                    </ul>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                    <span className="font-bold text-xs text-rose-800">❌ Tidak Boleh Masuk Bank</span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-1">
                      <li>Bangkai hewan</li>
                      <li>Kotoran hewan peliharaan</li>
                      <li>Kayu tebal/kayu lapis</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSortingTab === 'anorganik' && (
              <div>
                <h4 className="text-lg font-bold text-blue-800 mb-2">Sampah Anorganik (Kering & Daur Ulang)</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Sampah anorganik adalah sisa material buatan manusia yang bernilai ekonomi tinggi untuk diproses kembali di pabrik daur ulang.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <span className="font-bold text-xs text-blue-800">✅ Contoh yang Diterima</span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-1">
                      <li>Botol plastik PET & HDPE</li>
                      <li>Kardus, koran, HVS</li>
                      <li>Besi, tembaga, seng, kaleng</li>
                    </ul>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                    <span className="font-bold text-xs text-rose-800">❌ Tidak Boleh Masuk Bank</span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-1">
                      <li>Plastik kemasan basah / kotor</li>
                      <li>Kertas tissue bekas pakai</li>
                      <li>Kaca cermin pecah</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSortingTab === 'b3' && (
              <div>
                <h4 className="text-lg font-bold text-rose-800 mb-2">Sampah B3 (Bahan Berbahaya & Beracun)</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Limbah berbahaya dari perangkat kimia rumah tangga yang memerlukan pembuangan khusus agar tidak meracuni tanah dan air desa.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-rose-50/70 rounded-xl p-3 border border-rose-100">
                    <span className="font-bold text-xs text-rose-800">⚠️ Butuh Penanganan Khusus</span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-1">
                      <li>Baterai bekas alkalin / HP</li>
                      <li>Lampu neon pijar rusak</li>
                      <li>Kaleng aerosol obat nyamuk</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="font-bold text-xs text-slate-700">💡 Cara Mengumpulkan</span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pisahkan limbah B3 ke dalam kantong merah khusus. Antarkan ke depo sampah desa untuk disalurkan ke agen pengolah B3 resmi.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Story Warga Section */}
      <section id="story" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-2">Cerita Warga Menabung Sampah</h2>
          <p className="text-center text-slate-500 text-sm mb-12">Daftar transaksi nasabah teraktif yang mengumpulkan pundi rupiah pekan ini.</p>

          {loadingStories ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin-custom"></div>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-4xl">🗃️</span>
              <p className="text-slate-500 mt-2 font-medium">Belum ada transaksi setor sampah.</p>
              <p className="text-xs text-slate-400">Data rekap setoran akan diperbarui berkala oleh administrator desa.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-semibold text-slate-600"><Award className="w-4 h-4 inline mr-1 text-amber-500 align-middle" /> Nama Nasabah</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Nama Sampah</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Kategori / Tipe</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Jumlah Setoran</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Hasil Tabungan</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Tanggal Setor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stories.map((story) => (
                    <tr key={story.id} className="hover:bg-emerald-50/35 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{story.wargaNama}</td>
                      <td className="px-6 py-4 text-slate-600">{story.sampahNama || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          story.typeSampah === 'Organik' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : story.typeSampah === 'Anorganik'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {story.typeSampah}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {story.jumlah} {story.satuan || 'kg'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {formatRupiah(story.totalRupiah)}
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-400 font-medium">
                        {story.tanggalSetor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-8">Pertanyaan Umum (FAQ)</h2>
          <div className="space-y-4">
            {faqData.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                  >
                    <div className="flex gap-3 items-center">
                      <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-sm md:text-base">{faq.question}</span>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 shrink-0 transform transition-transform ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pl-14 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-2">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-2">Galeri Kegiatan</h2>
          <p className="text-center text-slate-500 text-sm mb-12">Visualisasi aktivitas warga, penimbangan, dan hasil karya daur ulang Desa Krejengan.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.length === 0 ? (
              <div className="col-span-full text-center py-12 border border-dashed border-slate-205 rounded-2xl">
                <p className="text-slate-400 text-xs font-semibold">Belum ada foto galeri.</p>
              </div>
            ) : (
              gallery.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition duration-300">
                  <div className="overflow-hidden h-48 relative">
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-slate-950 text-sm">{item.title}</h4>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Educational Articles Section */}
      <section id="articles" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-12">Edukasi & Artikel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.length === 0 ? (
              <div className="col-span-full text-center py-12 border border-dashed border-slate-205 rounded-2xl">
                <p className="text-slate-400 text-xs font-semibold">Belum ada artikel edukasi.</p>
              </div>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition duration-300 flex flex-col justify-between">
                  <div>
                    <img 
                      src={article.img} 
                      alt={article.title} 
                      className="w-full h-40 object-cover rounded-2xl mb-4"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">{article.date}</span>
                    <h3 className="text-base font-bold text-slate-950 mt-1.5 mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">{article.excerpt}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedArticle(article)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <BookOpen className="w-4 h-4" /> Baca Artikel
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-12">Hubungi Kami</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Left: Contact Info */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950 mb-3">Alamat Bank Sampah</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Dusun Dandan, Kec. Krejengan, Kabupaten Probolinggo, Jawa Timur</span>
                </p>
              </div>
            </div>

            {/* Right: Map */}
            <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 h-80 lg:h-full">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.5137255959955!2d113.3980185!3d-7.8411306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd6fee27a69b76f%3A0xe5a140d3cd8ec29f!2sKantor%20Desa%20Krejengan!5e0!3m2!1sid!2sid!4v1718360000000!5m2!1sid!2sid" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Kantor Desa Krejengan"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs md:text-sm">
            &copy; 2026 Pemerintah Desa Krejengan, Kabupaten Probolinggo. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            Maju Bersama dalam Kebersihan dan Peningkatan Ekonomi Rakyat Desa Krejengan.
          </p>
        </div>
      </footer>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-950 text-base md:text-lg truncate mr-4">{selectedArticle.title}</h3>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <img 
                src={selectedArticle.img} 
                alt={selectedArticle.title} 
                className="w-full h-64 object-cover rounded-2xl mb-4 shadow-sm"
              />
              <span className="text-[10px] text-slate-400 font-semibold block mb-2">Tanggal: {selectedArticle.date}</span>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedArticle(null)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition">
                Tutup Artikel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
