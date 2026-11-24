import { User } from 'firebase/auth';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FilterX,
  Loader2,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  formatIndonesianDate,
  formatIsoDateOnly,
  parseReadableFirestoreError,
  sanitizeDigits,
} from '../lib/utils';
import { exportPpdbWorkbook } from '../services/excelExportService';
import {
  deleteAdminUser,
  deleteRegistrationBundle,
  fetchAllAdmins,
  fetchAllRegistrations,
  fetchBundlesForExport,
  fetchRegistrationBundle,
  getAllAcademicYears,
  saveAcademicYearSettings,
  upsertAdminUser,
} from '../services/ppdbService';
import {
  AcademicYearConfig,
  AdminRole,
  AdminUserRecord,
  PAYMENT_STATUSES,
  PpdbRegistrationRecord,
  PROGRAMS,
  REGISTRATION_STATUSES,
  RegistrationFullBundle,
  SCHOOL_INFO,
} from '../types/ppdb';
import { AdminRegistrationDetailModal } from './AdminRegistrationDetailModal';
import { BrandMark } from './BrandMark';

interface AdminDashboardProps {
  adminUser: User;
  adminRole: AdminRole;
  onSignOut: () => Promise<void>;
  onOpenPublic: () => void;
  onAcademicYearChanged: () => Promise<void>;
}

type AdminSection = 'pendaftar' | 'tahun-pelajaran' | 'kelola-admin';

export function AdminDashboard({
  adminUser,
  adminRole,
  onSignOut,
  onOpenPublic,
  onAcademicYearChanged,
}: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>('pendaftar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<PpdbRegistrationRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearConfig[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUserRecord[]>([]);

  // Filter & Pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYearId, setFilterYearId] = useState<string>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterRegStatus, setFilterRegStatus] = useState<string>('ALL');
  const [filterPayStatus, setFilterPayStatus] = useState<string>('ALL');

  // Detail modal & Export
  const [selectedBundle, setSelectedBundle] = useState<RegistrationFullBundle | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // State Form Tahun Pelajaran
  const [editingYear, setEditingYear] = useState<AcademicYearConfig | null>(null);
  const [isNewYear, setIsNewYear] = useState(false);
  const [savingYear, setSavingYear] = useState(false);
  const [yearFeedback, setYearFeedback] = useState<string | null>(null);

  // State Form Tambah Admin
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('admin');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  const activeAcademicYear = useMemo(
    () => academicYears.find((y) => y.isActive) || academicYears[0],
    [academicYears]
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regs, years, adms] = await Promise.all([
        fetchAllRegistrations(),
        getAllAcademicYears(),
        fetchAllAdmins(),
      ]);
      setRegistrations(regs);
      setAcademicYears(years);
      setAdminsList(adms);
      if (!editingYear && years.length > 0) {
        setEditingYear(years.find((y) => y.isActive) || years[0]);
      }
    } catch (err) {
      setError(parseReadableFirestoreError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Hitung Kartu Statistik (berdasarkan data real Firestore)
  const stats = useMemo(() => {
    const base =
      filterYearId === 'ALL'
        ? registrations
        : registrations.filter((r) => r.academicYearId === filterYearId);

    return {
      total: base.length,
      baru: base.filter((r) => r.registrationStatus === 'Terdaftar').length,
      menungguVerifikasi: base.filter(
        (r) =>
          r.registrationStatus === 'Menunggu Verifikasi' ||
          r.registrationStatus === 'Perlu Perbaikan'
      ).length,
      menungguPembayaran: base.filter(
        (r) =>
          r.registrationStatus === 'Menunggu Pembayaran' ||
          r.paymentStatusSummary === 'Belum Bayar' ||
          r.paymentStatusSummary === 'Menunggu Verifikasi'
      ).length,
      diterima: base.filter((r) => r.registrationStatus === 'Diterima').length,
      ditolak: base.filter((r) => r.registrationStatus === 'Ditolak').length,
      beasiswa: base.filter((r) => r.program.toLowerCase().includes('beasiswa')).length,
    };
  }, [registrations, filterYearId]);

  const filteredRegistrations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return registrations.filter((r) => {
      if (filterYearId !== 'ALL' && r.academicYearId !== filterYearId) return false;
      if (filterProgram !== 'ALL' && r.program !== filterProgram) return false;
      if (filterRegStatus !== 'ALL' && r.registrationStatus !== filterRegStatus) return false;
      if (filterPayStatus !== 'ALL' && r.paymentStatusSummary !== filterPayStatus) return false;

      if (filterDateFrom || filterDateTo) {
        const regIsoDate = formatIsoDateOnly(r.createdAt);
        if (filterDateFrom && regIsoDate < filterDateFrom) return false;
        if (filterDateTo && regIsoDate > filterDateTo) return false;
      }

      if (q) {
        const matchName = r.fullName.toLowerCase().includes(q);
        const matchNick = r.nickname.toLowerCase().includes(q);
        const matchNo = r.registrationNumber.toLowerCase().includes(q);
        const matchParent = r.primaryParentName.toLowerCase().includes(q);
        if (!matchName && !matchNick && !matchNo && !matchParent) return false;
      }
      return true;
    });
  }, [
    registrations,
    searchTerm,
    filterYearId,
    filterDateFrom,
    filterDateTo,
    filterProgram,
    filterRegStatus,
    filterPayStatus,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterYearId('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterProgram('ALL');
    setFilterRegStatus('ALL');
    setFilterPayStatus('ALL');
  };

  const handleOpenDetail = async (registrationId: string) => {
    setLoadingDetailId(registrationId);
    try {
      const bundle = await fetchRegistrationBundle(registrationId);
      if (bundle) {
        setSelectedBundle(bundle);
      }
    } catch (err) {
      setError(parseReadableFirestoreError(err));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleRefreshSelectedAndList = async () => {
    await loadData();
    if (selectedBundle) {
      const refreshed = await fetchRegistrationBundle(selectedBundle.registration.registrationId);
      if (refreshed) setSelectedBundle(refreshed);
    }
  };

  const handleDeleteRegistration = async (item: PpdbRegistrationRecord) => {
    if (
      !window.confirm(
        `Hapus permanen pendaftaran ${item.fullName} (${item.registrationNumber})? Data akan langsung terhapus dari sistem.`
      )
    ) {
      return;
    }
    try {
      await deleteRegistrationBundle(item.registrationId);
      setRegistrations((prev) => prev.filter((r) => r.registrationId !== item.registrationId));
      if (selectedBundle?.registration.registrationId === item.registrationId) {
        setSelectedBundle(null);
      }
    } catch (err) {
      setError(parseReadableFirestoreError(err));
      await loadData();
    }
  };

  const handleExportExcel = async () => {
    if (filteredRegistrations.length === 0) {
      setError('Tidak ada data pendaftar yang sesuai filter untuk diekspor ke Excel.');
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const bundles = await fetchBundlesForExport(filteredRegistrations);
      const label =
        filterYearId === 'ALL'
          ? activeAcademicYear?.yearLabel || 'Semua-Tahun'
          : academicYears.find((y) => y.id === filterYearId)?.yearLabel || filterYearId;
      await exportPpdbWorkbook(bundles, label);
    } catch (err) {
      setError(parseReadableFirestoreError(err));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear) return;
    setSavingYear(true);
    setYearFeedback(null);
    try {
      await saveAcademicYearSettings(editingYear, isNewYear);
      setIsNewYear(false);
      await loadData();
      await onAcademicYearChanged();
      setYearFeedback('Pengaturan tahun pelajaran & kontak sekolah berhasil disimpan.');
    } catch (err) {
      setYearFeedback(parseReadableFirestoreError(err));
    } finally {
      setSavingYear(false);
    }
  };

  const handleCreateNewYearTemplate = () => {
    const nextYearNum = new Date().getFullYear() + 1;
    const label = `${nextYearNum}/${nextYearNum + 1}`;
    const id = `${nextYearNum}_${nextYearNum + 1}`;
    setIsNewYear(true);
    setEditingYear({
      id,
      yearLabel: label,
      yearCode: String(nextYearNum),
      isActive: false,
      isOpen: true,
      currentSequence: 0,
      maxFileSizeMb: activeAcademicYear?.maxFileSizeMb || 5,
      schoolPhone: activeAcademicYear?.schoolPhone || '',
      schoolWhatsapp: activeAcademicYear?.schoolWhatsapp || '',
      schoolEmail: activeAcademicYear?.schoolEmail || '',
      schoolAddress: activeAcademicYear?.schoolAddress || '',
      announcementNote: activeAcademicYear?.announcementNote || '',
    });
    setYearFeedback(null);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.includes('@') || newAdminName.trim().length < 2) {
      setAdminFeedback('Masukkan email Google dan nama admin yang valid.');
      return;
    }
    setSavingAdmin(true);
    setAdminFeedback(null);
    try {
      await upsertAdminUser({
        email: newAdminEmail,
        displayName: newAdminName,
        role: newAdminRole,
        active: true,
        addedBy: adminUser.email || 'admin',
      });
      setNewAdminEmail('');
      setNewAdminName('');
      const updated = await fetchAllAdmins();
      setAdminsList(updated);
      setAdminFeedback('Admin baru berhasil ditambahkan dan diaktifkan.');
    } catch (err) {
      setAdminFeedback(parseReadableFirestoreError(err));
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleToggleAdminActive = async (item: AdminUserRecord) => {
    try {
      await upsertAdminUser({
        email: item.email,
        displayName: item.displayName,
        role: item.role,
        active: !item.active,
        addedBy: adminUser.email || 'admin',
      });
      setAdminsList(await fetchAllAdmins());
    } catch (err) {
      setAdminFeedback(parseReadableFirestoreError(err));
    }
  };

  const handleDeleteAdmin = async (item: AdminUserRecord) => {
    if (item.email.toLowerCase() === SCHOOL_INFO.rootAdminEmail) return;
    try {
      await deleteAdminUser(item.id);
      setAdminsList(await fetchAllAdmins());
    } catch (err) {
      setAdminFeedback(parseReadableFirestoreError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigasi */}
      <aside className="lg:w-64 bg-emerald-950 text-white shrink-0 flex flex-col justify-between no-print">
        <div>
          <div className="p-5 border-b border-emerald-900 flex flex-col items-center text-center gap-2.5">
            <BrandMark size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300">Assalamu’alaikum Wr. Wb. ✨</p>
              <p className="font-display font-bold text-sm mt-1 truncate">{SCHOOL_INFO.name}</p>
              <p className="text-xs text-emerald-300 truncate">Dashboard Panitia & Admin PPDB</p>
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {[
              { id: 'pendaftar' as const, label: 'Data Pendaftar', icon: Users },
              { id: 'tahun-pelajaran' as const, label: 'Tahun Pelajaran', icon: Calendar },
              { id: 'kelola-admin' as const, label: 'Kelola Admin', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-emerald-800 text-amber-300'
                      : 'text-emerald-100 hover:bg-emerald-900/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dekorasi Siluet Masjid */}
        <div className="relative h-28 overflow-hidden opacity-30 pointer-events-none my-2">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/40 to-transparent" />
          <svg className="absolute bottom-0 w-full text-emerald-700 fill-current" viewBox="0 0 500 150">
            <path d="M0,150 L500,150 L500,120 Q450,110 400,120 Q350,90 300,120 Q250,60 200,120 Q150,100 100,120 Q50,110 0,120 Z" />
            <path d="M220,120 L220,70 Q250,40 280,70 L280,120 Z" />
            <circle cx="250" cy="50" r="4" fill="currentColor" />
          </svg>
        </div>

        <div className="hidden lg:block p-4 border-t border-emerald-900 space-y-3 text-xs">
          <div>
            <p className="text-emerald-300">Masuk sebagai</p>
            <p className="font-semibold text-white truncate mt-0.5">{adminUser.email}</p>
            <p className="text-amber-300 font-mono mt-0.5 uppercase">{adminRole}</p>
          </div>

          <button
            type="button"
            onClick={onOpenPublic}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-900 hover:bg-emerald-800 rounded-lg text-emerald-100 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Halaman Publik</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-900/50 hover:bg-red-900/60 border border-emerald-800 rounded-lg text-emerald-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              {section === 'pendaftar'
                ? 'Manajemen Pendaftar PPDB'
                : section === 'tahun-pelajaran'
                  ? 'Pengaturan Tahun Pelajaran & Sekolah'
                  : 'Manajemen Hak Akses Admin'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {SCHOOL_INFO.name} · Tahun Pelajaran Aktif:{' '}
              <strong className="text-emerald-900">
                {activeAcademicYear?.yearLabel || '2027/2028'}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {section === 'pendaftar' && (
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting || filteredRegistrations.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                )}
                <span>{exporting ? 'Menyiapkan XLSX...' : 'Export Excel (.xlsx)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm">
              {error}
            </div>
          )}

          {/* BAGIAN 1: DATA PENDAFTAR */}
          {section === 'pendaftar' && (
            <>
              {/* 6 Kartu Statistik */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <StatCard label="Total Pendaftar" value={stats.total} icon={Users} tone="emerald" />
                <StatCard label="Pendaftar Baru" value={stats.baru} icon={CheckCircle2} tone="blue" />
                <StatCard label="Menunggu Verifikasi" value={stats.menungguVerifikasi} icon={Clock} tone="amber" />
                <StatCard label="Menunggu Pembayaran" value={stats.menungguPembayaran} icon={CreditCard} tone="purple" />
                <StatCard label="Diterima" value={stats.diterima} icon={CheckCircle2} tone="emerald" />
                <StatCard label="Ditolak" value={stats.ditolak} icon={XCircle} tone="red" />
              </div>

              {/* Filter & Pencarian */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari nama anak / No. Registrasi / orang tua..."
                      className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={filterYearId}
                      onChange={(e) => setFilterYearId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ALL">Semua Tahun</option>
                      {academicYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          TP {y.yearLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={filterProgram}
                      onChange={(e) => setFilterProgram(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ALL">Semua Program</option>
                      {PROGRAMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={filterRegStatus}
                      onChange={(e) => setFilterRegStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ALL">Semua Status Daftar</option>
                      {REGISTRATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={filterPayStatus}
                      onChange={(e) => setFilterPayStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ALL">Semua Status Bayar</option>
                      {PAYMENT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 font-medium">Filter Tanggal Daftar:</span>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                    <span className="text-slate-400">s/d</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 tabular-nums">
                      Menampilkan <strong>{filteredRegistrations.length}</strong> dari{' '}
                      {registrations.length} pendaftar
                    </span>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-emerald-800 hover:underline font-semibold cursor-pointer"
                    >
                      <FilterX className="w-3.5 h-3.5" />
                      <span>Reset Filter</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabel Pendaftar */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-sm text-slate-500">
                    Memuat data pendaftar dari Firestore...
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <p className="font-display font-bold text-slate-900">
                      Belum Ada Data Pendaftar
                    </p>
                    <p className="text-sm text-slate-500">
                      {registrations.length === 0
                        ? 'Data pendaftar baru dari formulir orang tua akan muncul otomatis di tabel ini.'
                        : 'Tidak ada pendaftar yang cocok dengan kombinasi pencarian atau filter saat ini.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4 whitespace-nowrap">No. Registrasi</th>
                          <th className="py-3 px-4 whitespace-nowrap">Tanggal Daftar</th>
                          <th className="py-3 px-4 whitespace-nowrap">Nama Anak</th>
                          <th className="py-3 px-4 whitespace-nowrap">JK</th>
                          <th className="py-3 px-4 whitespace-nowrap">Nama Orang Tua</th>
                          <th className="py-3 px-4 whitespace-nowrap">WhatsApp</th>
                          <th className="py-3 px-4 whitespace-nowrap">Program</th>
                          <th className="py-3 px-4 whitespace-nowrap">Status Pendaftaran</th>
                          <th className="py-3 px-4 whitespace-nowrap">Status Pembayaran</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                        {filteredRegistrations.map((item) => (
                          <tr
                            key={item.registrationId}
                            className="hover:bg-emerald-50/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-emerald-900 whitespace-nowrap tabular-nums">
                              <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                                {item.registrationNumber}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap tabular-nums">
                              {formatIndonesianDate(item.createdAt, true)}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {item.fullName}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {item.gender === 'Laki-laki' ? 'L' : 'P'}
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                              {item.primaryParentName}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap tabular-nums">
                              <div className="inline-flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{item.primaryWhatsapp}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                              {item.program}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {statusBadge(item.registrationStatus)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {paymentBadge(item.paymentStatusSummary)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                              <button
                                type="button"
                                onClick={() => void handleOpenDetail(item.registrationId)}
                                disabled={loadingDetailId === item.registrationId}
                                title="Lihat Detail"
                                className="inline-flex items-center justify-center w-8 h-8 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full cursor-pointer transition-colors"
                              >
                                {loadingDetailId === item.registrationId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteRegistration(item)}
                                title="Hapus pendaftaran"
                                className="inline-flex items-center justify-center w-8 h-8 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* BAGIAN 2: TAHUN PELAJARAN & KONTAK SEKOLAH */}
          {section === 'tahun-pelajaran' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Daftar Tahun Pelajaran
                  </h2>
                  <button
                    type="button"
                    onClick={handleCreateNewYearTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tahun</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {academicYears.map((y) => (
                    <button
                      key={y.id}
                      type="button"
                      onClick={() => {
                        setIsNewYear(false);
                        setEditingYear(y);
                        setYearFeedback(null);
                      }}
                      className={`w-full p-4 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        editingYear?.id === y.id ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-display font-bold text-sm text-slate-900">
                          Tahun Pelajaran {y.yearLabel}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          Kode: PPDB-{y.yearCode}-xxxx · Urutan: {y.currentSequence}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className={y.isActive ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                          {y.isActive ? 'Aktif' : 'Arsip'}
                        </p>
                        <p className={y.isOpen ? 'text-emerald-700' : 'text-amber-700'}>
                          {y.isOpen ? 'Dibuka' : 'Ditutup'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
                {editingYear ? (
                  <form onSubmit={handleSaveYear} className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                      <Settings className="w-4 h-4 text-emerald-800" />
                      <h2 className="font-display text-base font-bold text-slate-900">
                        {isNewYear
                          ? 'Tambah Tahun Pelajaran Baru'
                          : `Edit Tahun Pelajaran ${editingYear.yearLabel}`}
                      </h2>
                    </div>

                    {yearFeedback && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        {yearFeedback}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Label Tahun Pelajaran
                        </label>
                        <input
                          type="text"
                          required
                          value={editingYear.yearLabel}
                          onChange={(e) =>
                            setEditingYear({ ...editingYear, yearLabel: e.target.value })
                          }
                          placeholder="2027/2028"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Kode Tahun Nomor Registrasi (4 Digit)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={editingYear.yearCode}
                          onChange={(e) =>
                            setEditingYear({
                              ...editingYear,
                              yearCode: sanitizeDigits(e.target.value, 4),
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Batas Ukuran Unggah File (MB)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={editingYear.maxFileSizeMb}
                          onChange={(e) =>
                            setEditingYear({
                              ...editingYear,
                              maxFileSizeMb: Number(e.target.value) || 5,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Telepon Panitia
                        </label>
                        <input
                          type="text"
                          value={editingYear.schoolPhone}
                          onChange={(e) =>
                            setEditingYear({ ...editingYear, schoolPhone: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Nomor WhatsApp Panitia (format 628...)
                        </label>
                        <input
                          type="text"
                          value={editingYear.schoolWhatsapp}
                          onChange={(e) =>
                            setEditingYear({ ...editingYear, schoolWhatsapp: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Email Resmi PPDB
                        </label>
                        <input
                          type="email"
                          value={editingYear.schoolEmail}
                          onChange={(e) =>
                            setEditingYear({ ...editingYear, schoolEmail: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="text-sm">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Alamat Sekolah
                      </label>
                      <input
                        type="text"
                        value={editingYear.schoolAddress}
                        onChange={(e) =>
                          setEditingYear({ ...editingYear, schoolAddress: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div className="text-sm">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Pengumuman Halaman Beranda
                      </label>
                      <textarea
                        rows={2}
                        value={editingYear.announcementNote || ''}
                        onChange={(e) =>
                          setEditingYear({ ...editingYear, announcementNote: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingYear.isActive}
                          onChange={(e) =>
                            setEditingYear({ ...editingYear, isActive: e.target.checked })
                          }
                          className="w-4 h-4 accent-emerald-800"
                        />
                        <span>Jadikan Tahun Pelajaran Aktif di Halaman Publik</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingYear.isOpen}
                          onChange={(e) =>
                            setEditingYear({ ...editingYear, isOpen: e.target.checked })
                          }
                          className="w-4 h-4 accent-emerald-800"
                        />
                        <span>Pendaftaran Dibuka (Terima Formulir Baru)</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingYear}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer"
                      >
                        {savingYear ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>Simpan Pengaturan</span>
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          )}

          {/* BAGIAN 3: KELOLA ADMIN */}
          {section === 'kelola-admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="font-display text-base font-bold text-slate-900 mb-1">
                  Tambah Admin / Bendahara Baru
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Masukkan alamat email Google resmi yang diizinkan mengakses dashboard /ppdb-admin.
                </p>

                {adminFeedback && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    {adminFeedback}
                  </div>
                )}

                <form onSubmit={handleAddAdmin} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alamat Email Google
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="panitia@gmail.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Lengkap / Jabatan
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Contoh: Ibu Gian Dwi Wahyuni"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Peran (Role)
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                    >
                      <option value="admin">Admin Panitia PPDB</option>
                      <option value="bendahara">Bendahara Sekolah</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={savingAdmin}
                    className="w-full px-4 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer"
                  >
                    {savingAdmin ? 'Menyimpan...' : 'Aktifkan Akses Admin'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Daftar Pengelola Terdaftar
                  </h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {adminsList.map((adm) => {
                    const isRoot = adm.email.toLowerCase() === SCHOOL_INFO.rootAdminEmail;
                    return (
                      <div
                        key={adm.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{adm.displayName}</p>
                          <p className="text-xs text-slate-500">
                            {adm.email} · <span className="font-mono uppercase">{adm.role}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              adm.active ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {adm.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                          {!isRoot && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleToggleAdminActive(adm)}
                                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                              >
                                {adm.active ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteAdmin(adm)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Hapus admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Detail Pendaftar */}
      {selectedBundle && activeAcademicYear && (
        <AdminRegistrationDetailModal
          bundle={selectedBundle}
          academicYear={activeAcademicYear}
          adminUser={adminUser}
          onClose={() => setSelectedBundle(null)}
          onUpdated={handleRefreshSelectedAndList}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'slate',
  icon: Icon = Users,
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple';
  icon?: any;
}) {
  const bgIcon =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-700'
        : tone === 'red'
          ? 'bg-red-100 text-red-700'
          : tone === 'blue'
            ? 'bg-blue-100 text-blue-700'
            : tone === 'purple'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-emerald-50 text-emerald-900';

  const trendColor =
    tone === 'emerald'
      ? 'text-emerald-600'
      : tone === 'amber'
        ? 'text-amber-600'
        : tone === 'red'
          ? 'text-red-600'
          : tone === 'purple'
            ? 'text-purple-600'
            : tone === 'blue'
              ? 'text-blue-600'
              : 'text-emerald-600';

  const valueColor =
    tone === 'emerald'
      ? 'text-emerald-900'
      : tone === 'amber'
        ? 'text-amber-900'
        : tone === 'red'
          ? 'text-red-900'
          : tone === 'purple'
            ? 'text-purple-900'
            : tone === 'blue'
              ? 'text-blue-900'
              : 'text-slate-900';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgIcon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-3">
        <p className={`font-display text-2xl font-bold tabular-nums ${valueColor}`}>
          {value}
        </p>
        <TrendingUp className={`w-4 h-4 ${trendColor}`} />
      </div>
    </div>
  );
}

function statusTextColor(status: string): string {
  switch (status) {
    case 'Diterima':
      return 'text-emerald-700';
    case 'Ditolak':
    case 'Mengundurkan Diri':
      return 'text-red-700';
    case 'Perlu Perbaikan':
    case 'Menunggu Verifikasi':
    case 'Menunggu Pembayaran':
    case 'Menunggu Keputusan':
      return 'text-amber-700';
    default:
      return 'text-slate-700';
  }
}

function paymentTextColor(status: string): string {
  switch (status) {
    case 'Lunas':
      return 'text-emerald-700';
    case 'Ditolak':
      return 'text-red-700';
    case 'Menunggu Verifikasi':
    case 'Cicilan Tahap 1':
    case 'Cicilan Tahap 2':
    case 'Cicilan Tahap 3':
      return 'text-amber-700';
    default:
      return 'text-slate-600';
  }
}

function statusBadge(status: string) {
  let badgeClass = 'bg-slate-100 text-slate-800';
  if (status === 'Diterima' || status === 'Terdaftar') {
    badgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  } else if (status === 'Ditolak' || status === 'Mengundurkan Diri') {
    badgeClass = 'bg-red-50 text-red-800 border border-red-200';
  } else {
    badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{status}</span>
    </span>
  );
}

function paymentBadge(status: string) {
  let badgeClass = 'bg-slate-100 text-slate-800';
  if (status === 'Lunas') {
    badgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  } else if (status === 'Ditolak') {
    badgeClass = 'bg-red-50 text-red-800 border border-red-200';
  } else {
    badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{status}</span>
    </span>
  );
}
