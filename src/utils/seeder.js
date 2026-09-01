import { collection, getDocs, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

let isSeedingInProgress = false;
const SEED_KEY = 'db_seeded_storesampah_662d1';

export const seedDatabase = async () => {
  // If already seeded in this browser, skip all network queries immediately
  if (localStorage.getItem(SEED_KEY) === 'true') {
    return;
  }

  if (isSeedingInProgress) {
    return;
  }

  isSeedingInProgress = true;

  try {
    // 0. Seed Default Admin User programmatically if it doesn't exist
    try {
      await createUserWithEmailAndPassword(auth, 'admin@gmail.com', '123321');
      console.log('Default admin user created successfully.');
    } catch (authError) {
      // Ignore if user already exists or auth not yet enabled
    }

    // 1. Check & Seed Warga
    const wargaSnapshot = await getDocs(collection(db, 'warga'));
    let wargaIds = [];
    let wargaNames = {};

    if (wargaSnapshot.empty) {
      const initialWarga = [
        {
          nama: 'Budi Santoso',
          tempatTinggal: 'RT 02 / RW 01, Dusun Krajan',
          nomorHp: '081234567890',
          foto: '',
          tanggalRegistrasi: '2026-01-10'
        },
        {
          nama: 'Siti Aminah',
          tempatTinggal: 'RT 01 / RW 01, Dusun Krajan',
          nomorHp: '085298765432',
          foto: '',
          tanggalRegistrasi: '2026-02-15'
        },
        {
          nama: 'Joko Susilo',
          tempatTinggal: 'RT 03 / RW 02, Dusun Kebon',
          nomorHp: '087711223344',
          foto: '',
          tanggalRegistrasi: '2026-03-05'
        }
      ];

      for (const warga of initialWarga) {
        const docRef = await addDoc(collection(db, 'warga'), warga);
        wargaIds.push(docRef.id);
        wargaNames[docRef.id] = warga.nama;
      }
    } else {
      wargaSnapshot.forEach(doc => {
        wargaIds.push(doc.id);
        wargaNames[doc.id] = doc.data().nama;
      });
    }

    // 2. Check & Seed Sampah
    const sampahSnapshot = await getDocs(collection(db, 'sampah'));
    let sampahIds = [];
    let sampahMap = {};

    if (sampahSnapshot.empty) {
      const initialSampah = [
        {
          namaSampah: 'Botol Plastik PET',
          typeSampah: 'Anorganik',
          satuan: 'kg',
          hargaPerSatuan: 3000,
          foto: ''
        },
        {
          namaSampah: 'Kardus Bekas',
          typeSampah: 'Anorganik',
          satuan: 'kg',
          hargaPerSatuan: 1500,
          foto: ''
        },
        {
          namaSampah: 'Buku & Kertas Bekas',
          typeSampah: 'Anorganik',
          satuan: 'kg',
          hargaPerSatuan: 2000,
          foto: ''
        },
        {
          namaSampah: 'Besi Tua / Logam',
          typeSampah: 'Anorganik',
          satuan: 'kg',
          hargaPerSatuan: 6000,
          foto: ''
        },
        {
          namaSampah: 'Minyak Jelantah',
          typeSampah: 'Organik',
          satuan: 'liter',
          hargaPerSatuan: 4000,
          foto: ''
        }
      ];

      for (const s of initialSampah) {
        const docRef = await addDoc(collection(db, 'sampah'), s);
        sampahIds.push(docRef.id);
        sampahMap[docRef.id] = s;
      }
    } else {
      sampahSnapshot.forEach(doc => {
        sampahIds.push(doc.id);
        sampahMap[doc.id] = doc.data();
      });
    }

    // 3. Check & Seed Rekap (Transactions)
    const rekapSnapshot = await getDocs(collection(db, 'rekap'));
    if (rekapSnapshot.empty && wargaIds.length > 0 && sampahIds.length > 0) {
      const b_id = wargaIds[0];
      const s_id = wargaIds[1] || b_id;
      const j_id = wargaIds[2] || b_id;

      const p_id = sampahIds[0];
      const k_id = sampahIds[1] || p_id;
      const b_iron_id = sampahIds[3] || p_id;
      const o_id = sampahIds[4] || p_id;

      const initialTransactions = [
        {
          wargaId: b_id,
          wargaNama: wargaNames[b_id],
          sampahId: p_id,
          sampahNama: sampahMap[p_id]?.namaSampah || 'Botol Plastik PET',
          typeSampah: sampahMap[p_id]?.typeSampah || 'Anorganik',
          satuan: sampahMap[p_id]?.satuan || 'kg',
          jumlah: 5.5,
          totalRupiah: 5.5 * (sampahMap[p_id]?.hargaPerSatuan || 3000),
          tanggalSetor: '2026-06-14'
        },
        {
          wargaId: s_id,
          wargaNama: wargaNames[s_id],
          sampahId: k_id,
          sampahNama: sampahMap[k_id]?.namaSampah || 'Kardus Bekas',
          typeSampah: sampahMap[k_id]?.typeSampah || 'Anorganik',
          satuan: sampahMap[k_id]?.satuan || 'kg',
          jumlah: 8,
          totalRupiah: 8 * (sampahMap[k_id]?.hargaPerSatuan || 1500),
          tanggalSetor: '2026-06-13'
        }
      ];

      for (const t of initialTransactions) {
        await addDoc(collection(db, 'rekap'), t);
      }
    }

    // 4. Check & Seed Galeri
    const galeriSnapshot = await getDocs(collection(db, 'galeri'));
    if (galeriSnapshot.empty) {
      const initialGaleri = [
        { title: "Sosialisasi Pemilahan Sampah", category: "Sosialisasi", img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop", createdAt: new Date().toISOString() },
        { title: "Penimbangan Sampah Mingguan", category: "Kegiatan", img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop", createdAt: new Date().toISOString() }
      ];
      for (const item of initialGaleri) {
        await addDoc(collection(db, 'galeri'), item);
      }
    }

    // 5. Check & Seed Artikel
    const artikelSnapshot = await getDocs(collection(db, 'artikel'));
    if (artikelSnapshot.empty) {
      const initialArtikel = [
        {
          title: "Panduan Pemilahan Sampah Rumah Tangga Modern",
          date: "12 Juni 2026",
          excerpt: "Memulai hidup minim sampah dari dapur Anda sendiri dengan cara memilah 3 kategori utama...",
          img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
          content: "Memilah sampah dari rumah adalah langkah paling dasar namun memiliki dampak terbesar bagi keberhasilan program Bank Sampah.",
          createdAt: new Date().toISOString()
        }
      ];
      for (const article of initialArtikel) {
        await addDoc(collection(db, 'artikel'), article);
      }
    }

    // Mark as seeded in localStorage so future app loads skip seeding network calls
    localStorage.setItem(SEED_KEY, 'true');
    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding database: ', error);
  } finally {
    isSeedingInProgress = false;
  }
};
