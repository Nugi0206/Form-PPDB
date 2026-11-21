export type Gender = 'Laki-laki' | 'Perempuan';

export type EducationDuration = '1 tahun' | '2 tahun';

export type EducationProgram =
  | 'Reguler'
  | 'Beasiswa Anak Yatim Piatu'
  | 'Beasiswa Anak Yatim'
  | 'Program Alumni'
  | "Beasiswa Tahfidz Al-Qur'an";

export type ParentLifeStatus = 'Masih Hidup' | 'Meninggal Dunia';

export type LivesWithOption = 'Ayah dan Ibu' | 'Ayah' | 'Ibu' | 'Wali' | 'Lainnya';

export type RegistrationStatus =
  | 'Terdaftar'
  | 'Menunggu Verifikasi'
  | 'Perlu Perbaikan'
  | 'Menunggu Pembayaran'
  | 'Menunggu Keputusan'
  | 'Diterima'
  | 'Ditolak'
  | 'Mengundurkan Diri';

export type PaymentPlan = 'Lunas' | 'Cicilan 3 tahap';

export type PaymentMethod = 'Transfer BRI' | 'Pembayaran tunai kepada bendahara sekolah';

export type PaymentStatus =
  | 'Belum Bayar'
  | 'Menunggu Verifikasi'
  | 'Cicilan Tahap 1'
  | 'Cicilan Tahap 2'
  | 'Cicilan Tahap 3'
  | 'Lunas'
  | 'Ditolak';

export type DocumentVerificationStatus =
  | 'Belum Diunggah'
  | 'Menunggu Verifikasi'
  | 'Valid'
  | 'Perlu Perbaikan';

export type AdminRole = 'super_admin' | 'admin' | 'bendahara';

export type VerificationActionType =
  | 'STATUS_CHANGE'
  | 'PAYMENT_VERIFICATION'
  | 'DOCUMENT_VERIFICATION'
  | 'DATA_CORRECTION'
  | 'NOTE_ADDED';

export const SCHOOL_INFO = {
  name: 'RA Darusyifa Arjawinangun',
  shortName: 'RA Darusyifa',
  tagline: 'Terakreditasi B – Pendidikan Islami Berkualitas',
  subtitle: 'Pendidikan Islami Berkualitas untuk Anak Usia Dini',
  websiteUrl: 'https://radarusyifaarjawinangun.my.id',
  bankName: 'Bank BRI',
  bankAccountNumber: '415001003649509',
  bankAccountHolder: 'GIAN DWI WAHYUNI',
  rootAdminEmail: 'muhamadnugiandri@gmail.com',
} as const;

export const NON_REGULAR_PRINTED_FORM_NOTE =
  'Semua program selain Reguler (Program Alumni, Beasiswa Anak Yatim Piatu, Beasiswa Anak Yatim, dan Beasiswa Tahfidz Al-Qur’an) wajib melampirkan dokumen formulir pendaftaran yang sudah di-print.';

export const PROGRAMS: {
  id: EducationProgram;
  title: string;
  description: string;
  requiresScholarshipDocs: boolean;
  docHint?: string;
}[] = [
  {
    id: 'Reguler',
    title: 'Program Reguler',
    description:
      'Program pembelajaran terpadu kurikulum RA berbasis nilai Al-Qur’an, akhlak mulia, literasi dini, dan kemandirian anak.',
    requiresScholarshipDocs: false,
  },
  {
    id: 'Beasiswa Anak Yatim Piatu',
    title: 'Beasiswa Anak Yatim Piatu',
    description:
      'Dukungan penuh pendidikan bagi calon peserta didik yatim piatu dengan melampirkan surat keterangan yatim/piatu resmi.',
    requiresScholarshipDocs: true,
    docHint:
      'Wajib melampirkan Surat Keterangan Yatim/Piatu dari desa/kelurahan atau lembaga terkait serta dokumen formulir pendaftaran yang sudah di-print.',
  },
  {
    id: 'Beasiswa Anak Yatim',
    title: 'Beasiswa Anak Yatim',
    description:
      'Program keringanan biaya pendidikan bagi calon peserta didik yatim dengan verifikasi surat keterangan resmi.',
    requiresScholarshipDocs: true,
    docHint:
      'Wajib melampirkan Surat Keterangan Yatim dari desa/kelurahan atau lembaga terkait serta dokumen formulir pendaftaran yang sudah di-print.',
  },
  {
    id: 'Program Alumni',
    title: 'Program Alumni',
    description:
      'Program khusus bagi adik kandung atau keluarga alumni RA Darusyifa Arjawinangun Tahun Kelulusan 2023/2024/2025/2026.',
    requiresScholarshipDocs: false,
    docHint: 'Wajib melampirkan dokumen formulir pendaftaran yang sudah di-print.',
  },
  {
    id: "Beasiswa Tahfidz Al-Qur'an",
    title: "Beasiswa Tahfidz Al-Qur'an",
    description:
      'Beasiswa apresiasi bagi calon peserta didik yang memiliki hafalan Al-Qur’an atau sertifikat tahfidz anak.',
    requiresScholarshipDocs: true,
    docHint:
      'Wajib melampirkan Sertifikat Tahfidz atau surat keterangan hafalan dari TPQ/lembaga serta dokumen formulir pendaftaran yang sudah di-print.',
  },
];

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'Terdaftar',
  'Menunggu Verifikasi',
  'Perlu Perbaikan',
  'Menunggu Pembayaran',
  'Menunggu Keputusan',
  'Diterima',
  'Ditolak',
  'Mengundurkan Diri',
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Belum Bayar',
  'Menunggu Verifikasi',
  'Cicilan Tahap 1',
  'Cicilan Tahap 2',
  'Cicilan Tahap 3',
  'Lunas',
  'Ditolak',
];

export const DOCUMENT_STATUSES: DocumentVerificationStatus[] = [
  'Belum Diunggah',
  'Menunggu Verifikasi',
  'Valid',
  'Perlu Perbaikan',
];

// Batas karakter sinkron dengan firebase-blueprint.json & firestore.rules
export const FIELD_LIMITS = {
  fullName: 120,
  nickname: 60,
  nik: 16,
  kkNumber: 16,
  birthPlace: 80,
  address: 300,
  village: 80,
  district: 80,
  city: 80,
  province: 80,
  previousSchool: 120,
  scholarshipReason: 1000,
  referralSource: 120,
  reasonChoosingSchool: 600,
  childInterests: 400,
  parentExpectations: 600,
  parentName: 120,
  birthPlaceDate: 100,
  education: 60,
  occupation: 80,
  phone: 30,
  relation: 60,
  healthDetail: 400,
  ability: 200,
  characterNote: 600,
  paymentNote: 500,
  treasurerNote: 600,
  verificationNote: 1000,
  documentNote: 600,
  schoolAddress: 300,
  announcementNote: 500,
} as const;

export const REGEX_PATTERNS = {
  id: /^[a-zA-Z0-9_-]+$/,
  nik16: /^[0-9]{16}$/,
  dateIso: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  yearCode: /^[0-9]{4}$/,
} as const;

export interface AcademicYearConfig {
  id: string;
  yearLabel: string;
  yearCode: string;
  isActive: boolean;
  isOpen: boolean;
  currentSequence: number;
  lastRegistrationId?: string;
  maxFileSizeMb: number;
  schoolPhone: string;
  schoolWhatsapp: string;
  schoolEmail: string;
  schoolAddress: string;
  announcementNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminUserRecord {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  addedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbRegistrationRecord {
  registrationId: string;
  registrationNumber: string;
  sequenceNumber: number;
  academicYearId: string;
  academicYearLabel: string;
  fullName: string;
  nickname: string;
  gender: Gender;
  nik: string;
  kkNumber: string;
  birthPlace: string;
  birthDate: string;
  ageYears: number;
  ageMonths: number;
  religion: string;
  childOrder: number;
  heightCm: number;
  weightKg: number;
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  previousSchool?: string;
  educationDuration: EducationDuration;
  program: EducationProgram;
  scholarshipReason?: string;
  scholarshipVerificationAgreed?: boolean;
  referralSource?: string;
  reasonChoosingSchool?: string;
  childInterests?: string;
  parentExpectations?: string;
  primaryParentName: string;
  primaryWhatsapp: string;
  registrationStatus: RegistrationStatus;
  paymentStatusSummary: PaymentStatus;
  verificationNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbParentsRecord {
  registrationId: string;
  fatherName: string;
  fatherStatus: ParentLifeStatus;
  fatherNik?: string;
  fatherBirthPlaceDate?: string;
  fatherEducation?: string;
  fatherOccupation?: string;
  fatherWhatsapp?: string;
  motherName: string;
  motherStatus: ParentLifeStatus;
  motherNik?: string;
  motherBirthPlaceDate?: string;
  motherEducation?: string;
  motherOccupation?: string;
  motherWhatsapp?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbGuardiansRecord {
  registrationId: string;
  livesWith: LivesWithOption;
  guardianName?: string;
  guardianRelation?: string;
  guardianWhatsapp?: string;
  guardianAddress?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbHealthRecord {
  registrationId: string;
  hasDiseaseHistory: boolean;
  diseaseHistoryDetail?: string;
  hasAllergy: boolean;
  allergyDetail?: string;
  takesRoutineMedication: boolean;
  routineMedicationDetail?: string;
  hasSpecialHealthCondition: boolean;
  specialHealthConditionDetail?: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetail?: string;
  communicationAbility: string;
  eatingIndependence: string;
  toiletIndependence: string;
  socializationAbility: string;
  characterAndDevelopmentNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbDocumentsRecord {
  registrationId: string;
  kkUrl?: string;
  kkName?: string;
  kkStatus: DocumentVerificationStatus;
  birthCertUrl?: string;
  birthCertName?: string;
  birthCertStatus: DocumentVerificationStatus;
  fatherKtpUrl?: string;
  fatherKtpName?: string;
  fatherKtpStatus: DocumentVerificationStatus;
  motherKtpUrl?: string;
  motherKtpName?: string;
  motherKtpStatus: DocumentVerificationStatus;
  childPhotoUrl?: string;
  childPhotoName?: string;
  childPhotoStatus: DocumentVerificationStatus;
  orphanCertUrl?: string;
  orphanCertName?: string;
  orphanCertStatus: DocumentVerificationStatus;
  tahfidzCertUrl?: string;
  tahfidzCertName?: string;
  tahfidzCertStatus: DocumentVerificationStatus;
  documentNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbPaymentsRecord {
  registrationId: string;
  program: EducationProgram | string;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  paymentAmount: number;
  proofUrl?: string;
  proofName?: string;
  paymentNote?: string;
  verifiedByUid?: string;
  verifiedByEmail?: string;
  treasurerNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbConsentsRecord {
  registrationId: string;
  dataTruthAgreed: boolean;
  schoolRulesAgreed: boolean;
  administrationPaymentAgreed: boolean;
  healthUpdateAgreed: boolean;
  dataProcessingAgreed: boolean;
  internalDocumentationAgreed: boolean;
  publicMediaAgreed: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PpdbVerificationLogRecord {
  verificationId: string;
  registrationId: string;
  registrationNumber: string;
  actionType: VerificationActionType;
  previousValue: string;
  newValue: string;
  note: string;
  adminUid: string;
  adminEmail: string;
  createdAt?: unknown;
}

export interface RegistrationFullBundle {
  registration: PpdbRegistrationRecord;
  parents: PpdbParentsRecord;
  guardians: PpdbGuardiansRecord;
  health: PpdbHealthRecord;
  documents: PpdbDocumentsRecord;
  payments: PpdbPaymentsRecord;
  consents: PpdbConsentsRecord;
  verifications?: PpdbVerificationLogRecord[];
}

export type DocumentUploadKey =
  | 'kk'
  | 'birthCert'
  | 'fatherKtp'
  | 'motherKtp'
  | 'childPhoto'
  | 'orphanCert'
  | 'tahfidzCert'
  | 'paymentProof';

export interface FormDraftState {
  // Bagian 1
  fullName: string;
  nickname: string;
  gender: Gender;
  nik: string;
  kkNumber: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  childOrder: string;
  heightCm: string;
  weightKg: string;
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  previousSchool: string;
  educationDuration: EducationDuration;
  // Bagian 2
  fatherName: string;
  fatherStatus: ParentLifeStatus;
  fatherNik: string;
  fatherBirthPlaceDate: string;
  fatherEducation: string;
  fatherOccupation: string;
  fatherWhatsapp: string;
  motherName: string;
  motherStatus: ParentLifeStatus;
  motherNik: string;
  motherBirthPlaceDate: string;
  motherEducation: string;
  motherOccupation: string;
  motherWhatsapp: string;
  // Bagian 3
  livesWith: LivesWithOption;
  guardianName: string;
  guardianRelation: string;
  guardianWhatsapp: string;
  guardianAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Bagian 4
  hasDiseaseHistory: boolean;
  diseaseHistoryDetail: string;
  hasAllergy: boolean;
  allergyDetail: string;
  takesRoutineMedication: boolean;
  routineMedicationDetail: string;
  hasSpecialHealthCondition: boolean;
  specialHealthConditionDetail: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetail: string;
  communicationAbility: string;
  eatingIndependence: string;
  toiletIndependence: string;
  socializationAbility: string;
  characterAndDevelopmentNote: string;
  // Bagian 6
  program: EducationProgram;
  scholarshipReason: string;
  scholarshipVerificationAgreed: boolean;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  paymentAmount: string;
  paymentNote: string;
  // Bagian 7
  referralSource: string;
  reasonChoosingSchool: string;
  childInterests: string;
  parentExpectations: string;
  // Bagian 8
  dataTruthAgreed: boolean;
  schoolRulesAgreed: boolean;
  administrationPaymentAgreed: boolean;
  healthUpdateAgreed: boolean;
  dataProcessingAgreed: boolean;
  internalDocumentationAgreed: boolean;
  publicMediaAgreed: boolean;
}
