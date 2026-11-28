import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateAge,
  createInitialFormDraft,
  formatRupiah,
  parseReadableFirestoreError,
  sanitizeDigits,
  validateUploadFile,
} from '../lib/utils';
import { submitRegistration, UploadedFileMap } from '../services/ppdbService';
import {
  AcademicYearConfig,
  DocumentUploadKey,
  FIELD_LIMITS,
  FormDraftState,
  NON_REGULAR_PRINTED_FORM_NOTE,
  PROGRAMS,
  REGEX_PATTERNS,
  RegistrationFullBundle,
  SCHOOL_INFO,
} from '../types/ppdb';

interface RegistrationFormWizardProps {
  academicYear: AcademicYearConfig;
  onCancel: () => void;
  onSuccess: (bundle: RegistrationFullBundle) => void;
}

const DRAFT_STORAGE_KEY = 'ppdb_ra_darusyifa_draft_v1';

const STEP_TITLES = [
  { num: 1, label: 'Identitas Anak' },
  { num: 2, label: 'Data Orang Tua' },
  { num: 3, label: 'Wali & Darurat' },
  { num: 4, label: 'Kesehatan' },
  { num: 5, label: 'Dokumen' },
  { num: 6, label: 'Program & Bayar' },
  { num: 7, label: 'Info Tambahan' },
  { num: 8, label: 'Persetujuan' },
];

export function RegistrationFormWizard({
  academicYear,
  onCancel,
  onSuccess,
}: RegistrationFormWizardProps) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<FormDraftState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return { ...createInitialFormDraft(), ...JSON.parse(saved) };
      }
    } catch {
      // Abaikan error localStorage
    }
    return createInitialFormDraft();
  });

  const [files, setFiles] = useState<UploadedFileMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const age = useMemo(() => calculateAge(draft.birthDate), [draft.birthDate]);
  const selectedProgramMeta = useMemo(
    () => PROGRAMS.find((p) => p.id === draft.program) || PROGRAMS[0],
    [draft.program]
  );

  const isYatimScholarship =
    draft.program === 'Beasiswa Anak Yatim Piatu' || draft.program === 'Beasiswa Anak Yatim';
  const isTahfidzScholarship = draft.program === "Beasiswa Tahfidz Al-Qur'an";
  const isAnyScholarship = isYatimScholarship || isTahfidzScholarship;

  const isGuardianRequired =
    draft.livesWith === 'Wali' ||
    draft.livesWith === 'Lainnya' ||
    (draft.fatherStatus === 'Meninggal Dunia' && draft.motherStatus === 'Meninggal Dunia');

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Abaikan error localStorage
    }
  }, [draft]);

  const updateField = <K extends keyof FormDraftState>(key: K, value: FormDraftState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFileChange = (key: DocumentUploadKey, file: File | null) => {
    if (!file) {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const check = validateUploadFile(file, academicYear.maxFileSizeMb);
    if (!check.valid) {
      setErrors((prev) => ({ ...prev, [`file_${key}`]: check.error || 'Berkas tidak valid.' }));
      return;
    }

    setFiles((prev) => ({ ...prev, [key]: file }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`file_${key}`];
      return next;
    });
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setToastMessage('Draf formulir berhasil disimpan di perangkat Anda.');
    } catch {
      setToastMessage('Tidak dapat menyimpan draf lokal pada browser ini.');
    }
  };

  const validateStep = (targetStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (draft.fullName.trim().length < 2) newErrors.fullName = 'Nama lengkap anak wajib diisi.';
      if (draft.nickname.trim().length < 1) newErrors.nickname = 'Nama panggilan wajib diisi.';
      if (!REGEX_PATTERNS.nik16.test(draft.nik))
        newErrors.nik = 'NIK anak harus terdiri dari tepat 16 digit angka.';
      if (!REGEX_PATTERNS.nik16.test(draft.kkNumber))
        newErrors.kkNumber = 'Nomor Kartu Keluarga harus terdiri dari tepat 16 digit angka.';
      if (draft.birthPlace.trim().length < 2)
        newErrors.birthPlace = 'Tempat lahir anak wajib diisi.';
      if (!draft.birthDate || !age.valid)
        newErrors.birthDate = age.label || 'Tanggal lahir anak tidak valid.';
      const height = Number(draft.heightCm);
      if (!height || height < 30 || height > 200)
        newErrors.heightCm = 'Isi tinggi badan anak yang valid (30–200 cm).';
      const weight = Number(draft.weightKg);
      if (!weight || weight < 5 || weight > 100)
        newErrors.weightKg = 'Isi berat badan anak yang valid (5–100 kg).';
      if (draft.address.trim().length < 5) newErrors.address = 'Alamat lengkap wajib diisi.';
      if (draft.village.trim().length < 2) newErrors.village = 'Desa/Kelurahan wajib diisi.';
      if (draft.district.trim().length < 2) newErrors.district = 'Kecamatan wajib diisi.';
      if (draft.city.trim().length < 2) newErrors.city = 'Kabupaten/Kota wajib diisi.';
      if (draft.province.trim().length < 2) newErrors.province = 'Provinsi wajib diisi.';
    }

    if (targetStep === 2) {
      if (draft.fatherName.trim().length < 2)
        newErrors.fatherName = 'Nama lengkap ayah wajib diisi.';
      if (draft.fatherStatus === 'Masih Hidup') {
        if (!REGEX_PATTERNS.nik16.test(draft.fatherNik))
          newErrors.fatherNik = 'NIK ayah harus 16 digit angka.';
        if (draft.fatherBirthPlaceDate.trim().length < 3)
          newErrors.fatherBirthPlaceDate = 'Tempat dan tanggal lahir ayah wajib diisi.';
        if (draft.fatherEducation.trim().length < 2)
          newErrors.fatherEducation = 'Pendidikan terakhir ayah wajib diisi.';
        if (draft.fatherOccupation.trim().length < 2)
          newErrors.fatherOccupation = 'Pekerjaan ayah wajib diisi.';
        if (draft.fatherWhatsapp.trim().length < 8)
          newErrors.fatherWhatsapp = 'Nomor WhatsApp aktif ayah wajib diisi.';
      }

      if (draft.motherName.trim().length < 2)
        newErrors.motherName = 'Nama lengkap ibu wajib diisi.';
      if (draft.motherStatus === 'Masih Hidup') {
        if (!REGEX_PATTERNS.nik16.test(draft.motherNik))
          newErrors.motherNik = 'NIK ibu harus 16 digit angka.';
        if (draft.motherBirthPlaceDate.trim().length < 3)
          newErrors.motherBirthPlaceDate = 'Tempat dan tanggal lahir ibu wajib diisi.';
        if (draft.motherEducation.trim().length < 2)
          newErrors.motherEducation = 'Pendidikan terakhir ibu wajib diisi.';
        if (draft.motherOccupation.trim().length < 2)
          newErrors.motherOccupation = 'Pekerjaan ibu wajib diisi.';
        if (draft.motherWhatsapp.trim().length < 8)
          newErrors.motherWhatsapp = 'Nomor WhatsApp aktif ibu wajib diisi.';
      }
    }

    if (targetStep === 3) {
      if (isGuardianRequired) {
        if (draft.guardianName.trim().length < 2)
          newErrors.guardianName = 'Nama wali wajib diisi karena anak tinggal bersama wali / orang tua telah wafat.';
        if (draft.guardianRelation.trim().length < 2)
          newErrors.guardianRelation = 'Hubungan wali dengan anak wajib diisi.';
        if (draft.guardianWhatsapp.trim().length < 8)
          newErrors.guardianWhatsapp = 'Nomor WhatsApp wali wajib diisi.';
        if (draft.guardianAddress.trim().length < 5)
          newErrors.guardianAddress = 'Alamat wali wajib diisi.';
      }
      if (draft.emergencyContactName.trim().length < 2)
        newErrors.emergencyContactName = 'Nama kontak darurat wajib diisi.';
      if (draft.emergencyContactPhone.trim().length < 8)
        newErrors.emergencyContactPhone = 'Nomor kontak darurat wajib diisi.';
    }

    if (targetStep === 4) {
      if (draft.hasDiseaseHistory && draft.diseaseHistoryDetail.trim().length < 2)
        newErrors.diseaseHistoryDetail = 'Jelaskan riwayat penyakit anak.';
      if (draft.hasAllergy && draft.allergyDetail.trim().length < 2)
        newErrors.allergyDetail = 'Jelaskan alergi yang dimiliki anak.';
      if (draft.takesRoutineMedication && draft.routineMedicationDetail.trim().length < 2)
        newErrors.routineMedicationDetail = 'Sebutkan obat yang rutin dikonsumsi anak.';
      if (draft.hasSpecialHealthCondition && draft.specialHealthConditionDetail.trim().length < 2)
        newErrors.specialHealthConditionDetail = 'Jelaskan kondisi kesehatan khusus anak.';
      if (draft.hasSpecialNeeds && draft.specialNeedsDetail.trim().length < 2)
        newErrors.specialNeedsDetail = 'Jelaskan kebutuhan khusus anak.';
      if (draft.communicationAbility.trim().length < 2)
        newErrors.communicationAbility = 'Pilih atau isi kemampuan komunikasi anak.';
    }

    if (targetStep === 5) {
      if (!draft.docKkReady)
        newErrors.docKkReady = 'Konfirmasi penyiapan Kartu Keluarga (KK) wajib dicentang.';
      if (!draft.docBirthCertReady)
        newErrors.docBirthCertReady = 'Konfirmasi penyiapan Akta Kelahiran anak wajib dicentang.';
    }

    if (targetStep === 6) {
      if (isAnyScholarship) {
        if (draft.scholarshipReason.trim().length < 10)
          newErrors.scholarshipReason = 'Tuliskan alasan pengajuan beasiswa minimal 10 karakter.';
        if (!draft.scholarshipVerificationAgreed)
          newErrors.scholarshipVerificationAgreed =
            'Anda harus menyetujui proses verifikasi beasiswa oleh sekolah.';
        if (isYatimScholarship && !files.orphanCert)
          newErrors.file_orphanCert =
            'Surat Keterangan Yatim/Piatu wajib diunggah untuk program beasiswa ini.';
        if (isTahfidzScholarship && !files.tahfidzCert)
          newErrors.file_tahfidzCert =
            'Sertifikat Tahfidz wajib diunggah untuk program Beasiswa Tahfidz Al-Qur’an.';
      }

      const amount = Number(String(draft.paymentAmount || '0').replace(/[^0-9]/g, '')) || 0;
      if (draft.paymentMethod === 'Transfer BRI' && amount > 0 && !files.paymentProof) {
        newErrors.file_paymentProof =
          'Unggah bukti transfer BRI karena Anda mengisi nominal pembayaran.';
      }
    }

    if (targetStep === 8) {
      if (!draft.dataTruthAgreed)
        newErrors.dataTruthAgreed = 'Persetujuan kebenaran data wajib dicentang.';
      if (!draft.schoolRulesAgreed)
        newErrors.schoolRulesAgreed = 'Persetujuan tata tertib sekolah wajib dicentang.';
      if (!draft.administrationPaymentAgreed)
        newErrors.administrationPaymentAgreed =
          'Persetujuan ketentuan administrasi & pembayaran wajib dicentang.';
      if (!draft.healthUpdateAgreed)
        newErrors.healthUpdateAgreed =
          'Persetujuan pembaruan informasi kesehatan anak wajib dicentang.';
      if (!draft.dataProcessingAgreed)
        newErrors.dataProcessingAgreed =
          'Persetujuan pemrosesan data administrasi pendidikan wajib dicentang.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Abaikan
    }
    setStep((s) => Math.min(8, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitAll = async () => {
    setSubmitError(null);
    // Validasi seluruh langkah wajib
    for (const checkStep of [1, 2, 3, 4, 5, 6, 8]) {
      if (!validateStep(checkStep)) {
        setStep(checkStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (!academicYear.isOpen) {
      setSubmitError(
        `Maaf, pendaftaran PPDB Tahun Pelajaran ${academicYear.yearLabel} saat ini sedang ditutup.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const bundle = await submitRegistration(draft, academicYear, files);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Abaikan
      }
      onSuccess(bundle);
    } catch (err) {
      setSubmitError(parseReadableFirestoreError(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (fieldKey?: string) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
      fieldKey && errors[fieldKey]
        ? 'border-red-500 focus:ring-red-200'
        : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Formulir */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-950 mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Sambutan Formulir</span>
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Formulir Pendaftaran PPDB Online
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {SCHOOL_INFO.name} · Tahun Pelajaran {academicYear.yearLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-900 bg-white border border-slate-300 hover:bg-emerald-50 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
        </div>

        {/* Notifikasi Draf Tersimpan */}
        {toastMessage && (
          <div className="mb-5 flex items-center gap-2.5 bg-emerald-900 text-white px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Peringatan jika pendaftaran ditutup */}
        {!academicYear.isOpen && (
          <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3.5 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pendaftaran Tahun Pelajaran {academicYear.yearLabel} Ditutup</p>
              <p className="text-xs mt-0.5">
                Anda masih dapat melihat kolom formulir, namun pengiriman pendaftaran baru dinonaktifkan sementara oleh panitia.
              </p>
            </div>
          </div>
        )}

        {/* Indikator Progres 8 Bagian */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
            <span>
              Bagian {step} dari 8: <strong className="text-slate-900">{STEP_TITLES[step - 1].label}</strong>
            </span>
            <span className="font-mono tabular-nums text-emerald-800 font-semibold">
              {Math.round((step / 8) * 100)}%
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-emerald-700 transition-all duration-200"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {STEP_TITLES.map((item) => {
              const isCurrent = step === item.num;
              const isPassed = step > item.num;
              return (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => {
                    if (item.num < step) setStep(item.num);
                  }}
                  disabled={item.num > step}
                  className={`px-2 py-2 rounded-lg text-center transition-colors ${
                    isCurrent
                      ? 'bg-emerald-800 text-white font-semibold'
                      : isPassed
                        ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="block font-mono text-xs tabular-nums">0{item.num}</span>
                  <span className="hidden sm:block text-[11px] truncate mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Global / Validasi */}
        {(submitError || Object.keys(errors).length > 0) && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {submitError ? 'Pengiriman Gagal' : 'Periksa Kembali Isian Formulir'}
              </p>
              {submitError ? (
                <p className="mt-1">{submitError}</p>
              ) : (
                <p className="mt-1">
                  Data Anda tersimpan aman dan tidak hilang. Terdapat {Object.keys(errors).length} kolom yang wajib dilengkapi atau diperbaiki pada bagian ini.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Konten Formulir per Bagian */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          {/* BAGIAN 1: IDENTITAS CALON PESERTA DIDIK */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 1 — Identitas Calon Peserta Didik
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Isi identitas anak sesuai Kartu Keluarga (KK) dan Akta Kelahiran.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Nama Lengkap Anak" required error={errors.fullName}>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.fullName}
                    value={draft.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Sesuai Akta Kelahiran"
                    className={inputClass('fullName')}
                  />
                </Field>

                <Field label="Nama Panggilan" required error={errors.nickname}>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.nickname}
                    value={draft.nickname}
                    onChange={(e) => updateField('nickname', e.target.value)}
                    placeholder="Contoh: Aisyah"
                    className={inputClass('nickname')}
                  />
                </Field>

                <Field label="Jenis Kelamin" required>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Laki-laki', 'Perempuan'] as const).map((g) => (
                      <label
                        key={g}
                        className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                          draft.gender === g
                            ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={draft.gender === g}
                          onChange={() => updateField('gender', g)}
                          className="sr-only"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Agama" required>
                  <select
                    value={draft.religion}
                    onChange={(e) => updateField('religion', e.target.value)}
                    className={inputClass()}
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </Field>

                <Field label="NIK Anak (16 Digit)" required error={errors.nik}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={draft.nik}
                    onChange={(e) => updateField('nik', sanitizeDigits(e.target.value, 16))}
                    placeholder="3209xxxxxxxxxxxx"
                    className={`${inputClass('nik')} font-mono tabular-nums`}
                  />
                </Field>

                <Field label="Nomor Kartu Keluarga (16 Digit)" required error={errors.kkNumber}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={draft.kkNumber}
                    onChange={(e) => updateField('kkNumber', sanitizeDigits(e.target.value, 16))}
                    placeholder="3209xxxxxxxxxxxx"
                    className={`${inputClass('kkNumber')} font-mono tabular-nums`}
                  />
                </Field>

                <Field label="Tempat Lahir" required error={errors.birthPlace}>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.birthPlace}
                    value={draft.birthPlace}
                    onChange={(e) => updateField('birthPlace', e.target.value)}
                    placeholder="Contoh: Cirebon"
                    className={inputClass('birthPlace')}
                  />
                </Field>

                <Field label="Tanggal Lahir" required error={errors.birthDate}>
                  <input
                    type="date"
                    value={draft.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className={inputClass('birthDate')}
                  />
                </Field>

                <Field label="Usia Anak Saat Ini (Otomatis)">
                  <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-sm font-semibold text-emerald-900 tabular-nums">
                    {age.label}
                  </div>
                </Field>

                <Field label="Anak Keberapa" required>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={draft.childOrder}
                    onChange={(e) => updateField('childOrder', e.target.value)}
                    className={`${inputClass()} font-mono tabular-nums`}
                  />
                </Field>

                <Field label="Tinggi Badan (cm)" required error={errors.heightCm}>
                  <input
                    type="number"
                    min={30}
                    max={200}
                    value={draft.heightCm}
                    onChange={(e) => updateField('heightCm', e.target.value)}
                    placeholder="Contoh: 105"
                    className={`${inputClass('heightCm')} font-mono tabular-nums`}
                  />
                </Field>

                <Field label="Berat Badan (kg)" required error={errors.weightKg}>
                  <input
                    type="number"
                    step="0.5"
                    min={5}
                    max={100}
                    value={draft.weightKg}
                    onChange={(e) => updateField('weightKg', e.target.value)}
                    placeholder="Contoh: 16"
                    className={`${inputClass('weightKg')} font-mono tabular-nums`}
                  />
                </Field>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-5">
                <Field label="Alamat Lengkap (Jalan / Blok / RT / RW)" required error={errors.address}>
                  <textarea
                    rows={2}
                    maxLength={FIELD_LIMITS.address}
                    value={draft.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Contoh: Blok Karanganyar RT 02 RW 04"
                    className={inputClass('address')}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Desa / Kelurahan" required error={errors.village}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.village}
                      value={draft.village}
                      onChange={(e) => updateField('village', e.target.value)}
                      placeholder="Contoh: Jungjang"
                      className={inputClass('village')}
                    />
                  </Field>

                  <Field label="Kecamatan" required error={errors.district}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.district}
                      value={draft.district}
                      onChange={(e) => updateField('district', e.target.value)}
                      className={inputClass('district')}
                    />
                  </Field>

                  <Field label="Kabupaten / Kota" required error={errors.city}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.city}
                      value={draft.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={inputClass('city')}
                    />
                  </Field>

                  <Field label="Provinsi" required error={errors.province}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.province}
                      value={draft.province}
                      onChange={(e) => updateField('province', e.target.value)}
                      className={inputClass('province')}
                    />
                  </Field>

                  <Field label="Asal Sekolah Sebelumnya (Jika Ada)">
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.previousSchool}
                      value={draft.previousSchool}
                      onChange={(e) => updateField('previousSchool', e.target.value)}
                      placeholder="Contoh: PAUD / KB ... (kosongkan jika belum ada)"
                      className={inputClass()}
                    />
                  </Field>

                  <Field label="Lama Pendidikan yang Dipilih" required>
                    <div className="grid grid-cols-2 gap-3">
                      {(['1 tahun', '2 tahun'] as const).map((dur) => (
                        <label
                          key={dur}
                          className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                            draft.educationDuration === dur
                              ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="educationDuration"
                            value={dur}
                            checked={draft.educationDuration === dur}
                            onChange={() => updateField('educationDuration', dur)}
                            className="sr-only"
                          />
                          {dur}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN 2: DATA AYAH DAN IBU */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 2 — Data Ayah dan Ibu
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Jika orang tua berstatus meninggal dunia, kolom detail NIK, kontak, dan pekerjaan menjadi tidak wajib diisi.
                </p>
              </div>

              {/* Data Ayah */}
              <div className="space-y-5">
                <h3 className="font-display text-base font-bold text-emerald-900 pb-2 border-b border-slate-200">
                  Data Ayah Kandung
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Nama Lengkap Ayah" required error={errors.fatherName}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.parentName}
                      value={draft.fatherName}
                      onChange={(e) => updateField('fatherName', e.target.value)}
                      className={inputClass('fatherName')}
                    />
                  </Field>

                  <Field label="Status Ayah" required>
                    <select
                      value={draft.fatherStatus}
                      onChange={(e) =>
                        updateField('fatherStatus', e.target.value as 'Masih Hidup' | 'Meninggal Dunia')
                      }
                      className={inputClass()}
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Meninggal Dunia">Meninggal Dunia</option>
                    </select>
                  </Field>

                  <Field
                    label="NIK Ayah (16 Digit)"
                    required={draft.fatherStatus === 'Masih Hidup'}
                    error={errors.fatherNik}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={draft.fatherNik}
                      onChange={(e) => updateField('fatherNik', sanitizeDigits(e.target.value, 16))}
                      placeholder={
                        draft.fatherStatus === 'Meninggal Dunia' ? 'Opsional' : '16 digit angka'
                      }
                      className={`${inputClass('fatherNik')} font-mono tabular-nums`}
                    />
                  </Field>

                  <Field
                    label="Tempat & Tanggal Lahir Ayah"
                    required={draft.fatherStatus === 'Masih Hidup'}
                    error={errors.fatherBirthPlaceDate}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.birthPlaceDate}
                      value={draft.fatherBirthPlaceDate}
                      onChange={(e) => updateField('fatherBirthPlaceDate', e.target.value)}
                      placeholder="Contoh: Cirebon, 12 Mei 1990"
                      className={inputClass('fatherBirthPlaceDate')}
                    />
                  </Field>

                  <Field
                    label="Pendidikan Terakhir Ayah"
                    required={draft.fatherStatus === 'Masih Hidup'}
                    error={errors.fatherEducation}
                  >
                    <select
                      value={draft.fatherEducation}
                      onChange={(e) => updateField('fatherEducation', e.target.value)}
                      className={inputClass('fatherEducation')}
                    >
                      <option value="">Pilih pendidikan</option>
                      <option value="SD / Sederajat">SD / Sederajat</option>
                      <option value="SMP / Sederajat">SMP / Sederajat</option>
                      <option value="SMA / SMK / MA">SMA / SMK / MA</option>
                      <option value="D1 / D2 / D3">D1 / D2 / D3</option>
                      <option value="S1 / D4">S1 / D4</option>
                      <option value="S2 / S3">S2 / S3</option>
                    </select>
                  </Field>

                  <Field
                    label="Pekerjaan Ayah"
                    required={draft.fatherStatus === 'Masih Hidup'}
                    error={errors.fatherOccupation}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.occupation}
                      value={draft.fatherOccupation}
                      onChange={(e) => updateField('fatherOccupation', e.target.value)}
                      placeholder="Contoh: Wiraswasta / Karyawan Swasta"
                      className={inputClass('fatherOccupation')}
                    />
                  </Field>

                  <Field
                    label="Nomor WhatsApp Aktif Ayah"
                    required={draft.fatherStatus === 'Masih Hidup'}
                    error={errors.fatherWhatsapp}
                  >
                    <input
                      type="tel"
                      maxLength={FIELD_LIMITS.phone}
                      value={draft.fatherWhatsapp}
                      onChange={(e) => updateField('fatherWhatsapp', e.target.value)}
                      placeholder="Contoh: 0812xxxxxxxx"
                      className={`${inputClass('fatherWhatsapp')} font-mono tabular-nums`}
                    />
                  </Field>
                </div>
              </div>

              {/* Data Ibu */}
              <div className="space-y-5 pt-4 border-t border-slate-200">
                <h3 className="font-display text-base font-bold text-emerald-900 pb-2 border-b border-slate-200">
                  Data Ibu Kandung
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Nama Lengkap Ibu" required error={errors.motherName}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.parentName}
                      value={draft.motherName}
                      onChange={(e) => updateField('motherName', e.target.value)}
                      className={inputClass('motherName')}
                    />
                  </Field>

                  <Field label="Status Ibu" required>
                    <select
                      value={draft.motherStatus}
                      onChange={(e) =>
                        updateField('motherStatus', e.target.value as 'Masih Hidup' | 'Meninggal Dunia')
                      }
                      className={inputClass()}
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Meninggal Dunia">Meninggal Dunia</option>
                    </select>
                  </Field>

                  <Field
                    label="NIK Ibu (16 Digit)"
                    required={draft.motherStatus === 'Masih Hidup'}
                    error={errors.motherNik}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={draft.motherNik}
                      onChange={(e) => updateField('motherNik', sanitizeDigits(e.target.value, 16))}
                      placeholder={
                        draft.motherStatus === 'Meninggal Dunia' ? 'Opsional' : '16 digit angka'
                      }
                      className={`${inputClass('motherNik')} font-mono tabular-nums`}
                    />
                  </Field>

                  <Field
                    label="Tempat & Tanggal Lahir Ibu"
                    required={draft.motherStatus === 'Masih Hidup'}
                    error={errors.motherBirthPlaceDate}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.birthPlaceDate}
                      value={draft.motherBirthPlaceDate}
                      onChange={(e) => updateField('motherBirthPlaceDate', e.target.value)}
                      placeholder="Contoh: Cirebon, 20 Agustus 1993"
                      className={inputClass('motherBirthPlaceDate')}
                    />
                  </Field>

                  <Field
                    label="Pendidikan Terakhir Ibu"
                    required={draft.motherStatus === 'Masih Hidup'}
                    error={errors.motherEducation}
                  >
                    <select
                      value={draft.motherEducation}
                      onChange={(e) => updateField('motherEducation', e.target.value)}
                      className={inputClass('motherEducation')}
                    >
                      <option value="">Pilih pendidikan</option>
                      <option value="SD / Sederajat">SD / Sederajat</option>
                      <option value="SMP / Sederajat">SMP / Sederajat</option>
                      <option value="SMA / SMK / MA">SMA / SMK / MA</option>
                      <option value="D1 / D2 / D3">D1 / D2 / D3</option>
                      <option value="S1 / D4">S1 / D4</option>
                      <option value="S2 / S3">S2 / S3</option>
                    </select>
                  </Field>

                  <Field
                    label="Pekerjaan Ibu"
                    required={draft.motherStatus === 'Masih Hidup'}
                    error={errors.motherOccupation}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.occupation}
                      value={draft.motherOccupation}
                      onChange={(e) => updateField('motherOccupation', e.target.value)}
                      placeholder="Contoh: Ibu Rumah Tangga / Guru"
                      className={inputClass('motherOccupation')}
                    />
                  </Field>

                  <Field
                    label="Nomor WhatsApp Aktif Ibu"
                    required={draft.motherStatus === 'Masih Hidup'}
                    error={errors.motherWhatsapp}
                  >
                    <input
                      type="tel"
                      maxLength={FIELD_LIMITS.phone}
                      value={draft.motherWhatsapp}
                      onChange={(e) => updateField('motherWhatsapp', e.target.value)}
                      placeholder="Contoh: 0813xxxxxxxx"
                      className={`${inputClass('motherWhatsapp')} font-mono tabular-nums`}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN 3: DATA WALI DAN KONTAK DARURAT */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 3 — Data Wali dan Kontak Darurat
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Lengkapi pihak yang mengasuh anak sehari-hari serta nomor kontak darurat yang dapat dihubungi sekolah.
                </p>
              </div>

              <Field label="Saat Ini Anak Tinggal Bersama" required>
                <select
                  value={draft.livesWith}
                  onChange={(e) =>
                    updateField(
                      'livesWith',
                      e.target.value as 'Ayah dan Ibu' | 'Ayah' | 'Ibu' | 'Wali' | 'Lainnya'
                    )
                  }
                  className={inputClass()}
                >
                  <option value="Ayah dan Ibu">Ayah dan Ibu</option>
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali</option>
                  <option value="Lainnya">Lainnya (Kakek / Nenek / Kerabat)</option>
                </select>
              </Field>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-5">
                <p className="text-sm font-semibold text-slate-900">
                  Identitas Wali{' '}
                  <span className="font-normal text-slate-500">
                    ({isGuardianRequired ? 'Wajib diisi' : 'Opsional jika tinggal bersama orang tua'})
                  </span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="Nama Lengkap Wali"
                    required={isGuardianRequired}
                    error={errors.guardianName}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.parentName}
                      value={draft.guardianName}
                      onChange={(e) => updateField('guardianName', e.target.value)}
                      className={inputClass('guardianName')}
                    />
                  </Field>

                  <Field
                    label="Hubungan dengan Anak"
                    required={isGuardianRequired}
                    error={errors.guardianRelation}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.relation}
                      value={draft.guardianRelation}
                      onChange={(e) => updateField('guardianRelation', e.target.value)}
                      placeholder="Contoh: Nenek / Paman / Bibi"
                      className={inputClass('guardianRelation')}
                    />
                  </Field>

                  <Field
                    label="Nomor WhatsApp Wali"
                    required={isGuardianRequired}
                    error={errors.guardianWhatsapp}
                  >
                    <input
                      type="tel"
                      maxLength={FIELD_LIMITS.phone}
                      value={draft.guardianWhatsapp}
                      onChange={(e) => updateField('guardianWhatsapp', e.target.value)}
                      className={`${inputClass('guardianWhatsapp')} font-mono tabular-nums`}
                    />
                  </Field>

                  <Field
                    label="Alamat Wali"
                    required={isGuardianRequired}
                    error={errors.guardianAddress}
                  >
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.address}
                      value={draft.guardianAddress}
                      onChange={(e) => updateField('guardianAddress', e.target.value)}
                      className={inputClass('guardianAddress')}
                    />
                  </Field>
                </div>
              </div>

              <div className="pt-2 space-y-5">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Kontak Darurat (Wajib)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Nama Kontak Darurat" required error={errors.emergencyContactName}>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.parentName}
                      value={draft.emergencyContactName}
                      onChange={(e) => updateField('emergencyContactName', e.target.value)}
                      placeholder="Nama kerabat/keluarga terdekat"
                      className={inputClass('emergencyContactName')}
                    />
                  </Field>

                  <Field
                    label="Nomor Telepon / WhatsApp Darurat"
                    required
                    error={errors.emergencyContactPhone}
                  >
                    <input
                      type="tel"
                      maxLength={FIELD_LIMITS.phone}
                      value={draft.emergencyContactPhone}
                      onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className={`${inputClass('emergencyContactPhone')} font-mono tabular-nums`}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN 4: RIWAYAT KESEHATAN DAN PERKEMBANGAN ANAK */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 4 — Riwayat Kesehatan dan Perkembangan Anak
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Informasi ini membantu guru mendampingi kesehatan dan kenyamanan anak selama kegiatan belajar.
                </p>
              </div>

              <div className="space-y-4">
                <YesNoDetailField
                  label="Apakah anak memiliki riwayat penyakit tertentu?"
                  checked={draft.hasDiseaseHistory}
                  onToggle={(val) => updateField('hasDiseaseHistory', val)}
                  detail={draft.diseaseHistoryDetail}
                  onDetailChange={(val) => updateField('diseaseHistoryDetail', val)}
                  placeholder="Sebutkan riwayat penyakit (contoh: asma, kejang demam, dll.)"
                  error={errors.diseaseHistoryDetail}
                />

                <YesNoDetailField
                  label="Apakah anak memiliki alergi (makanan, obat, debu, dll.)?"
                  checked={draft.hasAllergy}
                  onToggle={(val) => updateField('hasAllergy', val)}
                  detail={draft.allergyDetail}
                  onDetailChange={(val) => updateField('allergyDetail', val)}
                  placeholder="Sebutkan jenis alergi dan reaksi yang muncul"
                  error={errors.allergyDetail}
                />

                <YesNoDetailField
                  label="Apakah anak mengonsumsi obat rutin?"
                  checked={draft.takesRoutineMedication}
                  onToggle={(val) => updateField('takesRoutineMedication', val)}
                  detail={draft.routineMedicationDetail}
                  onDetailChange={(val) => updateField('routineMedicationDetail', val)}
                  placeholder="Sebutkan nama obat dan aturan konsumsinya"
                  error={errors.routineMedicationDetail}
                />

                <YesNoDetailField
                  label="Apakah anak memiliki kondisi kesehatan khusus?"
                  checked={draft.hasSpecialHealthCondition}
                  onToggle={(val) => updateField('hasSpecialHealthCondition', val)}
                  detail={draft.specialHealthConditionDetail}
                  onDetailChange={(val) => updateField('specialHealthConditionDetail', val)}
                  placeholder="Jelaskan kondisi kesehatan yang perlu diperhatikan guru"
                  error={errors.specialHealthConditionDetail}
                />

                <YesNoDetailField
                  label="Apakah anak memiliki kebutuhan khusus?"
                  checked={draft.hasSpecialNeeds}
                  onToggle={(val) => updateField('hasSpecialNeeds', val)}
                  detail={draft.specialNeedsDetail}
                  onDetailChange={(val) => updateField('specialNeedsDetail', val)}
                  placeholder="Jelaskan pendampingan khusus yang dibutuhkan anak"
                  error={errors.specialNeedsDetail}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-5">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Perkembangan & Kemandirian Anak
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Kemampuan Komunikasi" required error={errors.communicationAbility}>
                    <select
                      value={draft.communicationAbility}
                      onChange={(e) => updateField('communicationAbility', e.target.value)}
                      className={inputClass('communicationAbility')}
                    >
                      <option value="Lancar berbicara kalimat sederhana">
                        Lancar berbicara kalimat sederhana
                      </option>
                      <option value="Masih belajar merangkai kata">
                        Masih belajar merangkai kata
                      </option>
                      <option value="Pemalu namun memahami instruksi">
                        Pemalu namun memahami instruksi
                      </option>
                      <option value="Perlu stimulasi bicara lebih lanjut">
                        Perlu stimulasi bicara lebih lanjut
                      </option>
                    </select>
                  </Field>

                  <Field label="Kemampuan Makan Sendiri" required>
                    <select
                      value={draft.eatingIndependence}
                      onChange={(e) => updateField('eatingIndependence', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="Makan sendiri dengan rapi">Makan sendiri dengan rapi</option>
                      <option value="Makan sendiri masih perlu diawasi">
                        Makan sendiri masih perlu diawasi
                      </option>
                      <option value="Masih perlu disuapi">Masih perlu disuapi</option>
                    </select>
                  </Field>

                  <Field label="Kemandirian Toilet (Toilet Training)" required>
                    <select
                      value={draft.toiletIndependence}
                      onChange={(e) => updateField('toiletIndependence', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="Sudah mandiri ke toilet">Sudah mandiri ke toilet</option>
                      <option value="Bilang jika ingin ke toilet (perlu dibantu)">
                        Bilang jika ingin ke toilet (perlu dibantu)
                      </option>
                      <option value="Masih memakai popok / belum toilet training">
                        Masih memakai popok / belum toilet training
                      </option>
                    </select>
                  </Field>

                  <Field label="Kemampuan Bersosialisasi" required>
                    <select
                      value={draft.socializationAbility}
                      onChange={(e) => updateField('socializationAbility', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="Mudah bergaul dengan teman sebaya">
                        Mudah bergaul dengan teman sebaya
                      </option>
                      <option value="Butuh waktu beradaptasi di awal">
                        Butuh waktu beradaptasi di awal
                      </option>
                      <option value="Cenderung pendiam / lebih suka bermain sendiri">
                        Cenderung pendiam / lebih suka bermain sendiri
                      </option>
                    </select>
                  </Field>
                </div>

                <Field label="Informasi Tambahan Karakter & Perkembangan Anak">
                  <textarea
                    rows={3}
                    maxLength={FIELD_LIMITS.characterNote}
                    value={draft.characterAndDevelopmentNote}
                    onChange={(e) => updateField('characterAndDevelopmentNote', e.target.value)}
                    placeholder="Contoh: Anak suka menggambar, mudah cemas saat baru berpisah dengan ibu, dll."
                    className={inputClass()}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* BAGIAN 5: KONFIRMASI DOKUMEN & DAFTAR ULANG */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 5 — Konfirmasi Dokumen Persyaratan
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Untuk mempercepat proses pendaftaran online, dokumen fisik tidak perlu diunggah. Cukup centang konfirmasi penyiapan berkas di bawah ini.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-300 text-xs sm:text-sm text-amber-950 leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <span>📌</span>
                  <span>Catatan Penting Daftar Ulang & Penyerahan Berkas:</span>
                </p>
                <p>
                  Seluruh dokumen fisik persyaratan (Kartu Keluarga, Akta Kelahiran, KTP Orang Tua, Pas Foto, serta Surat Keterangan Yatim / Sertifikat Tahfidz bagi jalur beasiswa atau formulir print-out bagi program selain Reguler) <strong>wajib dibawa lengkap saat kegiatan daftar ulang / penyerahan berkas fisik</strong> di RA Darusyifa Arjawinangun.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.docKkReady}
                      onChange={(e) => updateField('docKkReady', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                    />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      Saya menyatakan bahwa <strong>Kartu Keluarga (KK)</strong> asli & fotokopi telah disiapkan dan akan dibawa saat daftar ulang ke sekolah. <span className="text-red-600">*</span>
                    </span>
                  </label>
                  {errors.docKkReady && (
                    <p className="mt-1 text-xs text-red-600">{errors.docKkReady}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.docBirthCertReady}
                      onChange={(e) => updateField('docBirthCertReady', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                    />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      Saya menyatakan bahwa <strong>Akta Kelahiran Anak</strong> asli & fotokopi telah disiapkan dan akan dibawa saat daftar ulang ke sekolah. <span className="text-red-600">*</span>
                    </span>
                  </label>
                  {errors.docBirthCertReady && (
                    <p className="mt-1 text-xs text-red-600">{errors.docBirthCertReady}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.docParentKtpReady}
                      onChange={(e) => updateField('docParentKtpReady', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                    />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      Saya menyatakan bahwa <strong>KTP Ayah & Ibu / Wali</strong> telah disiapkan dan akan dibawa saat daftar ulang ke sekolah.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.docPhotoReady}
                      onChange={(e) => updateField('docPhotoReady', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                    />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      Saya menyatakan bahwa <strong>Pas Foto Calon Peserta Didik</strong> telah disiapkan dan akan dibawa saat daftar ulang ke sekolah.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.docSpecialDocReady}
                      onChange={(e) => updateField('docSpecialDocReady', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                    />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      Saya menyatakan bahwa <strong>Dokumen Pendukung Khusus</strong> (Surat Keterangan Yatim/Piatu, Sertifikat Tahfidz, atau Form Program Alumni) telah disiapkan (jika mendaftar jalur khusus).
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN 6: PROGRAM PENDIDIKAN DAN PEMBAYARAN */}
          {step === 6 && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 6 — Program Pendidikan dan Pembayaran
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Pilih program pendidikan serta rencana dan metode pembayaran.
                </p>
              </div>

              {/* Pilihan Program */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Pilihan Program Pendidikan <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {PROGRAMS.map((prog) => (
                    <label
                      key={prog.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        draft.program === prog.id
                          ? 'bg-emerald-50 border-emerald-700'
                          : 'bg-white border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={prog.id}
                        checked={draft.program === prog.id}
                        onChange={() => updateField('program', prog.id)}
                        className="mt-1 accent-emerald-800"
                      />
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{prog.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{prog.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {draft.program !== 'Reguler' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-sm text-amber-950">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        Ketentuan Program {selectedProgramMeta.title}
                      </p>
                      <p className="text-xs sm:text-sm mt-1 leading-relaxed">
                        {NON_REGULAR_PRINTED_FORM_NOTE} Bukti formulir yang siap dicetak akan langsung tersedia setelah Anda mengirim pendaftaran ini.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Kolom Khusus Beasiswa */}
              {isAnyScholarship && (
                <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-5">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Kelengkapan Pengajuan {selectedProgramMeta.title}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1">
                      Pengajuan beasiswa akan diverifikasi oleh tim panitia dan pimpinan sekolah.
                    </p>
                  </div>

                  <Field label="Alasan Pengajuan Beasiswa" required error={errors.scholarshipReason}>
                    <textarea
                      rows={3}
                      maxLength={FIELD_LIMITS.scholarshipReason}
                      value={draft.scholarshipReason}
                      onChange={(e) => updateField('scholarshipReason', e.target.value)}
                      placeholder="Jelaskan kondisi dan alasan pengajuan beasiswa"
                      className={inputClass('scholarshipReason')}
                    />
                  </Field>

                  {isYatimScholarship && (
                    <DocumentUploadCard
                      label="Dokumen Pendukung: Surat Keterangan Yatim / Piatu"
                      required
                      file={files.orphanCert}
                      error={errors.file_orphanCert}
                      onSelect={(f) => handleFileChange('orphanCert', f)}
                    />
                  )}

                  {isTahfidzScholarship && (
                    <DocumentUploadCard
                      label="Dokumen Pendukung: Sertifikat Tahfidz Al-Qur'an"
                      required
                      file={files.tahfidzCert}
                      error={errors.file_tahfidzCert}
                      onSelect={(f) => handleFileChange('tahfidzCert', f)}
                    />
                  )}

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.scholarshipVerificationAgreed}
                        onChange={(e) =>
                          updateField('scholarshipVerificationAgreed', e.target.checked)
                        }
                        className="mt-1 w-4 h-4 accent-emerald-800 rounded"
                      />
                      <span className="text-sm text-slate-800">
                        Saya menyetujui berkas dan keterangan beasiswa ini diverifikasi oleh pihak{' '}
                        {SCHOOL_INFO.name}, termasuk kunjungan atau konfirmasi apabila diperlukan.
                      </span>
                    </label>
                    {errors.scholarshipVerificationAgreed && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.scholarshipVerificationAgreed}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pembayaran */}
              <div className="pt-4 border-t border-slate-200 space-y-5">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Rencana & Informasi Pembayaran
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Pilihan Pembayaran" required>
                    <select
                      value={draft.paymentPlan}
                      onChange={(e) =>
                        updateField('paymentPlan', e.target.value as 'Lunas' | 'Cicilan 3 tahap')
                      }
                      className={inputClass()}
                    >
                      <option value="Lunas">Lunas</option>
                      <option value="Cicilan 3 tahap">Cicilan 3 tahap</option>
                    </select>
                  </Field>

                  <Field label="Metode Pembayaran" required>
                    <select
                      value={draft.paymentMethod}
                      onChange={(e) =>
                        updateField(
                          'paymentMethod',
                          e.target.value as
                            | 'Transfer BRI'
                            | 'Pembayaran tunai kepada bendahara sekolah'
                        )
                      }
                      className={inputClass()}
                    >
                      <option value="Transfer BRI">Transfer BRI</option>
                      <option value="Pembayaran tunai kepada bendahara sekolah">
                        Pembayaran tunai kepada bendahara sekolah
                      </option>
                    </select>
                  </Field>
                </div>

                {/* Informasi Rekening BRI */}
                <div className="p-4 rounded-xl bg-emerald-900 text-white text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs text-amber-300 font-semibold">Rekening Resmi Sekolah</p>
                    <p className="font-bold mt-0.5">
                      {SCHOOL_INFO.bankName} ·{' '}
                      <span className="font-mono tabular-nums">{SCHOOL_INFO.bankAccountNumber}</span>
                    </p>
                    <p className="text-xs text-emerald-100">a.n. {SCHOOL_INFO.bankAccountHolder}</p>
                  </div>
                  <p className="text-xs text-emerald-100 max-w-xs">
                    Status pembayaran akan diverifikasi secara resmi oleh bendahara sekolah setelah pendaftaran diterima.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Tanggal Pembayaran (Jika Sudah Membayar)">
                    <input
                      type="date"
                      value={draft.paymentDate}
                      onChange={(e) => updateField('paymentDate', e.target.value)}
                      className={inputClass()}
                    />
                  </Field>

                  <Field label="Jumlah Pembayaran (Rp)">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={draft.paymentAmount}
                      onChange={(e) =>
                        updateField('paymentAmount', sanitizeDigits(e.target.value, 9))
                      }
                      placeholder="0 jika belum melakukan transfer"
                      className={`${inputClass()} font-mono tabular-nums`}
                    />
                    {Number(draft.paymentAmount) > 0 && (
                      <p className="text-xs text-emerald-800 mt-1 font-medium tabular-nums">
                        Nominal: {formatRupiah(Number(draft.paymentAmount))}
                      </p>
                    )}
                  </Field>
                </div>

                <DocumentUploadCard
                  label="Unggah Bukti Transfer / Pembayaran (Jika Sudah Membayar)"
                  hint="Opsional jika akan membayar tunai ke bendahara atau menyusul setelah pendaftaran"
                  file={files.paymentProof}
                  error={errors.file_paymentProof}
                  onSelect={(f) => handleFileChange('paymentProof', f)}
                />

                <Field label="Catatan Pembayaran">
                  <textarea
                    rows={2}
                    maxLength={FIELD_LIMITS.paymentNote}
                    value={draft.paymentNote}
                    onChange={(e) => updateField('paymentNote', e.target.value)}
                    placeholder="Contoh: Transfer dari rekening a.n. Budi untuk pembayaran tahap 1"
                    className={inputClass()}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* BAGIAN 7: INFORMASI TAMBAHAN */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 7 — Informasi Tambahan
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Masukan orang tua membantu kami mengenal minat anak dan meningkatkan mutu layanan pendidikan.
                </p>
              </div>

              <div className="space-y-5">
                <Field label="Mengetahui RA Darusyifa Arjawinangun dari mana?">
                  <select
                    value={draft.referralSource}
                    onChange={(e) => updateField('referralSource', e.target.value)}
                    className={inputClass()}
                  >
                    <option value="Tetangga / Kerabat">Tetangga / Kerabat</option>
                    <option value="Alumni / Orang Tua Murid">Alumni / Orang Tua Murid</option>
                    <option value="Media Sosial (Instagram / Facebook / WhatsApp)">
                      Media Sosial (Instagram / Facebook / WhatsApp)
                    </option>
                    <option value="Spanduk / Brosur Sekolah">Spanduk / Brosur Sekolah</option>
                    <option value="Mencari di Google / Internet">Mencari di Google / Internet</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </Field>

                <Field label="Alasan Memilih RA Darusyifa Arjawinangun">
                  <textarea
                    rows={3}
                    maxLength={FIELD_LIMITS.reasonChoosingSchool}
                    value={draft.reasonChoosingSchool}
                    onChange={(e) => updateField('reasonChoosingSchool', e.target.value)}
                    placeholder="Ceritakan alasan Bapak/Ibu memilih RA Darusyifa"
                    className={inputClass()}
                  />
                </Field>

                <Field label="Minat atau Kesukaan Anak">
                  <textarea
                    rows={2}
                    maxLength={FIELD_LIMITS.childInterests}
                    value={draft.childInterests}
                    onChange={(e) => updateField('childInterests', e.target.value)}
                    placeholder="Contoh: Suka mewarnai, menyanyi lagu Islami, bermain balok, hafalan doa"
                    className={inputClass()}
                  />
                </Field>

                <Field label="Harapan Orang Tua Terhadap Sekolah">
                  <textarea
                    rows={3}
                    maxLength={FIELD_LIMITS.parentExpectations}
                    value={draft.parentExpectations}
                    onChange={(e) => updateField('parentExpectations', e.target.value)}
                    placeholder="Harapan Bapak/Ibu selama putra/putri belajar di RA Darusyifa"
                    className={inputClass()}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* BAGIAN 8: PERNYATAAN DAN PERSETUJUAN */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Bagian 8 — Pernyataan dan Persetujuan Orang Tua / Wali
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Baca dengan cermat sebelum mengirimkan formulir pendaftaran.
                </p>
              </div>

              <div className="space-y-3.5">
                <p className="text-sm font-semibold text-slate-900">
                  Persetujuan Wajib <span className="text-red-600">*</span>
                </p>

                {[
                  {
                    key: 'dataTruthAgreed' as const,
                    text: 'Seluruh data dan dokumen yang saya isi serta unggah dalam formulir ini adalah benar dan dapat dipertanggungjawabkan.',
                  },
                  {
                    key: 'schoolRulesAgreed' as const,
                    text: 'Saya bersedia mematuhi dan mengikuti seluruh tata tertib serta program pendidikan di RA Darusyifa Arjawinangun.',
                  },
                  {
                    key: 'administrationPaymentAgreed' as const,
                    text: 'Saya bersedia mengikuti ketentuan administrasi dan prosedur verifikasi pembayaran resmi melalui bendahara sekolah.',
                  },
                  {
                    key: 'healthUpdateAgreed' as const,
                    text: 'Saya bersedia segera memberikan informasi kepada pihak sekolah apabila terdapat perubahan kondisi kesehatan anak.',
                  },
                  {
                    key: 'dataProcessingAgreed' as const,
                    text: 'Saya menyetujui pemrosesan data pribadi siswa dan orang tua secara terbatas untuk keperluan administrasi pendidikan RA Darusyifa Arjawinangun.',
                  },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft[item.key]}
                        onChange={(e) => updateField(item.key, e.target.checked)}
                        className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                      />
                      <span className="text-sm text-slate-800 leading-relaxed">{item.text}</span>
                    </label>
                    {errors[item.key] && (
                      <p className="mt-1 text-xs text-red-600">{errors[item.key]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pilihan Terpisah Dokumentasi */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <p className="text-sm font-semibold text-slate-900">
                  Persetujuan Dokumentasi (Pilihan Terpisah)
                </p>
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.internalDocumentationAgreed}
                    onChange={(e) => updateField('internalDocumentationAgreed', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                  />
                  <span className="text-sm text-slate-800">
                    Saya mengizinkan pengambilan foto/video anak untuk keperluan{' '}
                    <strong>dokumentasi internal dan laporan perkembangan belajar</strong>.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.publicMediaAgreed}
                    onChange={(e) => updateField('publicMediaAgreed', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-800 rounded shrink-0"
                  />
                  <span className="text-sm text-slate-800">
                    Saya mengizinkan publikasi foto/video kegiatan belajar anak pada{' '}
                    <strong>media informasi resmi RA Darusyifa Arjawinangun</strong>.
                  </span>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950 leading-relaxed">
                <strong>Perhatian:</strong> Pengiriman formulir pendaftaran ini bukan berarti calon peserta didik otomatis dinyatakan diterima. Penerimaan resmi menunggu proses verifikasi dokumen, verifikasi pembayaran oleh bendahara, dan keputusan panitia PPDB.
              </div>
            </div>
          )}

          {/* Navigasi Bawah Formulir */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan</span>
              </button>
            </div>

            {step < 8 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
              >
                <span>Lanjut ke Bagian {step + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitAll}
                disabled={submitting || !academicYear.isOpen}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Pendaftaran</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-800 mb-1.5">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function YesNoDetailField({
  label,
  checked,
  onToggle,
  detail,
  onDetailChange,
  placeholder,
  error,
}: {
  label: string;
  checked: boolean;
  onToggle: (val: boolean) => void;
  detail: string;
  onDetailChange: (val: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggle(false)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              !checked
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Tidak
          </button>
          <button
            type="button"
            onClick={() => onToggle(true)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              checked
                ? 'bg-amber-400 text-emerald-950 border-amber-500'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Ya
          </button>
        </div>
      </div>

      {checked && (
        <div>
          <input
            type="text"
            maxLength={FIELD_LIMITS.healthDetail}
            value={detail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-lg border px-3.5 py-2 text-sm bg-white ${
              error ? 'border-red-500' : 'border-slate-300 focus:border-emerald-700'
            } focus:outline-none`}
          />
          {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function DocumentUploadCard({
  label,
  hint,
  required,
  file,
  error,
  onSelect,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  file?: File;
  error?: string;
  onSelect: (file: File | null) => void;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        error
          ? 'border-red-400 bg-red-50/30'
          : file
            ? 'border-emerald-300 bg-emerald-50/40'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {label} {required && <span className="text-red-600">*</span>}
          </p>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
          {file && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-emerald-900">
              <Check className="w-4 h-4 text-emerald-700" />
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[220px]">{file.name}</span>
              <span className="text-slate-500 tabular-nums">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {file && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Hapus file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{file ? 'Ganti File' : 'Pilih File'}</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(e) => onSelect(e.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
