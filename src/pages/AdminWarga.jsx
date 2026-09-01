import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import { Plus, Search, Edit2, Trash2, UserPlus, Image as ImageIcon, Phone, Home as HomeIcon, Calendar, Loader2 } from 'lucide-react';
import { compressImageToBase64 } from '../utils/imageCompressor';

const AdminWarga = () => {
  const [warga, setWarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null); // null for create, ID for edit
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    tempatTinggal: '',
    nomorHp: '',
    foto: '',
    tanggalRegistrasi: new Date().toISOString().split('T')[0]
  });

  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch Warga from Firestore
  useEffect(() => {
    const q = query(collection(db, 'warga'), orderBy('nama', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setWarga(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching citizens: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      nama: '',
      tempatTinggal: '',
      nomorHp: '',
      foto: '',
      tanggalRegistrasi: new Date().toISOString().split('T')[0]
    });
    setSelectedFile(null);
    setCurrentId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (citizen) => {
    setFormData({
      nama: citizen.nama || '',
      tempatTinggal: citizen.tempatTinggal || '',
      nomorHp: citizen.nomorHp || '',
      foto: citizen.foto || '',
      tanggalRegistrasi: citizen.tanggalRegistrasi || new Date().toISOString().split('T')[0]
    });
    setSelectedFile(null);
    setCurrentId(citizen.id);
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
    if (!formData.nama) return;

    setSubmitting(true);

    try {
      let finalFotoUrl = formData.foto;
      if (selectedFile || (formData.foto && formData.foto.startsWith('data:image'))) {
        finalFotoUrl = await compressImageToBase64(selectedFile || formData.foto);
      }

      const dataToSave = {
        ...formData,
        foto: finalFotoUrl
      };

      if (currentId) {
        // Update
        const docRef = doc(db, 'warga', currentId);
        await updateDoc(docRef, dataToSave);
        showToast('Data warga berhasil diperbarui!', 'success');
      } else {
        // Create
        await addDoc(collection(db, 'warga'), dataToSave);
        showToast('Data warga baru berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving citizen: ", error);
      showToast(`Gagal menyimpan data warga: ${error.message || error}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus warga "${name}"? Semua data rekap miliknya tetap ada tetapi referensi nama akan terputus.`)) {
      try {
        await deleteDoc(doc(db, 'warga', id));
        showToast(`Warga "${name}" berhasil dihapus!`, 'success');
      } catch (error) {
        console.error("Error deleting citizen: ", error);
        showToast(`Gagal menghapus data warga: ${error.message || error}`, 'error');
      }
    }
  };

  const filteredWarga = warga.filter(w => 
    (w.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.tempatTinggal || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.nomorHp || '').includes(searchQuery)
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Warga</h2>
          <p className="text-xs text-slate-500 mt-1">Kelola data nasabah/warga penabung Bank Sampah Desa Krejengan</p>
        </div>
        <button 
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition cursor-pointer md:self-start" 
          onClick={handleOpenCreate}
        >
          <Plus className="w-4 h-4" /> Tambah Warga
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-6 shadow-sm no-print">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Cari warga berdasarkan nama, alamat, atau nomor HP..."
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
      ) : filteredWarga.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <span className="text-5xl">👤</span>
          <p className="text-slate-500 font-bold mt-3">Tidak ditemukan data warga.</p>
          <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau tambah warga baru.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="px-6 py-4 w-20">Foto</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Tempat / Alamat Tinggal</th>
                <th className="px-6 py-4">Nomor HP / WA</th>
                <th className="px-6 py-4">Tgl Registrasi</th>
                <th className="px-6 py-4 w-28 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWarga.map((citizen) => (
                <tr key={citizen.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3">
                    {citizen.foto ? (
                      <img 
                        src={citizen.foto} 
                        alt={citizen.nama} 
                        className="w-10 h-10 object-cover rounded-full border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-200">
                        {citizen.nama?.charAt(0) || '👤'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">{citizen.nama}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-sm truncate">{citizen.tempatTinggal}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{citizen.nomorHp || '-'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{citizen.tanggalRegistrasi || '-'}</td>
                  <td className="px-6 py-4 no-print">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEdit(citizen)} 
                        className="p-1.5 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-600 rounded-lg bg-white hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Warga"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(citizen.id, citizen.nama)} 
                        className="p-1.5 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg bg-white hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Warga"
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
                <UserPlus className="w-5 h-5 text-emerald-600" />
                {currentId ? 'Edit Data Warga' : 'Tambah Warga Baru'}
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
                        className="w-16 h-16 object-cover rounded-full border-2 border-emerald-500 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl text-slate-400 border border-dashed border-slate-300 shadow-md">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="w-full text-center sm:text-left">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Foto Profil Warga (Kompres Otomatis)</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="warga-nama">Nama Lengkap</label>
                  <input
                    id="warga-nama"
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="warga-alamat">Tempat / Alamat Tinggal</label>
                  <input
                    id="warga-alamat"
                    type="text"
                    required
                    placeholder="Contoh: RT 02 / RW 01, Dusun Krajan"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    value={formData.tempatTinggal}
                    onChange={(e) => setFormData({ ...formData, tempatTinggal: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="warga-hp">Nomor HP / WhatsApp</label>
                    <input
                      id="warga-hp"
                      type="tel"
                      placeholder="081234567890"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      value={formData.nomorHp}
                      onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="warga-tgl">Tanggal Registrasi</label>
                    <input
                      id="warga-tgl"
                      type="date"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      value={formData.tanggalRegistrasi}
                      onChange={(e) => setFormData({ ...formData, tanggalRegistrasi: e.target.value })}
                    />
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

export default AdminWarga;
