import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Gift,
  Heart,
  Mail,
  MapPin,
  Phone,
  Smile,
  Sparkles,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import {
  AcademicYearConfig,
  NON_REGULAR_PRINTED_FORM_NOTE,
  PROGRAMS,
  SCHOOL_INFO,
} from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface PublicLandingPageProps {
  academicYear: AcademicYearConfig;
  onStartRegistration: () => void;
}

export function PublicLandingPage({
  academicYear,
  onStartRegistration,
}: PublicLandingPageProps) {
  const [heroImgError, setHeroImgError] = useState(false);

  return (
    <main className="flex-1 flex flex-col justify-between bg-white text-slate-900">
      {/* Sambutan Ceria & Motivasi Pendaftaran */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Kolom Sambutan & Ucapan Terima Kasih */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-4 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Penerimaan Peserta Didik Baru • TP {academicYear.yearLabel}</span>
              </div>

              <p className="text-emerald-800 font-semibold text-base sm:text-lg mb-2">
                Assalamu’alaikum Warahmatullahi Wabarakatuh 🙏
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 leading-[1.15] mb-4"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3.2rem)', textWrap: 'balance' }}
              >
                Ayah & Bunda, Mari Wujudkan Generasi Qur’ani yang Ceria & Berakhlak Mulia! 🌟
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                Terima kasih yang sebesar-besarnya kami ucapkan kepada Ayah & Bunda atas kepercayaan dan kecintaannya telah mempercayakan pendidikan putra-putri tercinta di{' '}
                <strong className="text-emerald-900">{SCHOOL_INFO.name}</strong>. Bersama-sama, kita bina keceriaan, hafalan Al-Qur’an, dan kemandirian sejak dini! 🎈
              </p>

              {/* Badge Keunggulan Ceria */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Belajar Ceria</p>
                    <p className="text-[11px] text-slate-500">Metode menyenangkan</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Akhlak Mulia</p>
                    <p className="text-[11px] text-slate-500">Pembiasaan Islami</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Terakreditasi B</p>
                    <p className="text-[11px] text-slate-500">Kualitas teruji</p>
                  </div>
                </div>
              </div>

              {/* Tombol Mulai Isi Formulir */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="button"
                  onClick={onStartRegistration}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>
                    {academicYear.isOpen
                      ? 'Mulai Isi Formulir Pendaftaran 📝'
                      : 'Lihat Formulir Pendaftaran'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Tanpa Perlu Buat Akun</p>
                  <p>Proses pengisian 8 bagian sangat mudah & dapat disimpan.</p>
                </div>
              </div>

              {!academicYear.isOpen && (
                <p className="mt-4 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  Status PPDB Tahun Pelajaran {academicYear.yearLabel} saat ini sedang ditutup oleh panitia.
                </p>
              )}
            </div>

            {/* Kolom Foto Kegiatan */}
            <div className="lg:col-span-5">
              <div className="h-full min-h-[300px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-emerald-900">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_hari_santri.jpg"
                    alt={`Kegiatan ceria peserta didik ${SCHOOL_INFO.name}`}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white bg-gradient-to-br from-emerald-800 to-emerald-950">
                    <BrandMark size="lg" />
                    <p className="mt-4 font-display text-xl font-bold">{SCHOOL_INFO.name}</p>
                    <p className="text-sm text-emerald-100 mt-1">{SCHOOL_INFO.tagline}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Informasi Pilihan Program & Berkas yang Perlu Dibawa ke Sekolah */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Pilihan Program & Persyaratan Berkas 🎒
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Pilih jalur program terbaik untuk putra-putri Anda dan siapkan dokumen yang perlu dibawa saat verifikasi ke sekolah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {PROGRAMS.map((prog, idx) => (
              <div
                key={prog.id}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-emerald-800 px-2.5 py-1 rounded-md bg-emerald-100">
                      Jalur 0{idx + 1}
                    </span>
                    {idx === 0 ? (
                      <BookOpen className="w-5 h-5 text-emerald-700" />
                    ) : idx === 3 ? (
                      <Gift className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Award className="w-5 h-5 text-emerald-700" />
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{prog.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {prog.description}
                  </p>
                </div>
                {prog.docHint && (
                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-medium text-amber-800">
                    💡 {prog.docHint}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Kotak Persiapan Berkas & Dokumen yang Dibawa ke Sekolah */}
          <div className="p-6 sm:p-8 rounded-2xl bg-emerald-900 text-white shadow-lg space-y-5">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-300 shrink-0" />
              <h3 className="font-display text-xl font-bold">
                Berkas yang Diunggah Online & Dibawa ke Sekolah 📁
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-emerald-100">
              <div className="space-y-3 bg-emerald-950/50 p-4 rounded-xl border border-emerald-800">
                <p className="font-bold text-amber-300">1. Unggah Saat Mendaftar Online:</p>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>Kartu Keluarga (KK) & Akta Kelahiran Anak (Wajib).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>KTP Ayah & Ibu serta Pas Foto anak (Jika tersedia).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>Surat Keterangan Yatim / Sertifikat Tahfidz (Khusus Jalur Beasiswa).</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 bg-emerald-950/50 p-4 rounded-xl border border-emerald-800">
                <p className="font-bold text-amber-300">2. Dibawa Saat Verifikasi ke Sekolah:</p>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>Cetak (Print) bukti pendaftaran online yang diterbitkan setelah mengisi formulir.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>Fotokopi KK & Akta Kelahiran (untuk arsip fisik panitia).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <strong className="text-amber-200">
                      Khusus Program Selain Reguler (Program Alumni, Beasiswa Yatim/Piatu/Tahfidz): Wajib membawa dokumen formulir pendaftaran yang sudah di-print ke sekolah.
                    </strong>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-400 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
              <span>🔔 Rekening Resmi BRI:</span>
              <span className="font-mono tabular-nums">{SCHOOL_INFO.bankAccountNumber}</span>
              <span>a.n. {SCHOOL_INFO.bankAccountHolder}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Bantuan Panitia Ringkas */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <div>
                <p className="font-display font-bold text-slate-900">{SCHOOL_INFO.name}</p>
                <p className="text-xs text-slate-500">
                  Terima kasih atas kepercayaan Ayah & Bunda · Tahun Pelajaran {academicYear.yearLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-6">
              <a
                href={
                  academicYear.schoolWhatsapp
                    ? `https://wa.me/${academicYear.schoolWhatsapp.replace(/[^0-9]/g, '')}`
                    : `tel:${academicYear.schoolPhone}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-700 hover:text-emerald-800 font-medium"
              >
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="tabular-nums">WA Panitia: {academicYear.schoolPhone}</span>
              </a>

              <a
                href={`mailto:${academicYear.schoolEmail}`}
                className="inline-flex items-center gap-2 text-slate-700 hover:text-emerald-800"
              >
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{academicYear.schoolEmail}</span>
              </a>

              <span className="inline-flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{academicYear.schoolAddress}</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
