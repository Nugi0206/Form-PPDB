import { FIELD_LIMITS, FormDraftState } from '../types/ppdb';

export function calculateAge(birthDateStr: string): {
  years: number;
  months: number;
  label: string;
  valid: boolean;
} {
  if (!birthDateStr) {
    return { years: 0, months: 0, label: 'Isi tanggal lahir terlebih dahulu', valid: false };
  }
  const birth = new Date(`${birthDateStr}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return { years: 0, months: 0, label: 'Tanggal lahir tidak valid', valid: false };
  }

  const today = new Date();
  if (birth > today) {
    return { years: 0, months: 0, label: 'Tanggal lahir tidak boleh melebihi hari ini', valid: false };
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0 || years > 15) {
    return { years: Math.max(0, years), months: Math.max(0, months), label: 'Periksa kembali tanggal lahir anak', valid: false };
  }

  return {
    years,
    months,
    label: `${years} tahun ${months} bulan`,
    valid: true,
  };
}

export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function toDateObject(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date(Number((value as { seconds: number }).seconds) * 1000);
  }
  return null;
}

export function formatIndonesianDate(value: unknown, includeTime = false): string {
  const date = toDateObject(value);
  if (!date) return '-';
  if (includeTime) {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatIsoDateOnly(value: unknown): string {
  const date = toDateObject(value);
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function emailToKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function clampStr(value: string | undefined | null, maxLen: number): string {
  if (!value) return '';
  return value.trim().slice(0, maxLen);
}

export function sanitizeDigits(value: string, maxLen: number): string {
  return value.replace(/[^0-9]/g, '').slice(0, maxLen);
}

export function validateUploadFile(
  file: File,
  maxFileSizeMb: number
): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];

  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: 'Format file harus JPG, JPEG, PNG, atau PDF.',
    };
  }

  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Ukuran file maksimal ${maxFileSizeMb} MB (file Anda ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  return { valid: true };
}

export function createInitialFormDraft(): FormDraftState {
  return {
    fullName: '',
    nickname: '',
    gender: 'Laki-laki',
    nik: '',
    kkNumber: '',
    birthPlace: '',
    birthDate: '',
    religion: 'Islam',
    childOrder: '1',
    heightCm: '',
    weightKg: '',
    address: '',
    village: '',
    district: 'Arjawinangun',
    city: 'Kabupaten Cirebon',
    province: 'Jawa Barat',
    previousSchool: '',
    educationDuration: '2 tahun',
    fatherName: '',
    fatherStatus: 'Masih Hidup',
    fatherNik: '',
    fatherBirthPlaceDate: '',
    fatherEducation: '',
    fatherOccupation: '',
    fatherWhatsapp: '',
    motherName: '',
    motherStatus: 'Masih Hidup',
    motherNik: '',
    motherBirthPlaceDate: '',
    motherEducation: '',
    motherOccupation: '',
    motherWhatsapp: '',
    livesWith: 'Ayah dan Ibu',
    guardianName: '',
    guardianRelation: '',
    guardianWhatsapp: '',
    guardianAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    hasDiseaseHistory: false,
    diseaseHistoryDetail: '',
    hasAllergy: false,
    allergyDetail: '',
    takesRoutineMedication: false,
    routineMedicationDetail: '',
    hasSpecialHealthCondition: false,
    specialHealthConditionDetail: '',
    hasSpecialNeeds: false,
    specialNeedsDetail: '',
    communicationAbility: 'Lancar berbicara kalimat sederhana',
    eatingIndependence: 'Makan sendiri dengan rapi',
    toiletIndependence: 'Sudah mandiri ke toilet',
    socializationAbility: 'Mudah bergaul dengan teman sebaya',
    characterAndDevelopmentNote: '',
    docKkReady: false,
    docBirthCertReady: false,
    docParentKtpReady: false,
    docPhotoReady: false,
    docSpecialDocReady: false,
    program: 'Reguler',
    scholarshipReason: '',
    scholarshipVerificationAgreed: false,
    paymentPlan: 'Lunas',
    paymentMethod: 'Transfer BRI',
    paymentDate: '',
    paymentAmount: '0',
    paymentNote: '',
    referralSource: 'Tetangga / Kerabat',
    reasonChoosingSchool: '',
    childInterests: '',
    parentExpectations: '',
    dataTruthAgreed: false,
    schoolRulesAgreed: false,
    administrationPaymentAgreed: false,
    healthUpdateAgreed: false,
    dataProcessingAgreed: false,
    internalDocumentationAgreed: false,
    publicMediaAgreed: false,
  };
}

export function parseReadableFirestoreError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed.error) {
      if (parsed.error.includes('Missing or insufficient permissions')) {
        return 'Akses ditolak oleh aturan keamanan database. Pastikan Anda memiliki izin atau hubungi panitia PPDB.';
      }
      if (parsed.error.includes('Quota exceeded')) {
        return 'Kuota pembacaan database harian telah mencapai batas. Silakan coba lagi besok atau hubungi administrator.';
      }
      return parsed.error;
    }
  } catch {
    // bukan JSON FirestoreErrorInfo
  }
  return raw;
}

export { FIELD_LIMITS };
