import logoUrl from '../assets/images/logo_ra_darusyifa.jpeg';
import { SCHOOL_INFO } from '../types/ppdb';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const dims =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
        ? 'w-14 h-14'
        : 'w-11 h-11';

  return (
    <img
      src={logoUrl}
      alt={`Logo ${SCHOOL_INFO.name}`}
      referrerPolicy="no-referrer"
      className={`${dims} rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0`}
    />
  );
}
