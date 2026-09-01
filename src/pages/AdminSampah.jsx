import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import { Plus, Search, Edit2, Trash2, Tag, Loader2 } from 'lucide-react';
import { compressImageToBase64 } from '../utils/imageCompressor';

const AdminSampah = () => {
  const [sampah, setSampah] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null); // null for create, ID for edit
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    namaSampah: '',
    typeSampah: 'Anorganik',
    satuan: 'kg',
    hargaPerSatuan: 0,
    foto: ''
  });

  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch Sampah from Firestore
  useEffect(() => {
    const q = query(collection(db, 'sampah'), orderBy('namaSampah', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setSampah(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trash types: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      namaSampah: '',
      typeSampah: 'Anorganik',
      satuan: 'kg',
      hargaPerSatuan: 0,
      foto: ''
    });
    setSelectedFile(null);
    setCurrentId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      namaSampah: item.namaSampah || '',
      typeSampah: item.typeSampah || 'Anorganik',
      satuan: item.satuan || 'kg',
      hargaPerSatuan: item.hargaPerSatuan || 0,
      foto: item.foto || ''
    });
    setSelectedFile(null);
    setCurrentId(item.id);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.namaSampah || formData.hargaPerSatuan < 0) return;

    setSubmitting(true);

    try {
      let finalFotoUrl = formData.foto;
      if (selectedFile || (formData.foto && formData.foto.startsWith('data:image'))) {
        finalFotoUrl = await compressImageToBase64(selectedFile || formData.foto);
      }

      const parsedData = {
        ...formData,
        hargaPerSatuan: Number(formData.hargaPerSatuan),
        foto: finalFotoUrl
      };

      if (currentId) {
        // Update
        const docRef = doc(db, 'sampah', currentId);
        await updateDoc(docRef, parsedData);
        showToast('Kategori sampah berhasil diperbarui!', 'success');
      } else {
        // Create
        await addDoc(collection(db, 'sampah'), parsedData);
        showToast('Kategori sampah baru berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving trash category: ", error);
      showToast(`Gagal menyimpan data sampah: ${error.message || error}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jenis sampah "${name}"? Rekap setoran yang mereferensikan sampah ini akan terputus datanya.`)) {
      try {
        await deleteDoc(doc(db, 'sampah', id));
        showToast(`Sampah "${name}" berhasil dihapus!`, 'success');
      } catch (error) {
        console.error("Error deleting trash category: ", error);
        showToast(`Gagal menghapus data sampah: ${error.message || error}`, 'error');
      }
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const filteredSampah = sampah.filter(s => 
    (s.namaSampah || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.typeSampah || '').toLowerCase().includes(searchQuery.toLowerCase())
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kategori & Harga Sampah</h2>
          <p className="text-xs text-slate-500 mt-1">Kelola daftar jenis sampah, satuan unit (kg/liter), dan harga tukar rupiahnya</p>
        </div>
        <button 
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition cursor-pointer md:self-start" 
          onClick={handleOpenCreate}
        >
          <Plus className="w-4 h-4" /> Tambah Jenis Sampah
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-6 shadow-sm no-print">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Cari jenis sampah berdasarkan nama atau tipe..."
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
      ) : filteredSampah.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <span className="text-5xl">♻️</span>
          <p className="text-slate-500 font-bold mt-3">Tidak ditemukan data jenis sampah.</p>
          <p className="text-xs text-slate-400 mt-1">Coba tambah jenis sampah baru untuk memulai transaksi tabungan.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="px-6 py-4 w-28">Foto</th>
                <th className="px-6 py-4">Nama Sampah</th>
                <th className="px-6 py-4">Tipe Sampah</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4 text-right">Harga / Satuan</th>
                <th className="px-6 py-4 w-28 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSampah.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3">
                    {item.foto ? (
                      <img 
                        src={item.foto} 
                        alt={item.namaSampah} 
                        className="w-16 h-12 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 shadow-sm">
                        🖼️
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">{item.namaSampah}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.typeSampah === 'Organik' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : item.typeSampah === 'Anorganik'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-850'
                    }`}>
                      {item.typeSampah}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{item.satuan}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    {formatRupiah(item.hargaPerSatuan)}
                  </td>
                  <td className="px-6 py-4 no-print">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEdit(item)} 
                        className="p-1.5 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-600 rounded-lg bg-white hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Sampah"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.namaSampah)} 
                        className="p-1.5 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg bg-white hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Sampah"
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
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 no-print" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                {currentId ? 'Edit Kategori Sampah' : 'Tambah Kategori Sampah'}
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
                
                {/* Photo Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm">
                  <div className="shrink-0">
                    {formData.foto ? (
                      <img 
                        src={formData.foto} 
                        alt="Preview" 
                        className="w-24 h-16 object-cover rounded-xl border-2 border-emerald-500 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-2xl text-slate-400 border border-dashed border-slate-300 shadow-md">
                        🖼️
                      </div>
                    )}
                  </div>
                  <div className="w-full text-center sm:text-left">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Foto Visual Sampah (Kompres Otomatis)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-xs text-slate-500 w-full cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Opsional. Foto dikompres otomatis & disimpan di Firestore.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="sampah-nama">Nama Sampah</label>
                  <input
                    id="sampah-nama"
                    type="text"
                    required
                    placeholder="Contoh: Botol Plastik PET, Kardus Bekas, Seng..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    value={formData.namaSampah}
                    onChange={(e) => setFormData({ ...formData, namaSampah: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="sampah-tipe">Tipe / Kategori Sampah</label>
                  <select
                    id="sampah-tipe"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    value={formData.typeSampah}
                    onChange={(e) => setFormData({ ...formData, typeSampah: e.target.value })}
                  >
                    <option value="Organik">Organik (Bisa membusuk)</option>
                    <option value="Anorganik">Anorganik (Plastik/Kertas/Logam)</option>
                    <option value="B3">B3 (Bahan Beracun & Berbahaya)</option>
                    <option value="Khusus">Lain-lain / Khusus</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="sampah-satuan">Satuan</label>
                    <select
                      id="sampah-satuan"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      value={formData.satuan}
                      onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="liter">liter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="sampah-harga">Harga Per Satuan (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        id="sampah-harga"
                        type="number"
                        min="0"
                        required
                        placeholder="3000"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 font-semibold"
                        value={formData.hargaPerSatuan}
                        onChange={(e) => setFormData({ ...formData, hargaPerSatuan: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

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
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Data</span>
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

export default AdminSampah;
