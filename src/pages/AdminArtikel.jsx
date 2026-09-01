import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import { Plus, Search, Edit2, Trash2, BookOpen, Calendar, AlignLeft, FileText, Loader2 } from 'lucide-react';
import { compressImageToBase64 } from '../utils/imageCompressor';

const AdminArtikel = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null); // null for create, ID for edit
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD input default
    excerpt: '',
    content: '',
    img: '',
    createdAt: ''
  });

  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch Articles from Firestore
  useEffect(() => {
    const q = query(collection(db, 'artikel'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setArticles(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching articles: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format YYYY-MM-DD to "DD MMMM YYYY" in Indonesian
  const formatIndonesianDate = (dateStr) => {
    if (!dateStr) return '';
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (/[a-zA-Z]/.test(dateStr)) return dateStr;

    const dateParts = dateStr.split('-');
    if (dateParts.length === 3) {
      const year = dateParts[0];
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Convert "DD MMMM YYYY" back to "YYYY-MM-DD" for HTML date input
  const convertToInputDate = (indoDateStr) => {
    if (!indoDateStr) return new Date().toISOString().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(indoDateStr)) return indoDateStr;

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const parts = indoDateStr.split(' ');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const monthName = parts[1];
      const year = parts[2];
      const monthIndex = months.indexOf(monthName);
      if (monthIndex !== -1) {
        const month = String(monthIndex + 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      excerpt: '',
      content: '',
      img: '',
      createdAt: ''
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
      title: item.title || '',
      date: convertToInputDate(item.date),
      excerpt: item.excerpt || '',
      content: item.content || '',
      img: item.img || '',
      createdAt: item.createdAt || new Date().toISOString()
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
        setFormData(prev => ({ ...prev, img: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.title || !formData.content || (!formData.img && !selectedFile)) {
      alert("Harap isi semua bidang wajib, termasuk mengunggah gambar!");
      return;
    }

    setSubmitting(true);

    try {
      let finalImgUrl = formData.img;
      if (selectedFile || (formData.img && formData.img.startsWith('data:image'))) {
        finalImgUrl = await compressImageToBase64(selectedFile || formData.img);
      }

      const savedDate = formatIndonesianDate(formData.date);

      const dataToSave = {
        title: formData.title,
        date: savedDate,
        excerpt: formData.excerpt || formData.content.slice(0, 150) + '...',
        content: formData.content,
        img: finalImgUrl,
        createdAt: formData.createdAt || new Date().toISOString()
      };

      if (currentId) {
        // Update
        const docRef = doc(db, 'artikel', currentId);
        await updateDoc(docRef, dataToSave);
        showToast('Artikel berhasil diperbarui!', 'success');
      } else {
        // Create
        await addDoc(collection(db, 'artikel'), dataToSave);
        showToast('Artikel baru berhasil ditambahkan!', 'success');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving article: ", error);
      showToast(`Gagal menyimpan artikel: ${error.message || error}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus artikel "${title}"?`)) {
      try {
        await deleteDoc(doc(db, 'artikel', id));
        showToast(`Artikel "${title}" berhasil dihapus!`, 'success');
      } catch (error) {
        console.error("Error deleting article: ", error);
        showToast(`Gagal menghapus artikel: ${error.message || error}`, 'error');
      }
    }
  };

  const filteredArticles = articles.filter(item => 
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Artikel Edukasi</h2>
          <p className="text-xs text-slate-500 mt-1">Buat, edit, dan hapus artikel edukasi (Gambar tersimpan langsung di Firestore)</p>
        </div>
        <button 
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition cursor-pointer md:self-start" 
          onClick={handleOpenCreate}
        >
          <Plus className="w-4 h-4" /> Tambah Artikel
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-6 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Cari berdasarkan judul, ringkasan, atau isi artikel..."
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
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <span className="text-5xl">📝</span>
          <p className="text-slate-500 font-bold mt-3">Tidak ditemukan artikel edukasi.</p>
          <p className="text-xs text-slate-400 mt-1">Mulai tulis artikel baru untuk memberikan wawasan pengelolaan sampah kepada warga.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="px-6 py-4 w-32">Sampul</th>
                <th className="px-6 py-4">Judul Artikel</th>
                <th className="px-6 py-4">Tanggal Rilis</th>
                <th className="px-6 py-4">Ringkasan</th>
                <th className="px-6 py-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3">
                    {item.img ? (
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className="w-20 h-14 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 shadow-sm">
                        🖼️
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate" title={item.title}>
                    {item.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.date}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-md truncate" title={item.excerpt}>
                    {item.excerpt}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEdit(item)} 
                        className="p-1.5 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-600 rounded-lg bg-white hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Artikel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.title)} 
                        className="p-1.5 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg bg-white hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Artikel"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {currentId ? 'Edit Artikel Edukasi' : 'Tambah Artikel Edukasi'}
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
                    {formData.img ? (
                      <img 
                        src={formData.img} 
                        alt="Preview" 
                        className="w-28 h-20 object-cover rounded-xl border-2 border-emerald-500 shadow-md"
                      />
                    ) : (
                      <div className="w-28 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-2xl text-slate-400 border border-dashed border-slate-300 shadow-md">
                        🖼️
                      </div>
                    )}
                  </div>
                  <div className="w-full text-center sm:text-left">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gambar Sampul Artikel (Kompres Otomatis)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      required={!currentId && !formData.img}
                      className="text-xs text-slate-500 w-full cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gambar dikompres otomatis di browser & disimpan di Firestore.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="article-title">Judul Artikel</label>
                    <input
                      id="article-title"
                      type="text"
                      required
                      placeholder="Contoh: Pentingnya Memilah Sampah Plastik..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="article-date">Tanggal Rilis</label>
                    <input
                      id="article-date"
                      type="date"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="article-excerpt">Ringkasan Singkat / Excerpt (Opsional)</label>
                  <textarea
                    id="article-excerpt"
                    rows="2"
                    placeholder="Tuliskan 1-2 kalimat ringkasan artikel. Jika dikosongkan, ringkasan akan diambil otomatis dari paragraf pertama konten."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 resize-none"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="article-content">Isi Konten Artikel</label>
                  <textarea
                    id="article-content"
                    rows="8"
                    required
                    placeholder="Tuliskan isi artikel edukasi lengkap di sini..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 font-sans"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
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

export default AdminArtikel;
