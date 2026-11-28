import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AdminLoginGate } from './components/AdminLoginGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicHeader } from './components/PublicHeader';
import { PublicLandingPage } from './components/PublicLandingPage';
import { RegistrationFormWizard } from './components/RegistrationFormWizard';
import { RegistrationReceipt } from './components/RegistrationReceipt';
import { auth, googleProvider } from './lib/firebase';
import {
  DEFAULT_ACADEMIC_YEAR,
  getActiveAcademicYear,
  verifyAdminAccess,
} from './services/ppdbService';
import { AcademicYearConfig, AdminRole, RegistrationFullBundle } from './types/ppdb';
import { BlankRegularFormPrint } from './components/BlankRegularFormPrint';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

const RECEIPT_SESSION_KEY = 'ppdb_ra_darusyifa_last_receipt';

function normalizePath(pathname: string): string {
  if (pathname.startsWith('/ppdb-admin')) return '/ppdb-admin';
  if (pathname.startsWith('/daftar')) return '/daftar';
  return '/';
}

export default function App() {
  const [path, setPath] = useState<string>(() => normalizePath(window.location.pathname));
  const [academicYear, setAcademicYear] = useState<AcademicYearConfig>(DEFAULT_ACADEMIC_YEAR);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showBlankForm, setShowBlankForm] = useState(false);

  const [submittedReceipt, setSubmittedReceipt] = useState<RegistrationFullBundle | null>(() => {
    try {
      const saved = sessionStorage.getItem(RECEIPT_SESSION_KEY);
      return saved ? (JSON.parse(saved) as RegistrationFullBundle) : null;
    } catch {
      return null;
    }
  });

  // Auth & Admin state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminDeniedReason, setAdminDeniedReason] = useState<string | null>(null);

  const loadAcademicYear = useCallback(async () => {
    try {
      const active = await getActiveAcademicYear();
      setAcademicYear(active);
    } catch {
      setAcademicYear(DEFAULT_ACADEMIC_YEAR);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    void loadAcademicYear();
  }, [loadAcademicYear]);

  useEffect(() => {
    const handlePop = () => {
      setPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (!user) {
        setAdminRole(null);
        setAdminDeniedReason(null);
        return;
      }

      setCheckingRole(true);
      try {
        const res = await verifyAdminAccess(user);
        if (res.authorized && res.role) {
          setAdminRole(res.role);
          setAdminDeniedReason(null);
        } else {
          setAdminRole(null);
          setAdminDeniedReason(res.reason || 'Anda tidak memiliki hak akses admin.');
        }
      } catch (err) {
        setAdminRole(null);
        setAdminDeniedReason(
          err instanceof Error ? err.message : 'Gagal memverifikasi otorisasi admin.'
        );
      } finally {
        setCheckingRole(false);
      }
    });
    return () => unsub();
  }, []);

  const navigate = (nextPath: string, anchorId?: string) => {
    const normalized = normalizePath(nextPath);
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setPath(normalized);

    if (normalized === '/daftar') {
      setSubmittedReceipt(null);
      try {
        sessionStorage.removeItem(RECEIPT_SESSION_KEY);
      } catch {
        // Abaikan
      }
    }

    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoogleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAdminRole(null);
    setAdminDeniedReason(null);
  };

  const handleRegistrationSuccess = (bundle: RegistrationFullBundle) => {
    setSubmittedReceipt(bundle);
    try {
      sessionStorage.setItem(RECEIPT_SESSION_KEY, JSON.stringify(bundle));
    } catch {
      // Abaikan
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseReceipt = () => {
    setSubmittedReceipt(null);
    try {
      sessionStorage.removeItem(RECEIPT_SESSION_KEY);
    } catch {
      // Abaikan
    }
    navigate('/');
  };

  return (
    <ErrorBoundary>
      {path === '/ppdb-admin' ? (
        currentUser && adminRole ? (
          <Suspense
            fallback={
              <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
                Memuat Dashboard Admin PPDB...
              </div>
            }
          >
            <AdminDashboard
              adminUser={currentUser}
              adminRole={adminRole}
              onSignOut={handleSignOut}
              onOpenPublic={() => navigate('/')}
              onAcademicYearChanged={loadAcademicYear}
            />
          </Suspense>
        ) : (
          <AdminLoginGate
            user={currentUser}
            authLoading={authLoading}
            checkingRole={checkingRole}
            deniedReason={adminDeniedReason}
            onGoogleLogin={handleGoogleLogin}
            onSignOut={handleSignOut}
            onBackPublic={() => navigate('/')}
          />
        )
      ) : (
        <div className="min-h-screen flex flex-col bg-white">
          <PublicHeader
            currentPath={path}
            academicYearLabel={academicYear.yearLabel}
            onNavigate={navigate}
            isRegistrationOpen={academicYear.isOpen}
          />

          {loadingConfig ? (
            <div className="flex-1 flex items-center justify-center py-20 text-sm text-slate-500">
              Memuat formulir PPDB RA Darusyifa Arjawinangun...
            </div>
          ) : path === '/daftar' ? (
            submittedReceipt ? (
              <RegistrationReceipt
                bundle={submittedReceipt}
                academicYear={academicYear}
                onBackHome={handleCloseReceipt}
              />
            ) : (
              <RegistrationFormWizard
                academicYear={academicYear}
                onCancel={() => navigate('/')}
                onSuccess={handleRegistrationSuccess}
              />
            )
          ) : (
            <PublicLandingPage
              academicYear={academicYear}
              onStartRegistration={() => navigate('/daftar')}
              onOpenBlankForm={() => setShowBlankForm(true)}
            />
          )}
        </div>
      )}

      {showBlankForm && (
        <BlankRegularFormPrint
          academicYear={academicYear}
          onClose={() => setShowBlankForm(false)}
        />
      )}
    </ErrorBoundary>
  );
}

