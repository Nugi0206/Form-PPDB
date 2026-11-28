import { SCHOOL_INFO } from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface PublicHeaderProps {
  currentPath: string;
  academicYearLabel: string;
  onNavigate: (path: string) => void;
  isRegistrationOpen: boolean;
}

export function PublicHeader({
  currentPath,
  academicYearLabel,
  onNavigate,
  isRegistrationOpen,
}: PublicHeaderProps) {
  const isInForm = currentPath === '/daftar';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zona 1: Logo & Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left font-display text-sm sm:text-base font-bold tracking-tight text-emerald-900 hover:text-emerald-700 transition-colors shrink-0 cursor-pointer"
        >
          <BrandMark size="sm" />
          <span className="truncate max-w-[200px] sm:max-w-none">{SCHOOL_INFO.name}</span>
        </button>

        {/* Zona 2: Keterangan ringkas portal formulir */}
        <p className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium whitespace-nowrap">
          <span>Formulir PPDB Online</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="text-emerald-800 font-semibold tabular-nums">
            Tahun Pelajaran {academicYearLabel}
          </span>
        </p>

        {/* Zona 3: 1 Tombol Aksi Utama */}
        <div className="flex items-center shrink-0">
          {isInForm ? (
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sambutan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/daftar')}
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRegistrationOpen ? 'Isi Formulir' : 'Lihat Formulir'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
