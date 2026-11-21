import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileCheck,
  History,
  Loader2,
  Printer,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  clampStr,
  formatIndonesianDate,
  formatRupiah,
  parseReadableFirestoreError,
  sanitizeDigits,
} from '../lib/utils';
import {
  addAdminNoteOnly,
  deleteRegistrationBundle,
  saveDataCorrectionByAdmin,
  updateRegistrationStatus,
  verifyDocumentsByAdmin,
  verifyPaymentByAdmin,
} from '../services/ppdbService';
import {
  AcademicYearConfig,
  DOCUMENT_STATUSES,
  DocumentVerificationStatus,
  EducationDuration,
  EducationProgram,
  FIELD_LIMITS,
  Gender,
  PAYMENT_STATUSES,
  PaymentStatus,
  PROGRAMS,
  REGISTRATION_STATUSES,
  RegistrationFullBundle,
  RegistrationStatus,
  SCHOOL_INFO,
} from '../types/ppdb';
import { AdminPrintDocuments } from './AdminPrintDocuments';

interface AdminRegistrationDetailModalProps {
  bundle: RegistrationFullBundle;
  academicYear: AcademicYearConfig;
  adminUser: User;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

type DetailTab = 'identitas' | 'kesehatan' | 'dokumen' | 'pembayaran' | 'status';

export function AdminRegistrationDetailModal({
  bundle,
  academicYear,
  adminUser,
  onClose,
  onUpdated,
}: AdminRegistrationDetailModalProps) {
  const { registration, parents, guardians, health, documents, payments, consents, verifications } =
    bundle;

  const [activeTab, setActiveTab] = useState<DetailTab>('identitas');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [printMode, setPrintMode] = useState<'form' | 'acceptance' | null>(null);

  // State Status Pendaftaran & Catatan
  const [regStatus, setRegStatus] = useState<RegistrationStatus>(registration.registrationStatus);
  const [verificationNote, setVerificationNote] = useState(registration.verificationNote || '');

  // State Verifikasi Pembayaran (berdiri sendiri)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    payments?.paymentStatus || registration.paymentStatusSummary
  );
  const [paymentAmount, setPaymentAmount] = useState(String(payments?.paymentAmount ?? 0));
  const [paymentDate, setPaymentDate] = useState(payments?.paymentDate || '');
  const [treasurerNote, setTreasurerNote] = useState(payments?.treasurerNote || '');

  // State Verifikasi Dokumen
  const [kkStatus, setKkStatus] = useState<DocumentVerificationStatus>(
    documents?.kkStatus || 'Belum Diunggah'
  );
  const [birthCertStatus, setBirthCertStatus] = useState<DocumentVerificationStatus>(
    documents?.birthCertStatus || 'Belum Diunggah'
  );
  const [fatherKtpStatus, setFatherKtpStatus] = useState<DocumentVerificationStatus>(
    documents?.fatherKtpStatus || 'Belum Diunggah'
  );
  const [motherKtpStatus, setMotherKtpStatus] = useState<DocumentVerificationStatus>(
    documents?.motherKtpStatus || 'Belum Diunggah'
  );
  const [childPhotoStatus, setChildPhotoStatus] = useState<DocumentVerificationStatus>(
    documents?.childPhotoStatus || 'Belum Diunggah'
  );
  const [orphanCertStatus, setOrphanCertStatus] = useState<DocumentVerificationStatus>(
    documents?.orphanCertStatus || 'Belum Diunggah'
  );
  const [tahfidzCertStatus, setTahfidzCertStatus] = useState<DocumentVerificationStatus>(
    documents?.tahfidzCertStatus || 'Belum Diunggah'
  );
  const [documentNote, setDocumentNote] = useState(documents?.documentNote || '');

  // State Perbaikan Data Tercatat
  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState(registration.fullName);
  const [editNickname, setEditNickname] = useState(registration.nickname);
  const [editGender, setEditGender] = useState<Gender>(registration.gender);
  const [editNik, setEditNik] = useState(registration.nik);
  const [editBirthPlace, setEditBirthPlace] = useState(registration.birthPlace);
  const [editBirthDate, setEditBirthDate] = useState(registration.birthDate);
  const [editAddress, setEditAddress] = useState(registration.address);
  const [editDuration, setEditDuration] = useState<EducationDuration>(
    registration.educationDuration
  );
  const [editProgram, setEditProgram] = useState<EducationProgram>(registration.program);
  const [editFatherName, setEditFatherName] = useState(parents?.fatherName || '');
  const [editMotherName, setEditMotherName] = useState(parents?.motherName || '');
  const [editPrimaryWhatsapp, setEditPrimaryWhatsapp] = useState(registration.primaryWhatsapp);
  const [correctionReason, setCorrectionReason] = useState('');

  const handlePrint = (mode: 'form' | 'acceptance') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateRegistrationStatus(registration, regStatus, verificationNote, adminUser);
      await onUpdated();
      setFeedback({ type: 'success', text: 'Status pendaftaran dan catatan berhasil diperbarui.' });
    } catch (err) {
      setFeedback({ type: 'error', text: parseReadableFirestoreError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNoteOnly = async () => {
    if (!verificationNote.trim()) {
      setFeedback({ type: 'error', text: 'Tuliskan catatan terlebih dahulu.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await addAdminNoteOnly(registration, verificationNote, adminUser);
      await onUpdated();
      setFeedback({ type: 'success', text: 'Catatan verifikasi berhasil ditambahkan.' });
    } catch (err) {
      setFeedback({ type: 'error', text: parseReadableFirestoreError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await verifyPaymentByAdmin(
        registration,
        payments,
        {
          paymentStatus,
          paymentAmount: Number(paymentAmount) || 0,
          paymentDate,
          treasurerNote,
        },
        adminUser
      );
      await onUpdated();
      setFeedback({
        type: 'success',
        text: 'Verifikasi pembayaran berhasil disimpan. Status penerimaan tetap berdiri sendiri.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: parseReadableFirestoreError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocuments = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await verifyDocumentsByAdmin(
        registration,
        {
          kkStatus,
          birthCertStatus,
          fatherKtpStatus,
          motherKtpStatus,
          childPhotoStatus,
          orphanCertStatus,
          tahfidzCertStatus,
        },
        documentNote,
        adminUser
      );
      await onUpdated();
      setFeedback({ type: 'success', text: 'Status verifikasi dokumen berhasil diperbarui.' });
    } catch (err) {
      setFeedback({ type: 'error', text: parseReadableFirestoreError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (correctionReason.trim().length < 5) {
      setFeedback({
        type: 'error',
        text: 'Alasan perbaikan data wajib diisi (minimal 5 karakter) agar tercatat di log audit.',
      });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await saveDataCorrectionByAdmin(
        bundle,
        {
          fullName: clampStr(editFullName, FIELD_LIMITS.fullName),
          nickname: clampStr(editNickname, FIELD_LIMITS.nickname),
          gender: editGender,
          nik: sanitizeDigits(editNik, 16),
          birthPlace: clampStr(editBirthPlace, FIELD_LIMITS.birthPlace),
          birthDate: editBirthDate,
          address: clampStr(editAddress, FIELD_LIMITS.address),
          educationDuration: editDuration,
          program: editProgram,
          primaryWhatsapp: clampStr(editPrimaryWhatsapp, FIELD_LIMITS.phone),
        },
        {
          fatherName: clampStr(editFatherName, FIELD_LIMITS.parentName),
          motherName: clampStr(editMotherName, FIELD_LIMITS.parentName),
        },
        correctionReason.trim(),
        adminUser
      );
      setEditMode(false);
      setCorrectionReason('');
      await onUpdated();
      setFeedback({ type: 'success', text: 'Perbaikan data berhasil disimpan dan tercatat di riwayat.' });
    } catch (err) {
      setFeedback({ type: 'error', text: parseReadableFirestoreError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (printMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="no-print sticky top-0 z-10 bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            Pratinjau Cetak:{' '}
            {printMode === 'acceptance'
              ? 'Bukti Penerimaan Peserta Didik Baru'
              : 'Formulir Pendaftaran Lengkap'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode(null)}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
        <AdminPrintDocuments bundle={bundle} academicYear={academicYear} mode={printMode} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-bold text-emerald-900 tabular-nums">
                {registration.registrationNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>TP {registration.academicYearLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Daftar {formatIndonesianDate(registration.createdAt, true)}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">
              {registration.fullName} ({registration.nickname})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint('form')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Formulir</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrint('acceptance')}
              disabled={registration.registrationStatus !== 'Diterima'}
              title={
                registration.registrationStatus !== 'Diterima'
                  ? 'Tersedia setelah status pendaftaran diubah menjadi Diterima'
                  : 'Cetak surat bukti penerimaan'
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Bukti Penerimaan</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Hapus permanen pendaftaran ${registration.fullName} (${registration.registrationNumber})?`)) return;
                try {
                  await deleteRegistrationBundle(registration.registrationId);
                  onClose();
                  await onUpdated();
                } catch (err) {
                  setFeedback({ type: 'error', text: parseReadableFirestoreError(err) });
                }
              }}
              title="Hapus pendaftaran"
              className="p-2 text-red-600 hover:text-white hover:bg-red-700 rounded-lg cursor-pointer transition-colors"
              aria-label="Hapus pendaftaran"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Tutup detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-1 overflow-x-auto bg-white">
          {[
            { id: 'identitas' as const, label: 'Identitas & Keluarga' },
            { id: 'kesehatan' as const, label: 'Kesehatan & Perkembangan' },
            { id: 'dokumen' as const, label: 'Dokumen Persyaratan' },
            { id: 'pembayaran' as const, label: 'Pembayaran' },
            { id: 'status' as const, label: 'Status & Riwayat' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: IDENTITAS & KELUARGA */}
          {activeTab === 'identitas' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Identitas Anak, Orang Tua, Wali & Informasi Tambahan
                </h3>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{editMode ? 'Batal Perbaikan' : 'Perbaiki Data'}</span>
                </button>
              </div>

              {editMode ? (
                <div className="p-5 rounded-xl border border-amber-300 bg-amber-50/40 space-y-4">
                  <p className="text-xs font-semibold text-amber-900">
                    Mode Perbaikan Data (Tercatat pada Log Audit Verifikasi)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <EditInput label="Nama Lengkap Anak" value={editFullName} onChange={setEditFullName} />
                    <EditInput label="Nama Panggilan" value={editNickname} onChange={setEditNickname} />
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as Gender)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <EditInput
                      label="NIK Anak (16 Digit)"
                      value={editNik}
                      onChange={(v) => setEditNik(sanitizeDigits(v, 16))}
                    />
                    <EditInput label="Tempat Lahir" value={editBirthPlace} onChange={setEditBirthPlace} />
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={editBirthDate}
                        onChange={(e) => setEditBirthDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Program Pendidikan
                      </label>
                      <select
                        value={editProgram}
                        onChange={(e) => setEditProgram(e.target.value as EducationProgram)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        {PROGRAMS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Lama Pendidikan
                      </label>
                      <select
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value as EducationDuration)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="1 tahun">1 tahun</option>
                        <option value="2 tahun">2 tahun</option>
                      </select>
                    </div>
                    <EditInput label="Nama Ayah" value={editFatherName} onChange={setEditFatherName} />
                    <EditInput label="Nama Ibu" value={editMotherName} onChange={setEditMotherName} />
                    <EditInput
                      label="WhatsApp Utama"
                      value={editPrimaryWhatsapp}
                      onChange={setEditPrimaryWhatsapp}
                    />
                    <EditInput label="Alamat Lengkap" value={editAddress} onChange={setEditAddress} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Alasan Perbaikan Data (Wajib) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="Contoh: Koreksi ejaan nama anak sesuai Akta Kelahiran"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveCorrection}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg cursor-pointer"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Simpan Perbaikan Tercatat</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InfoCard title="Bagian 1 — Identitas Calon Peserta Didik">
                    <InfoRow label="Nama Lengkap" value={registration.fullName} />
                    <InfoRow label="Nama Panggilan" value={registration.nickname} />
                    <InfoRow label="Jenis Kelamin" value={registration.gender} />
                    <InfoRow label="NIK Anak" value={registration.nik} mono />
                    <InfoRow label="Nomor KK" value={registration.kkNumber} mono />
                    <InfoRow
                      label="Tempat, Tgl Lahir"
                      value={`${registration.birthPlace}, ${formatIndonesianDate(registration.birthDate)}`}
                    />
                    <InfoRow
                      label="Usia Anak"
                      value={`${registration.ageYears} tahun ${registration.ageMonths} bulan`}
                    />
                    <InfoRow
                      label="Agama / Anak Ke"
                      value={`${registration.religion} / Anak ke-${registration.childOrder}`}
                    />
                    <InfoRow
                      label="Tinggi / Berat"
                      value={`${registration.heightCm} cm / ${registration.weightKg} kg`}
                    />
                    <InfoRow
                      label="Alamat"
                      value={`${registration.address}, Ds. ${registration.village}, Kec. ${registration.district}, ${registration.city}, ${registration.province}`}
                    />
                    <InfoRow label="Asal Sekolah" value={registration.previousSchool || '-'} />
                    <InfoRow label="Lama Pendidikan" value={registration.educationDuration} />
                  </InfoCard>

                  <div className="space-y-6">
                    <InfoCard title="Bagian 2 — Data Ayah dan Ibu">
                      <InfoRow
                        label="Ayah"
                        value={`${parents?.fatherName || '-'} (${parents?.fatherStatus || '-'})`}
                      />
                      <InfoRow label="NIK Ayah" value={parents?.fatherNik || '-'} mono />
                      <InfoRow label="TTL Ayah" value={parents?.fatherBirthPlaceDate || '-'} />
                      <InfoRow
                        label="Pendidikan / Pekerjaan"
                        value={`${parents?.fatherEducation || '-'} / ${parents?.fatherOccupation || '-'}`}
                      />
                      <InfoRow label="WhatsApp Ayah" value={parents?.fatherWhatsapp || '-'} mono />
                      <div className="my-2 border-t border-slate-200" />
                      <InfoRow
                        label="Ibu"
                        value={`${parents?.motherName || '-'} (${parents?.motherStatus || '-'})`}
                      />
                      <InfoRow label="NIK Ibu" value={parents?.motherNik || '-'} mono />
                      <InfoRow label="TTL Ibu" value={parents?.motherBirthPlaceDate || '-'} />
                      <InfoRow
                        label="Pendidikan / Pekerjaan"
                        value={`${parents?.motherEducation || '-'} / ${parents?.motherOccupation || '-'}`}
                      />
                      <InfoRow label="WhatsApp Ibu" value={parents?.motherWhatsapp || '-'} mono />
                    </InfoCard>

                    <InfoCard title="Bagian 3 — Data Wali & Kontak Darurat">
                      <InfoRow label="Tinggal Bersama" value={guardians?.livesWith || '-'} />
                      <InfoRow
                        label="Wali"
                        value={`${guardians?.guardianName || '-'} (${guardians?.guardianRelation || '-'})`}
                      />
                      <InfoRow label="WA Wali" value={guardians?.guardianWhatsapp || '-'} mono />
                      <InfoRow label="Alamat Wali" value={guardians?.guardianAddress || '-'} />
                      <InfoRow
                        label="Kontak Darurat"
                        value={`${guardians?.emergencyContactName || '-'} · ${guardians?.emergencyContactPhone || '-'}`}
                      />
                    </InfoCard>
                  </div>

                  <InfoCard title="Bagian 6 & 7 — Program Beasiswa & Informasi Tambahan">
                    <InfoRow label="Program Pendidikan" value={registration.program} />
                    {registration.program.toLowerCase().includes('beasiswa') && (
                      <>
                        <InfoRow
                          label="Alasan Beasiswa"
                          value={registration.scholarshipReason || '-'}
                        />
                        <InfoRow
                          label="Persetujuan Verifikasi"
                          value={
                            registration.scholarshipVerificationAgreed ? 'Disetujui' : 'Belum'
                          }
                        />
                      </>
                    )}
                    <InfoRow label="Sumber Info" value={registration.referralSource || '-'} />
                    <InfoRow
                      label="Alasan Memilih RA"
                      value={registration.reasonChoosingSchool || '-'}
                    />
                    <InfoRow label="Minat Anak" value={registration.childInterests || '-'} />
                    <InfoRow
                      label="Harapan Orang Tua"
                      value={registration.parentExpectations || '-'}
                    />
                  </InfoCard>

                  <InfoCard title="Bagian 8 — Pernyataan & Izin Dokumentasi">
                    <InfoRow
                      label="5 Pernyataan Wajib"
                      value={consents?.dataTruthAgreed ? 'Seluruhnya Disetujui' : 'Belum Lengkap'}
                    />
                    <InfoRow
                      label="Dokumentasi Internal"
                      value={consents?.internalDocumentationAgreed ? 'Mengizinkan' : 'Tidak'}
                    />
                    <InfoRow
                      label="Publikasi Media Resmi"
                      value={consents?.publicMediaAgreed ? 'Mengizinkan' : 'Tidak'}
                    />
                  </InfoCard>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KESEHATAN */}
          {activeTab === 'kesehatan' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InfoCard title="Riwayat Kesehatan Anak">
                <InfoRow
                  label="Riwayat Penyakit"
                  value={
                    health?.hasDiseaseHistory
                      ? `Ya — ${health.diseaseHistoryDetail || '-'}`
                      : 'Tidak ada'
                  }
                />
                <InfoRow
                  label="Alergi"
                  value={health?.hasAllergy ? `Ya — ${health.allergyDetail || '-'}` : 'Tidak ada'}
                />
                <InfoRow
                  label="Obat Rutin"
                  value={
                    health?.takesRoutineMedication
                      ? `Ya — ${health.routineMedicationDetail || '-'}`
                      : 'Tidak ada'
                  }
                />
                <InfoRow
                  label="Kondisi Khusus"
                  value={
                    health?.hasSpecialHealthCondition
                      ? `Ya — ${health.specialHealthConditionDetail || '-'}`
                      : 'Tidak ada'
                  }
                />
                <InfoRow
                  label="Kebutuhan Khusus"
                  value={
                    health?.hasSpecialNeeds
                      ? `Ya — ${health.specialNeedsDetail || '-'}`
                      : 'Tidak ada'
                  }
                />
              </InfoCard>

              <InfoCard title="Perkembangan & Kemandirian">
                <InfoRow label="Komunikasi" value={health?.communicationAbility || '-'} />
                <InfoRow label="Makan Sendiri" value={health?.eatingIndependence || '-'} />
                <InfoRow label="Toilet Training" value={health?.toiletIndependence || '-'} />
                <InfoRow label="Sosialisasi" value={health?.socializationAbility || '-'} />
                <InfoRow
                  label="Catatan Karakter"
                  value={health?.characterAndDevelopmentNote || '-'}
                />
              </InfoCard>
            </div>
          )}

          {/* TAB 3: DOKUMEN PERSYARATAN */}
          {activeTab === 'dokumen' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Kartu Keluarga (KK)',
                    url: documents?.kkUrl,
                    name: documents?.kkName,
                    status: kkStatus,
                    setStatus: setKkStatus,
                  },
                  {
                    title: 'Akta Kelahiran',
                    url: documents?.birthCertUrl,
                    name: documents?.birthCertName,
                    status: birthCertStatus,
                    setStatus: setBirthCertStatus,
                  },
                  {
                    title: 'KTP Ayah',
                    url: documents?.fatherKtpUrl,
                    name: documents?.fatherKtpName,
                    status: fatherKtpStatus,
                    setStatus: setFatherKtpStatus,
                  },
                  {
                    title: 'KTP Ibu',
                    url: documents?.motherKtpUrl,
                    name: documents?.motherKtpName,
                    status: motherKtpStatus,
                    setStatus: setMotherKtpStatus,
                  },
                  {
                    title: 'Foto Calon Peserta Didik',
                    url: documents?.childPhotoUrl,
                    name: documents?.childPhotoName,
                    status: childPhotoStatus,
                    setStatus: setChildPhotoStatus,
                  },
                  {
                    title: 'Surat Keterangan Yatim/Piatu',
                    url: documents?.orphanCertUrl,
                    name: documents?.orphanCertName,
                    status: orphanCertStatus,
                    setStatus: setOrphanCertStatus,
                  },
                  {
                    title: "Sertifikat Tahfidz Al-Qur'an",
                    url: documents?.tahfidzCertUrl,
                    name: documents?.tahfidzCertName,
                    status: tahfidzCertStatus,
                    setStatus: setTahfidzCertStatus,
                  },
                ].map((docItem) => (
                  <div
                    key={docItem.title}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{docItem.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[240px]">
                          {docItem.name || 'Belum diunggah'}
                        </p>
                      </div>
                      {docItem.url && (
                        <a
                          href={docItem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-slate-300 hover:bg-emerald-50 rounded-lg shrink-0"
                        >
                          <span>Buka Berkas</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Status Verifikasi Berkas
                      </label>
                      <select
                        value={docItem.status}
                        onChange={(e) =>
                          docItem.setStatus(e.target.value as DocumentVerificationStatus)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white"
                      >
                        {DOCUMENT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Catatan Kelengkapan Dokumen
                </label>
                <textarea
                  rows={2}
                  value={documentNote}
                  onChange={(e) => setDocumentNote(e.target.value)}
                  placeholder="Contoh: Foto KK kurang jelas di bagian NIK, mohon kirim ulang via WhatsApp."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDocuments}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  <span>Simpan Verifikasi Dokumen</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFIKASI PEMBAYARAN TERPISAH */}
          {activeTab === 'pembayaran' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <InfoCard title="Informasi Pembayaran Orang Tua">
                  <InfoRow label="Program" value={payments?.program || registration.program} />
                  <InfoRow label="Rencana" value={payments?.paymentPlan || '-'} />
                  <InfoRow label="Metode" value={payments?.paymentMethod || '-'} />
                  <InfoRow
                    label="Nominal Awal"
                    value={formatRupiah(payments?.paymentAmount || 0)}
                    mono
                  />
                  <InfoRow
                    label="Tanggal Bayar"
                    value={payments?.paymentDate ? formatIndonesianDate(payments.paymentDate) : '-'}
                  />
                  <InfoRow label="Catatan Orang Tua" value={payments?.paymentNote || '-'} />
                  <InfoRow
                    label="Rekening Tujuan"
                    value={`${SCHOOL_INFO.bankName} ${SCHOOL_INFO.bankAccountNumber}`}
                  />
                </InfoCard>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-900 mb-2">
                    Bukti Transfer / Pembayaran
                  </p>
                  {payments?.proofUrl ? (
                    <a
                      href={payments.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-slate-300 hover:bg-emerald-50 rounded-lg"
                    >
                      <span>Buka Bukti Transfer ({payments.proofName})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Orang tua belum mengunggah bukti transfer.
                    </p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Panel Verifikasi Bendahara
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status pembayaran berdiri sendiri dan tidak otomatis mengubah status penerimaan siswa.
                  </p>
                </div>

                {/* Kalkulator Sisa Pembayaran */}
                {(() => {
                  const standardBill = 995000;
                  const currentPaid = Number(paymentAmount) || 0;
                  const remaining = Math.max(0, standardBill - currentPaid);
                  return (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-2">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-600 font-medium">Standar Total Tagihan PPDB:</span>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(standardBill)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-600 font-medium">Total Terverifikasi (Cicilan):</span>
                        <span className="font-mono font-bold text-emerald-800">{formatRupiah(currentPaid)}</span>
                      </div>
                      <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm sm:text-base">
                        <span className="font-bold text-slate-900">Sisa Pembayaran:</span>
                        <span className={`font-mono font-bold ${remaining === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {formatRupiah(remaining)} {remaining === 0 ? '(LUNAS)' : ''}
                        </span>
                      </div>
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount('500000');
                            setPaymentStatus('Cicilan Tahap 1');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg text-emerald-900 cursor-pointer"
                        >
                          Cicilan 1 (Rp 500.000)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount('750000');
                            setPaymentStatus('Cicilan Tahap 2');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg text-emerald-900 cursor-pointer"
                        >
                          Cicilan 2 (Rp 750.000)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount('995000');
                            setPaymentStatus('Lunas');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 rounded-lg cursor-pointer"
                        >
                          Lunas (Rp 995.000)
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status Pembayaran
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      {PAYMENT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Jumlah Terverifikasi (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(sanitizeDigits(e.target.value, 9))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tanggal Pembayaran
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Diverifikasi Terakhir Oleh
                    </label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 truncate">
                      {payments?.verifiedByEmail || 'Belum diverifikasi'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Catatan Bendahara
                  </label>
                  <textarea
                    rows={3}
                    value={treasurerNote}
                    onChange={(e) => setTreasurerNote(e.target.value)}
                    placeholder="Contoh: Mutasi BRI masuk sebesar Rp ... pada tanggal ..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePayment}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Verifikasi Pembayaran</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STATUS PENDAFTARAN & LOG RIWAYAT */}
          {activeTab === 'status' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Ubah Status Pendaftaran & Tambah Catatan
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status Pendaftaran
                  </label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value as RegistrationStatus)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white font-medium"
                  >
                    {REGISTRATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Catatan Panitia / Verifikator
                  </label>
                  <textarea
                    rows={4}
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder="Tuliskan catatan pemeriksaan berkas, keputusan, atau arahan untuk orang tua..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSaveNoteOnly}
                    disabled={saving}
                    className="px-4 py-2.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                  >
                    Simpan Catatan Saja
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStatus}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Status Pendaftaran</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Riwayat Audit Aktivitas Admin
                  </h3>
                </div>

                {!verifications || verifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Belum ada catatan perubahan atau verifikasi oleh admin.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {verifications.map((log) => (
                      <div
                        key={log.verificationId}
                        className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-900">{log.actionType}</span>
                          <span className="text-slate-500 tabular-nums">
                            {formatIndonesianDate(log.createdAt, true)}
                          </span>
                        </div>
                        <p className="text-slate-800">{log.note}</p>
                        <p className="text-[11px] text-slate-500">
                          {log.previousValue} → {log.newValue} · Oleh: {log.adminEmail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-2.5">
      <h4 className="font-display text-sm font-bold text-emerald-900 pb-2 border-b border-slate-200">
        {title}
      </h4>
      <div className="space-y-2 text-xs sm:text-sm">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-slate-900 font-medium text-right ${mono ? 'font-mono tabular-nums' : ''}`}
      >
        {value || '-'}
      </span>
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}
