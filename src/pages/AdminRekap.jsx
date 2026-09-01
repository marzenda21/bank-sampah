import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import { Plus, Search, Edit2, Trash2, FileSpreadsheet, Scale, User, Tag, Calendar, Printer, BarChart3, ListFilter, Loader2 } from 'lucide-react';

const AdminRekap = () => {
  const [rekap, setRekap] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [sampahList, setSampahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null); // null for create, ID for edit
  const [activeTab, setActiveTab] = useState('riwayat'); // 'riwayat' (history) or 'saldo' (summaries)
  
  const [formData, setFormData] = useState({
    wargaId: '',
    sampahId: '',
    jumlah: '',
    tanggalSetor: new Date().toISOString().split('T')[0]
  });

  const [selectedSampah, setSelectedSampah] = useState(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch Rekap, Warga list, and Sampah list from Firestore
  useEffect(() => {
    // 1. Fetch Rekap transactions
    const rekapQuery = query(collection(db, 'rekap'), orderBy('tanggalSetor', 'desc'));
    const unsubscribeRekap = onSnapshot(rekapQuery, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setRekap(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
      setLoading(false);
    });

    // 2. Fetch Warga for select list
    const unsubscribeWarga = onSnapshot(query(collection(db, 'warga'), orderBy('nama', 'asc')), (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, nama: doc.data().nama, tempatTinggal: doc.data().tempatTinggal });
      });
      setWargaList(data);
    });

    // 3. Fetch Sampah for select list
    const unsubscribeSampah = onSnapshot(query(collection(db, 'sampah'), orderBy('namaSampah', 'asc')), (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ 
          id: doc.id, 
          namaSampah: doc.data().namaSampah, 
          typeSampah: doc.data().typeSampah,
          satuan: doc.data().satuan,
          hargaPerSatuan: doc.data().hargaPerSatuan
        });
      });
      setSampahList(data);
    });

    return () => {
      unsubscribeRekap();
      unsubscribeWarga();
      unsubscribeSampah();
    };
  }, []);

  // Recalculate automatic earnings on change
  useEffect(() => {
    if (formData.sampahId) {
      const trash = sampahList.find(s => s.id === formData.sampahId);
      setSelectedSampah(trash || null);
      if (trash && formData.jumlah) {
        setCalculatedTotal(Number(formData.jumlah) * Number(trash.hargaPerSatuan));
      } else {
        setCalculatedTotal(0);
      }
    } else {
      setSelectedSampah(null);
      setCalculatedTotal(0);
    }
  }, [formData.sampahId, formData.jumlah, sampahList]);

  const resetForm = () => {
    setFormData({
      wargaId: '',
      sampahId: '',
      jumlah: '',
      tanggalSetor: new Date().toISOString().split('T')[0]
    });
    setSelectedSampah(null);
    setCalculatedTotal(0);
    setCurrentId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (transaction) => {
    setFormData({
      wargaId: transaction.wargaId || '',
      sampahId: transaction.sampahId || '',
      jumlah: transaction.jumlah || '',
      tanggalSetor: transaction.tanggalSetor || new Date().toISOString().split('T')[0]
    });
    setCurrentId(transaction.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const { wargaId, sampahId, jumlah, tanggalSetor } = formData;
    if (!wargaId || !sampahId || !jumlah || Number(jumlah) <= 0) {
      showToast('Harap isi formulir dengan benar.', 'error');
      return;
    }

    const wargaUser = wargaList.find(w => w.id === wargaId);
    const sampahType = sampahList.find(s => s.id === sampahId);

    if (!wargaUser || !sampahType) {
      showToast('Warga atau sampah tidak valid.', 'error');
      return;
    }

    setSubmitting(true);

    const transaction = {
      wargaId,
      wargaNama: wargaUser.nama,
      sampahId,
      sampahNama: sampahType.namaSampah,
      typeSampah: sampahType.typeSampah,
      satuan: sampahType.satuan,
      jumlah: Number(jumlah),
      totalRupiah: calculatedTotal,
      tanggalSetor
    };

    try {
      if (currentId) {
        // Update
        await updateDoc(doc(db, 'rekap', currentId), transaction);
        showToast('Transaksi setoran berhasil diperbarui!', 'success');
      } else {
        // Create
        await addDoc(collection(db, 'rekap'), transaction);
        showToast('Transaksi setoran baru berhasil dicatat!', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating/editing transaction: ", error);
      showToast(`Gagal mencatat transaksi setoran: ${error.message || error}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, citizenName) => {
    if (window.confirm(`Apakah Anda yakin ingin membatalkan & menghapus transaksi setoran milik "${citizenName}"?`)) {
      try {
        await deleteDoc(doc(db, 'rekap', id));
        showToast('Transaksi berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting transaction: ", error);
        showToast(`Gagal menghapus transaksi: ${error.message || error}`, 'error');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Group and accumulate savings per citizen
  const getWargaBalances = () => {
    const balanceMap = {};

    rekap.forEach((t) => {
      const key = t.wargaId || t.wargaNama;
      if (!balanceMap[key]) {
        balanceMap[key] = {
          wargaNama: t.wargaNama || 'Warga Tanpa Nama',
          totalSetoranCount: 0,
          totalWeightKg: 0,
          totalWeightLiter: 0,
          totalPayoutRupiah: 0
        };
      }
      balanceMap[key].totalSetoranCount += 1;
      if (t.satuan === 'liter') {
        balanceMap[key].totalWeightLiter += Number(t.jumlah || 0);
      } else {
        balanceMap[key].totalWeightKg += Number(t.jumlah || 0);
      }
      balanceMap[key].totalPayoutRupiah += Number(t.totalRupiah || 0);
    });

    return Object.values(balanceMap);
  };

  const filteredRekap = rekap.filter(r => 
    (r.wargaNama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.sampahNama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.typeSampah || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBalances = getWargaBalances().filter(b =>
    (b.wargaNama || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Toast Notification element */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-[3000] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border text-sm font-semibold transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/20' 
            : 'bg-rose-50 border-rose-200 text-rose-850'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold text-slate-900">LAPORAN REKAPITULASI TABUNGAN SAMPAH DESA KREJENGAN</h1>
        <p className="text-xs text-slate-600 mt-1">Jalan Raya Krejengan No. 45, Kecamatan Krejengan, Kabupaten Probolinggo</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rekap Setoran Sampah</h2>
          <p className="text-xs text-slate-500 mt-1">Catat setoran sampah masuk, hitung saldo nasabah otomatis, dan ekspor berkas PDF</p>
        </div>
        <div className="flex flex-wrap gap-2 md:self-start">
          <button 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer" 
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Cetak / Ekspor PDF
          </button>
          <button 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition cursor-pointer" 
            onClick={handleOpenCreate}
          >
            <Plus className="w-4 h-4" /> Catat Setoran Baru
          </button>
        </div>
      </div>

      {/* Switch Tab (Riwayat vs Saldo) */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-sm mb-6 no-print">
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'riwayat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListFilter className="w-4 h-4" /> Riwayat Setoran
        </button>
        <button
          onClick={() => setActiveTab('saldo')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'saldo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Saldo Per Warga
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-6 shadow-sm no-print">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder={activeTab === 'riwayat' ? "Cari transaksi berdasarkan nama nasabah, jenis sampah, atau tipe..." : "Cari nasabah..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm font-sans text-slate-700 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin-custom"></div>
        </div>
      ) : activeTab === 'riwayat' ? (
        // RIWAYAT TAB (Transaction History)
        filteredRekap.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm no-print">
            <span className="text-5xl">📝</span>
            <p className="text-slate-500 font-bold mt-3">Tidak ditemukan data transaksi setoran.</p>
            <p className="text-xs text-slate-400 mt-1">Mulai mencatat setoran warga agar datanya terisi dan tayang di beranda.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200 table-container">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="px-6 py-4">Nama Nasabah</th>
                  <th className="px-6 py-4">Jenis Sampah</th>
                  <th className="px-6 py-4">Kategori / Tipe</th>
                  <th className="px-6 py-4 text-right">Jumlah Setor</th>
                  <th className="px-6 py-4 text-right">Total (Rp)</th>
                  <th className="px-6 py-4 text-center">Tanggal Setor</th>
                  <th className="px-6 py-4 w-28 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRekap.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">{item.wargaNama}</td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">{item.sampahNama}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.typeSampah === 'Organik' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : item.typeSampah === 'Anorganik'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.typeSampah}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {item.jumlah} {item.satuan}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {formatRupiah(item.totalRupiah)}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500 font-medium">
                      {item.tanggalSetor}
                    </td>
                    <td className="px-6 py-4 no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(item)} 
                          className="p-1.5 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-600 rounded-lg bg-white hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Setoran"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.wargaNama)} 
                          className="p-1.5 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg bg-white hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Setoran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // SALDO PER WARGA TAB
        filteredBalances.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm no-print">
            <span className="text-5xl">👤</span>
            <p className="text-slate-500 font-bold mt-3">Tidak ada ringkasan saldo nasabah.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200 table-container">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="px-6 py-4">Nama Nasabah</th>
                  <th className="px-6 py-4 text-center">Frekuensi Setor</th>
                  <th className="px-6 py-4 text-right">Akumulasi Berat (kg)</th>
                  <th className="px-6 py-4 text-right">Akumulasi Volume (liter)</th>
                  <th className="px-6 py-4 text-right">Total Tabungan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBalances.map((b, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">{b.wargaNama}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {b.totalSetoranCount} kali setoran
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {b.totalWeightKg.toFixed(1)} kg
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {b.totalWeightLiter.toFixed(1)} liter
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {formatRupiah(b.totalPayoutRupiah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 no-print" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                {currentId ? 'Edit Transaksi Setoran' : 'Catat Transaksi Setoran Sampah'}
              </h3>
              <button 
                onClick={() => !submitting && setShowModal(false)}
                disabled={submitting}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition text-xl cursor-pointer disabled:opacity-50"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                
                {/* Select Warga */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="rekap-warga">Pilih Nasabah / Warga</label>
                  {wargaList.length === 0 ? (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      Belum ada data warga. Silakan tambah data di menu "Data Warga" terlebih dahulu.
                    </div>
                  ) : (
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        id="rekap-warga"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                        value={formData.wargaId}
                        onChange={(e) => setFormData({ ...formData, wargaId: e.target.value })}
                      >
                        <option value="">-- Pilih Warga Nasabah --</option>
                        {wargaList.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.nama} ({w.tempatTinggal})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Select Sampah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="rekap-sampah">Pilih Jenis Sampah</label>
                  {sampahList.length === 0 ? (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      Belum ada data jenis sampah. Silakan tambah data di menu "Data Sampah" terlebih dahulu.
                    </div>
                  ) : (
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        id="rekap-sampah"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                        value={formData.sampahId}
                        onChange={(e) => setFormData({ ...formData, sampahId: e.target.value })}
                      >
                        <option value="">-- Pilih Jenis Sampah --</option>
                        {sampahList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.namaSampah} ({s.typeSampah}) - {formatRupiah(s.hargaPerSatuan)}/{s.satuan}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="rekap-jumlah">
                      Jumlah Setoran ({selectedSampah ? selectedSampah.satuan : 'kg/liter'})
                    </label>
                    <div className="relative">
                      <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="rekap-jumlah"
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        placeholder="Contoh: 2.5"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                        value={formData.jumlah}
                        onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="rekap-tgl">Tanggal Setor</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="rekap-tgl"
                        type="date"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                        value={formData.tanggalSetor}
                        onChange={(e) => setFormData({ ...formData, tanggalSetor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Autocalculated Earnings Display */}
                {selectedSampah && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-6 space-y-1">
                    <div className="flex justify-between text-xs font-medium text-emerald-800">
                      <span>Tarif Satuan:</span>
                      <span>{formatRupiah(selectedSampah.hargaPerSatuan)} / {selectedSampah.satuan}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-emerald-800">
                      <span>Jumlah Setoran:</span>
                      <span>{formData.jumlah || 0} {selectedSampah.satuan}</span>
                    </div>
                    <hr className="border-t border-dashed border-emerald-200 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-900">Total Hasil Rupiah:</span>
                      <span className="text-lg font-extrabold text-emerald-700">{formatRupiah(calculatedTotal)}</span>
                    </div>
                  </div>
                )}

              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-3xl">
                <button 
                  type="button" 
                  disabled={submitting}
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || wargaList.length === 0 || sampahList.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Transaksi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRekap;
