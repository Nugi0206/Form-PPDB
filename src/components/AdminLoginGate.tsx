import { User } from 'firebase/auth';
import { ArrowLeft, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { SCHOOL_INFO } from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface AdminLoginGateProps {
  user: User | null;
  authLoading: boolean;
  checkingRole: boolean;
  deniedReason?: string | null;
  onGoogleLogin: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onBackPublic: () => void;
}

export function AdminLoginGate({
  user,
  authLoading,
  checkingRole,
  deniedReason,
  onGoogleLogin,
  onSignOut,
  onBackPublic,
}: AdminLoginGateProps) {
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    setLoggingIn(true);
    try {
      await onGoogleLogin();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Gagal masuk dengan Google.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8">
        <div className="flex items-center gap-3.5 mb-6">
          <BrandMark size="md" />
          <div>
            <p className="text-xs font-semibold text-emerald-800">Portal Panitia PPDB</p>
            <h1 className="font-display text-xl font-bold text-slate-900">
              {SCHOOL_INFO.name}
            </h1>
          </div>
        </div>

        {authLoading || checkingRole ? (
          <div className="py-10 text-center text-sm text-slate-600">
            Memeriksa otorisasi akun admin...
          </div>
        ) : user && deniedReason ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Akses Admin Ditolak</p>
                <p className="mt-1 text-xs leading-relaxed">{deniedReason}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                Email aktif: <strong className="text-slate-900">{user.email}</strong>
              </p>
              <p className="font-mono break-all">UID: {user.uid}</p>
              <p className="pt-1 text-slate-500">
                Hubungi administrator utama untuk mengaktifkan email Google Anda pada menu Kelola Admin.
              </p>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar & Ganti Akun</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              Masuk menggunakan akun Google panitia atau bendahara yang telah diberi otorisasi resmi oleh sekolah.
            </p>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {loginError}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loggingIn ? 'Membuka Google Sign-In...' : 'Masuk dengan Google'}</span>
            </button>

            <p className="text-xs text-slate-500 text-center">
              Pendaftaran admin publik dinonaktifkan demi keamanan data siswa dan orang tua.
            </p>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={onBackPublic}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Publik PPDB</span>
          </button>
        </div>
      </div>
    </div>
  );
}
