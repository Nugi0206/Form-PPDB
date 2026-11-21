import { AlertCircle, CheckCircle2, Globe, Home, Printer } from 'lucide-react';
import { formatIndonesianDate, formatRupiah } from '../lib/utils';
import {
  AcademicYearConfig,
  NON_REGULAR_PRINTED_FORM_NOTE,
  RegistrationFullBundle,
  SCHOOL_INFO,
} from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface RegistrationReceiptProps {
  bundle: RegistrationFullBundle;
  academicYear: AcademicYearConfig;
  onBackHome: () => void;
}

export function RegistrationReceipt({
  bundle,
  academicYear,
  onBackHome,
}: RegistrationReceiptProps) {
  const { registration, parents, documents, payments } = bundle;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Notifikasi Sukses (disembunyikan saat print) */}
        <div className="no-print mb-6 bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">
                Pendaftaran Berhasil Dikirim!
              </h1>
              <p className="text-sm text-emerald-100 mt-1">
                Data calon peserta didik atas nama <strong>{registration.fullName}</strong> telah tersimpan dengan nomor pendaftaran resmi:
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-300 tabular-nums">
                {registration.registrationNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti Pendaftaran</span>
            </button>
            <a
              href={SCHOOL_INFO.websiteUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Kembali ke Website Utama</span>
            </a>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-medium text-emerald-100 hover:text-white transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Awal Formulir</span>
            </button>
          </div>
        </div>

        {/* Lembar Bukti Pendaftaran Siap Cetak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 print:border-none print:p-0">
          {/* Kop Sekolah */}
          <div className="flex items-center justify-between gap-4 pb-5 border-b-2 border-emerald-900">
            <div className="flex items-center gap-4">
              <BrandMark size="lg" />
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Panitia Penerimaan Peserta Didik Baru (PPDB)
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {SCHOOL_INFO.name}
                </h2>
                <p className="text-xs text-slate-600">
                  {SCHOOL_INFO.tagline} · Tahun Pelajaran {registration.academicYearLabel}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{academicYear.schoolAddress}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">Nomor Pendaftaran</p>
              <p className="font-mono text-lg font-bold text-emerald-900 tabular-nums">
                {registration.registrationNumber}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatIndonesianDate(registration.createdAt, true)}
              </p>
            </div>
          </div>

          <div className="my-6 text-center">
            <h3 className="font-display text-lg font-bold text-slate-900 underline underline-offset-4">
              BUKTI PENDAFTARAN PESERTA DIDIK BARU
            </h3>
          </div>

          {/* Ringkasan Identitas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
            <Row label="Nama Lengkap Anak" value={registration.fullName} />
            <Row label="Nama Panggilan" value={registration.nickname} />
            <Row label="Jenis Kelamin" value={registration.gender} />
            <Row
              label="Tempat, Tanggal Lahir"
              value={`${registration.birthPlace}, ${formatIndonesianDate(registration.birthDate)}`}
            />
            <Row
              label="Usia Saat Mendaftar"
              value={`${registration.ageYears} tahun ${registration.ageMonths} bulan`}
            />
            <Row label="NIK Anak" value={registration.nik} mono />
            <Row label="Program Pendidikan" value={registration.program} />
            <Row label="Lama Pendidikan" value={registration.educationDuration} />
            <Row label="Nama Ayah" value={parents.fatherName} />
            <Row label="Nama Ibu" value={parents.motherName} />
            <Row label="Nomor WhatsApp Utama" value={registration.primaryWhatsapp} mono />
            <Row label="Status Pendaftaran" value={registration.registrationStatus} />
          </div>

          {/* Rincian Dokumen & Pembayaran */}
          <div className="border-t border-slate-200 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
            <div>
              <h4 className="font-display font-bold text-slate-900 mb-2">
                Kelengkapan Berkas Terunggah
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                <li>Kartu Keluarga: {documents.kkName || 'Belum diunggah'}</li>
                <li>Akta Kelahiran: {documents.birthCertName || 'Belum diunggah'}</li>
                <li>KTP Ayah: {documents.fatherKtpName || 'Tidak dilampirkan'}</li>
                <li>KTP Ibu: {documents.motherKtpName || 'Tidak dilampirkan'}</li>
                <li>Foto Anak: {documents.childPhotoName || 'Tidak dilampirkan'}</li>
                {documents.orphanCertName && (
                  <li>Surat Yatim/Piatu: {documents.orphanCertName}</li>
                )}
                {documents.tahfidzCertName && (
                  <li>Sertifikat Tahfidz: {documents.tahfidzCertName}</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-slate-900 mb-2">
                Informasi Pembayaran
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                <li>Rencana Pembayaran: {payments.paymentPlan}</li>
                <li>Metode: {payments.paymentMethod}</li>
                <li>Nominal Tercatat: {formatRupiah(payments.paymentAmount)}</li>
                <li>
                  Status Pembayaran: <strong>{payments.paymentStatus}</strong>
                </li>
                <li>
                  Rekening Sekolah: {SCHOOL_INFO.bankName} {SCHOOL_INFO.bankAccountNumber} a.n.{' '}
                  {SCHOOL_INFO.bankAccountHolder}
                </li>
              </ul>
            </div>
          </div>

          {registration.program !== 'Reguler' && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Wajib ({registration.program}):</strong>{' '}
                {NON_REGULAR_PRINTED_FORM_NOTE} Silakan cetak (print) bukti pendaftaran ini dan lampirkan saat penyerahan berkas ke panitia {SCHOOL_INFO.name}.
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong>Catatan Penting:</strong> Simpan dan cetak bukti pendaftaran ini sebagai arsip orang tua. Seluruh berkas dan pembayaran akan diverifikasi oleh Panitia dan Bendahara {SCHOOL_INFO.name}. Informasi hasil verifikasi akan disampaikan melalui nomor WhatsApp orang tua/wali yang terdaftar.
          </div>

          <div className="mt-8 flex justify-between text-xs text-slate-600 pt-4">
            <div>
              <p>Kontak Panitia: {academicYear.schoolPhone}</p>
              <p>Email: {academicYear.schoolEmail}</p>
            </div>
            <div className="text-right">
              <p>Arjawinangun, {formatIndonesianDate(registration.createdAt)}</p>
              <p className="mt-10 font-semibold text-slate-900">Panitia PPDB {SCHOOL_INFO.shortName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col border-b border-slate-100 pb-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-semibold text-slate-900 mt-0.5 ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}
