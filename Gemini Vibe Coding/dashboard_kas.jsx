import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';

// Konfigurasi Firebase dari environment
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mushalla-as-salaam-app';

const TREASURER_PWD = "Suntea101";

export default function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'pemasukan',
    password: ''
  });
  const [filters, setFilters] = useState({
    month: 'all',
    year: new Date().getFullYear().toString()
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, password: '' });
  const [toast, setToast] = useState({ show: false, msg: '', isError: false });
  const [darkMode, setDarkMode] = useState(false);

  // 1. Auth initialization (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data fetching (Rule 1 & 2)
  useEffect(() => {
    if (!user) return;

    // Menggunakan path sesuai Rule 1
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    
    // Sesuai Rule 2: Fetch semua, sorting di memori
    const q = query(colRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      showToast("Gagal memuat data", true);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const totalSaldo = transactions.reduce((acc, curr) => 
      curr.type === 'pemasukan' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchMonth = filters.month === 'all' || tDate.getMonth().toString() === filters.month;
      const matchYear = filters.year === 'all' || tDate.getFullYear().toString() === filters.year;
      return matchMonth && matchYear;
    });

    const filteredIn = filtered.reduce((acc, curr) => curr.type === 'pemasukan' ? acc + Number(curr.amount) : acc, 0);
    const filteredOut = filtered.reduce((acc, curr) => curr.type === 'pengeluaran' ? acc + Number(curr.amount) : acc, 0);

    return { totalSaldo, filteredIn, filteredOut, filteredList: filtered };
  }, [transactions, filters]);

  const showToast = (msg, isError = false) => {
    setToast({ show: true, msg, isError });
    setTimeout(() => setToast({ show: false, msg: '', isError: false }), 3000);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (formData.password !== TREASURER_PWD) {
      showToast("Kata sandi bendahara salah!", true);
      return;
    }

    try {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      await addDoc(colRef, {
        desc: formData.desc,
        amount: Number(formData.amount),
        date: formData.date,
        type: formData.type,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      
      setFormData({ ...formData, desc: '', amount: '', password: '' });
      showToast("Tersimpan ke database");
    } catch (err) {
      showToast("Gagal menyimpan", true);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteModal.id) return;
    if (deleteModal.password !== TREASURER_PWD) {
      showToast("Kata sandi salah!", true);
      return;
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', deleteModal.id);
      await deleteDoc(docRef);
      setDeleteModal({ show: false, id: null, password: '' });
      showToast("Berhasil dihapus");
    } catch (err) {
      showToast("Gagal menghapus", true);
    }
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2023; y <= Math.max(currentYear, 2023) + 1; y++) {
      years.push(y.toString());
    }
    return years.reverse();
  }, []);

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen transition-colors duration-300`}>
      <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen pb-20 text-zinc-800 dark:text-zinc-200">
        
        <nav className="bg-emerald-700 dark:bg-emerald-900 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Saldo Kas Mushalla As Salaam
            </h1>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-emerald-600">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-4 mt-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-zinc-500 font-bold uppercase">Total Kas Real-time</p>
              <h2 className="text-3xl font-bold mt-1">
                {loading ? "..." : formatIDR(stats.totalSaldo)}
              </h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500">
              <p className="text-xs text-zinc-500 font-bold uppercase">Masuk</p>
              <h2 className="text-2xl font-bold text-emerald-600 mt-1">{formatIDR(stats.filteredIn)}</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border-l-4 border-rose-500">
              <p className="text-xs text-zinc-500 font-bold uppercase">Keluar</p>
              <h2 className="text-2xl font-bold text-rose-600 mt-1">{formatIDR(stats.filteredOut)}</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border dark:border-zinc-800 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h3 className="text-lg font-bold">Riwayat Transaksi</h3>
              <div className="flex gap-2">
                <select value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})} className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg text-sm">
                  <option value="all">Semua Bulan</option>
                  {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg text-sm">
                  <option value="all">Semua Tahun</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-400 text-xs uppercase border-b dark:border-zinc-800">
                    <th className="pb-3 px-2">Tanggal</th>
                    <th className="pb-3 px-2">Keterangan</th>
                    <th className="pb-3 px-2">Nominal</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.filteredList.map((t) => (
                    <tr key={t.id} className="border-b dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-colors">
                      <td className="py-4 px-2 text-xs font-mono">{t.date}</td>
                      <td className="py-4 px-2 font-medium">{t.desc}</td>
                      <td className={`py-4 px-2 font-bold ${t.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {t.type === 'pemasukan' ? '+' : '-'} {formatIDR(t.amount)}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button onClick={() => setDeleteModal({ show: true, id: t.id, password: '' })} className="p-2 opacity-0 group-hover:opacity-100">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center mb-12 space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-xl max-w-xs">
              <img src="QRIS_Musholla.jpg" alt="QRIS" className="w-full rounded-xl" />
            </div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Infaq Digital Melalui QRIS</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-lg border dark:border-zinc-800">
            <h3 className="text-xl font-bold mb-6">Input Transaksi</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Keterangan" required className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl outline-none" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
                <input type="number" placeholder="Nominal" required className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" required className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <select className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="pemasukan">Pemasukan (+)</option>
                  <option value="pengeluaran">Pengeluaran (-)</option>
                </select>
              </div>
              <input type="password" placeholder="Sandi Bendahara" required className="w-full px-4 py-3 bg-rose-50/20 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg">Simpan Transaksi</button>
            </form>
          </div>
        </div>
      </div>

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full">
            <h4 className="text-xl font-bold mb-4 text-center">Konfirmasi Hapus</h4>
            <input type="password" placeholder="Sandi" className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4 border dark:border-zinc-700 outline-none" value={deleteModal.password} onChange={e => setDeleteModal({...deleteModal, password: e.target.value})} />
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({show: false, id: null, password: ''})} className="flex-1 py-3 font-bold text-zinc-500">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-3 font-bold bg-rose-600 text-white rounded-xl">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold text-sm z-[200] animate-bounce ${toast.isError ? 'bg-rose-600' : 'bg-zinc-800 dark:bg-emerald-700'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}