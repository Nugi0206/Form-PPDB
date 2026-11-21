import { useState } from 'react';
import { SCHOOL_INFO } from '../types/ppdb';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const [imgError, setImgError] = useState(false);

  const dims =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
        ? 'w-14 h-14'
        : 'w-11 h-11';

  if (imgError) {
    return (
      <div
        className={`${dims} rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-display font-bold text-sm shrink-0 border border-emerald-700`}
        aria-label={SCHOOL_INFO.name}
      >
        RD
      </div>
    );
  }

  return (
    <img
      src="/src/assets/images/logo_ra_darusyifa.jpeg"
      alt={`Logo ${SCHOOL_INFO.name}`}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${dims} rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0`}
    />
  );
}
