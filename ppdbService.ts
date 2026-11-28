import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import {
  calculateAge,
  clampStr,
  emailToKey,
  generateSafeId,
  sanitizeDigits,
} from '../lib/utils';
import {
  AcademicYearConfig,
  AdminRole,
  AdminUserRecord,
  DocumentUploadKey,
  DocumentVerificationStatus,
  FIELD_LIMITS,
  FormDraftState,
  PaymentStatus,
  PpdbConsentsRecord,
  PpdbDocumentsRecord,
  PpdbGuardiansRecord,
  PpdbHealthRecord,
  PpdbParentsRecord,
  PpdbPaymentsRecord,
  PpdbRegistrationRecord,
  PpdbVerificationLogRecord,
  RegistrationFullBundle,
  RegistrationStatus,
  SCHOOL_INFO,
  VerificationActionType,
} from '../types/ppdb';

export const DEFAULT_ACADEMIC_YEAR: AcademicYearConfig = {
  id: '2027_2028',
  yearLabel: '2027/2028',
  yearCode: '2027',
  isActive: true,
  isOpen: true,
  currentSequence: 0,
  maxFileSizeMb: 5,
  schoolPhone: '08990876694',
  schoolWhatsapp: '628990876694',
  schoolEmail: 'darusyifa.awn@gmail.com',
  schoolAddress: 'Perumahan Grand Awn RT 004 RW 014 Desa/Kec. Arjawinangun Cirebon',
  announcementNote:
    'Penerimaan Peserta Didik Baru Tahun Pelajaran 2027/2028 dibuka untuk Program Reguler, Program Alumni, serta Program Beasiswa.',
};

function hasLegacyPlaceholderContacts(data: Partial<AcademicYearConfig>): boolean {
  return (
    data.schoolPhone === '0852-2400-2027' ||
    data.schoolWhatsapp === '6285224002027' ||
    data.schoolEmail === 'ppdb@radarusyifa-arjawinangun.sch.id' ||
    Boolean(data.schoolAddress?.startsWith('Jl. Ki Hajar Dewantara'))
  );
}

function normalizeAcademicYearContacts(item: AcademicYearConfig): AcademicYearConfig {
  if (!hasLegacyPlaceholderContacts(item)) return item;
  return {
    ...item,
    schoolPhone:
      item.schoolPhone === '0852-2400-2027' ? DEFAULT_ACADEMIC_YEAR.schoolPhone : item.schoolPhone,
    schoolWhatsapp:
      item.schoolWhatsapp === '6285224002027'
        ? DEFAULT_ACADEMIC_YEAR.schoolWhatsapp
        : item.schoolWhatsapp,
    schoolEmail:
      item.schoolEmail === 'ppdb@radarusyifa-arjawinangun.sch.id'
        ? DEFAULT_ACADEMIC_YEAR.schoolEmail
        : item.schoolEmail,
    schoolAddress: item.schoolAddress?.startsWith('Jl. Ki Hajar Dewantara')
      ? DEFAULT_ACADEMIC_YEAR.schoolAddress
      : item.schoolAddress,
  };
}

export async function getAllAcademicYears(): Promise<AcademicYearConfig[]> {
  const colPath = 'academic_years';
  try {
    const snap = await getDocs(collection(db, colPath));
    if (snap.empty) {
      // Bootstrap tahun pelajaran default 2027/2028 jika koleksi masih kosong
      try {
        await setDoc(doc(db, colPath, DEFAULT_ACADEMIC_YEAR.id), {
          yearLabel: DEFAULT_ACADEMIC_YEAR.yearLabel,
          yearCode: DEFAULT_ACADEMIC_YEAR.yearCode,
          isActive: DEFAULT_ACADEMIC_YEAR.isActive,
          isOpen: DEFAULT_ACADEMIC_YEAR.isOpen,
          currentSequence: 0,
          maxFileSizeMb: DEFAULT_ACADEMIC_YEAR.maxFileSizeMb,
          schoolPhone: DEFAULT_ACADEMIC_YEAR.schoolPhone,
          schoolWhatsapp: DEFAULT_ACADEMIC_YEAR.schoolWhatsapp,
          schoolEmail: DEFAULT_ACADEMIC_YEAR.schoolEmail,
          schoolAddress: DEFAULT_ACADEMIC_YEAR.schoolAddress,
          announcementNote: DEFAULT_ACADEMIC_YEAR.announcementNote,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return [DEFAULT_ACADEMIC_YEAR];
      } catch {
        return [DEFAULT_ACADEMIC_YEAR];
      }
    }

    return snap.docs
      .map((d) =>
        normalizeAcademicYearContacts({
          id: d.id,
          ...(d.data() as Omit<AcademicYearConfig, 'id'>),
        })
      )
      .sort((a, b) => b.yearCode.localeCompare(a.yearCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function getActiveAcademicYear(): Promise<AcademicYearConfig> {
  const years = await getAllAcademicYears();
  return years.find((y) => y.isActive) || years[0] || DEFAULT_ACADEMIC_YEAR;
}

export type UploadedFileMap = Partial<Record<DocumentUploadKey, File>>;

interface UploadedDocResult {
  url: string;
  name: string;
}

async function uploadSingleDocument(
  registrationId: string,
  key: DocumentUploadKey,
  file: File
): Promise<UploadedDocResult> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeFileName = `${key}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, `ppdb_documents/${registrationId}/${safeFileName}`);

  try {
    await uploadBytes(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
    });
    const url = await getDownloadURL(storageRef);
    return { url, name: clampStr(file.name, 200) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Gagal mengunggah berkas "${file.name}" ke Firebase Storage (${message}). Pastikan layanan Firebase Storage sudah aktif dan rules storage.rules telah diterapkan.`
    );
  }
}

export async function submitRegistration(
  draft: FormDraftState,
  academicYear: AcademicYearConfig,
  files: UploadedFileMap
): Promise<RegistrationFullBundle> {
  const registrationId = generateSafeId('reg');

  // 1. Unggah seluruh dokumen yang dipilih orang tua ke Firebase Storage
  const uploadEntries = Object.entries(files).filter(
    (entry): entry is [DocumentUploadKey, File] => Boolean(entry[1])
  );

  const uploadedUrls: Partial<Record<DocumentUploadKey, UploadedDocResult>> = {};
  for (const [key, file] of uploadEntries) {
    uploadedUrls[key] = await uploadSingleDocument(registrationId, key, file);
  }

  const age = calculateAge(draft.birthDate);
  const yearRef = doc(db, 'academic_years', academicYear.id);

  const hasPaymentProof = Boolean(uploadedUrls.paymentProof?.url);
  const parsedAmount = Number(String(draft.paymentAmount || '0').replace(/[^0-9]/g, '')) || 0;
  // Status pembayaran tidak pernah otomatis Lunas dari input orang tua
  const initialPaymentStatus: PaymentStatus =
    hasPaymentProof || parsedAmount > 0 ? 'Menunggu Verifikasi' : 'Belum Bayar';

  const primaryParentName =
    draft.fatherStatus === 'Masih Hidup'
      ? clampStr(draft.fatherName, FIELD_LIMITS.parentName)
      : draft.motherStatus === 'Masih Hidup'
        ? clampStr(draft.motherName, FIELD_LIMITS.parentName)
        : clampStr(draft.guardianName || draft.motherName || draft.fatherName, FIELD_LIMITS.parentName);

  const primaryWhatsapp =
    draft.fatherStatus === 'Masih Hidup' && draft.fatherWhatsapp.trim()
      ? clampStr(draft.fatherWhatsapp, FIELD_LIMITS.phone)
      : draft.motherStatus === 'Masih Hidup' && draft.motherWhatsapp.trim()
        ? clampStr(draft.motherWhatsapp, FIELD_LIMITS.phone)
        : clampStr(draft.guardianWhatsapp || draft.emergencyContactPhone, FIELD_LIMITS.phone);

  let generatedRegNumber = '';
  let generatedSeq = 0;

  try {
    await runTransaction(db, async (tx) => {
      const yearSnap = await tx.get(yearRef);
      if (!yearSnap.exists()) {
        throw new Error('Tahun pelajaran aktif tidak ditemukan di database.');
      }
      const yearData = yearSnap.data() as Omit<AcademicYearConfig, 'id'>;
      if (!yearData.isOpen) {
        throw new Error(`Pendaftaran untuk Tahun Pelajaran ${yearData.yearLabel} saat ini sedang ditutup.`);
      }

      const nextSeq = (yearData.currentSequence || 0) + 1;
      generatedSeq = nextSeq;
      generatedRegNumber = `PPDB-${yearData.yearCode}-${String(nextSeq).padStart(4, '0')}`;

      tx.update(yearRef, {
        currentSequence: nextSeq,
        lastRegistrationId: registrationId,
        updatedAt: serverTimestamp(),
      });

      const registrationDoc: Omit<PpdbRegistrationRecord, 'createdAt' | 'updatedAt'> & {
        createdAt: unknown;
        updatedAt: unknown;
      } = {
        registrationId,
        registrationNumber: generatedRegNumber,
        sequenceNumber: nextSeq,
        academicYearId: academicYear.id,
        academicYearLabel: clampStr(yearData.yearLabel, 20),
        fullName: clampStr(draft.fullName, FIELD_LIMITS.fullName),
        nickname: clampStr(draft.nickname, FIELD_LIMITS.nickname),
        gender: draft.gender,
        nik: sanitizeDigits(draft.nik, 16),
        kkNumber: sanitizeDigits(draft.kkNumber, 16),
        birthPlace: clampStr(draft.birthPlace, FIELD_LIMITS.birthPlace),
        birthDate: draft.birthDate,
        ageYears: age.years,
        ageMonths: age.months,
        religion: clampStr(draft.religion || 'Islam', 30),
        childOrder: Math.max(1, Math.min(20, Number(draft.childOrder) || 1)),
        heightCm: Math.max(30, Math.min(200, Number(draft.heightCm) || 0)),
        weightKg: Math.max(5, Math.min(100, Number(draft.weightKg) || 0)),
        address: clampStr(draft.address, FIELD_LIMITS.address),
        village: clampStr(draft.village, FIELD_LIMITS.village),
        district: clampStr(draft.district, FIELD_LIMITS.district),
        city: clampStr(draft.city, FIELD_LIMITS.city),
        province: clampStr(draft.province, FIELD_LIMITS.province),
        previousSchool: clampStr(draft.previousSchool, FIELD_LIMITS.previousSchool),
        educationDuration: draft.educationDuration,
        program: draft.program,
        scholarshipReason: clampStr(draft.scholarshipReason, FIELD_LIMITS.scholarshipReason),
        scholarshipVerificationAgreed: Boolean(draft.scholarshipVerificationAgreed),
        referralSource: clampStr(draft.referralSource, FIELD_LIMITS.referralSource),
        reasonChoosingSchool: clampStr(draft.reasonChoosingSchool, FIELD_LIMITS.reasonChoosingSchool),
        childInterests: clampStr(draft.childInterests, FIELD_LIMITS.childInterests),
        parentExpectations: clampStr(draft.parentExpectations, FIELD_LIMITS.parentExpectations),
        primaryParentName,
        primaryWhatsapp,
        registrationStatus: 'Terdaftar',
        paymentStatusSummary: initialPaymentStatus,
        verificationNote: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const parentsDoc = {
        registrationId,
        fatherName: clampStr(draft.fatherName, FIELD_LIMITS.parentName),
        fatherStatus: draft.fatherStatus,
        fatherNik: sanitizeDigits(draft.fatherNik, 16),
        fatherBirthPlaceDate: clampStr(draft.fatherBirthPlaceDate, FIELD_LIMITS.birthPlaceDate),
        fatherEducation: clampStr(draft.fatherEducation, FIELD_LIMITS.education),
        fatherOccupation: clampStr(draft.fatherOccupation, FIELD_LIMITS.occupation),
        fatherWhatsapp: clampStr(draft.fatherWhatsapp, FIELD_LIMITS.phone),
        motherName: clampStr(draft.motherName, FIELD_LIMITS.parentName),
        motherStatus: draft.motherStatus,
        motherNik: sanitizeDigits(draft.motherNik, 16),
        motherBirthPlaceDate: clampStr(draft.motherBirthPlaceDate, FIELD_LIMITS.birthPlaceDate),
        motherEducation: clampStr(draft.motherEducation, FIELD_LIMITS.education),
        motherOccupation: clampStr(draft.motherOccupation, FIELD_LIMITS.occupation),
        motherWhatsapp: clampStr(draft.motherWhatsapp, FIELD_LIMITS.phone),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const guardiansDoc = {
        registrationId,
        livesWith: draft.livesWith,
        guardianName: clampStr(draft.guardianName, FIELD_LIMITS.parentName),
        guardianRelation: clampStr(draft.guardianRelation, FIELD_LIMITS.relation),
        guardianWhatsapp: clampStr(draft.guardianWhatsapp, FIELD_LIMITS.phone),
        guardianAddress: clampStr(draft.guardianAddress, FIELD_LIMITS.address),
        emergencyContactName: clampStr(draft.emergencyContactName, FIELD_LIMITS.parentName),
        emergencyContactPhone: clampStr(draft.emergencyContactPhone, FIELD_LIMITS.phone),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const healthDoc = {
        registrationId,
        hasDiseaseHistory: Boolean(draft.hasDiseaseHistory),
        diseaseHistoryDetail: clampStr(draft.diseaseHistoryDetail, FIELD_LIMITS.healthDetail),
        hasAllergy: Boolean(draft.hasAllergy),
        allergyDetail: clampStr(draft.allergyDetail, FIELD_LIMITS.healthDetail),
        takesRoutineMedication: Boolean(draft.takesRoutineMedication),
        routineMedicationDetail: clampStr(draft.routineMedicationDetail, FIELD_LIMITS.healthDetail),
        hasSpecialHealthCondition: Boolean(draft.hasSpecialHealthCondition),
        specialHealthConditionDetail: clampStr(draft.specialHealthConditionDetail, FIELD_LIMITS.healthDetail),
        hasSpecialNeeds: Boolean(draft.hasSpecialNeeds),
        specialNeedsDetail: clampStr(draft.specialNeedsDetail, FIELD_LIMITS.healthDetail),
        communicationAbility: clampStr(draft.communicationAbility, FIELD_LIMITS.ability),
        eatingIndependence: clampStr(draft.eatingIndependence, FIELD_LIMITS.ability),
        toiletIndependence: clampStr(draft.toiletIndependence, FIELD_LIMITS.ability),
        socializationAbility: clampStr(draft.socializationAbility, FIELD_LIMITS.ability),
        characterAndDevelopmentNote: clampStr(draft.characterAndDevelopmentNote, FIELD_LIMITS.characterNote),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docStatusFor = (res?: UploadedDocResult): DocumentVerificationStatus =>
        res?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah';

      const documentsDoc = {
        registrationId,
        kkUrl: uploadedUrls.kk?.url || '',
        kkName: uploadedUrls.kk?.name || '',
        kkStatus: docStatusFor(uploadedUrls.kk),
        birthCertUrl: uploadedUrls.birthCert?.url || '',
        birthCertName: uploadedUrls.birthCert?.name || '',
        birthCertStatus: docStatusFor(uploadedUrls.birthCert),
        fatherKtpUrl: uploadedUrls.fatherKtp?.url || '',
        fatherKtpName: uploadedUrls.fatherKtp?.name || '',
        fatherKtpStatus: docStatusFor(uploadedUrls.fatherKtp),
        motherKtpUrl: uploadedUrls.motherKtp?.url || '',
        motherKtpName: uploadedUrls.motherKtp?.name || '',
        motherKtpStatus: docStatusFor(uploadedUrls.motherKtp),
        childPhotoUrl: uploadedUrls.childPhoto?.url || '',
        childPhotoName: uploadedUrls.childPhoto?.name || '',
        childPhotoStatus: docStatusFor(uploadedUrls.childPhoto),
        orphanCertUrl: uploadedUrls.orphanCert?.url || '',
        orphanCertName: uploadedUrls.orphanCert?.name || '',
        orphanCertStatus: docStatusFor(uploadedUrls.orphanCert),
        tahfidzCertUrl: uploadedUrls.tahfidzCert?.url || '',
        tahfidzCertName: uploadedUrls.tahfidzCert?.name || '',
        tahfidzCertStatus: docStatusFor(uploadedUrls.tahfidzCert),
        documentNote: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const paymentsDoc = {
        registrationId,
        program: draft.program,
        paymentPlan: draft.paymentPlan,
        paymentMethod: draft.paymentMethod,
        paymentStatus: initialPaymentStatus,
        paymentDate: clampStr(draft.paymentDate, 20),
        paymentAmount: parsedAmount,
        proofUrl: uploadedUrls.paymentProof?.url || '',
        proofName: uploadedUrls.paymentProof?.name || '',
        paymentNote: clampStr(draft.paymentNote, FIELD_LIMITS.paymentNote),
        verifiedByUid: '',
        verifiedByEmail: '',
        treasurerNote: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const consentsDoc = {
        registrationId,
        dataTruthAgreed: Boolean(draft.dataTruthAgreed),
        schoolRulesAgreed: Boolean(draft.schoolRulesAgreed),
        administrationPaymentAgreed: Boolean(draft.administrationPaymentAgreed),
        healthUpdateAgreed: Boolean(draft.healthUpdateAgreed),
        dataProcessingAgreed: Boolean(draft.dataProcessingAgreed),
        internalDocumentationAgreed: Boolean(draft.internalDocumentationAgreed),
        publicMediaAgreed: Boolean(draft.publicMediaAgreed),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      tx.set(doc(db, 'ppdb_registrations', registrationId), registrationDoc);
      tx.set(doc(db, 'ppdb_parents', registrationId), parentsDoc);
      tx.set(doc(db, 'ppdb_guardians', registrationId), guardiansDoc);
      tx.set(doc(db, 'ppdb_health', registrationId), healthDoc);
      tx.set(doc(db, 'ppdb_documents', registrationId), documentsDoc);
      tx.set(doc(db, 'ppdb_payments', registrationId), paymentsDoc);
      tx.set(doc(db, 'ppdb_consents', registrationId), consentsDoc);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `ppdb_registrations/${registrationId}`);
  }

  const submittedAt = new Date();
  return {
    registration: {
      registrationId,
      registrationNumber: generatedRegNumber,
      sequenceNumber: generatedSeq,
      academicYearId: academicYear.id,
      academicYearLabel: academicYear.yearLabel,
      fullName: clampStr(draft.fullName, FIELD_LIMITS.fullName),
      nickname: clampStr(draft.nickname, FIELD_LIMITS.nickname),
      gender: draft.gender,
      nik: sanitizeDigits(draft.nik, 16),
      kkNumber: sanitizeDigits(draft.kkNumber, 16),
      birthPlace: clampStr(draft.birthPlace, FIELD_LIMITS.birthPlace),
      birthDate: draft.birthDate,
      ageYears: age.years,
      ageMonths: age.months,
      religion: clampStr(draft.religion || 'Islam', 30),
      childOrder: Math.max(1, Math.min(20, Number(draft.childOrder) || 1)),
      heightCm: Math.max(30, Math.min(200, Number(draft.heightCm) || 0)),
      weightKg: Math.max(5, Math.min(100, Number(draft.weightKg) || 0)),
      address: clampStr(draft.address, FIELD_LIMITS.address),
      village: clampStr(draft.village, FIELD_LIMITS.village),
      district: clampStr(draft.district, FIELD_LIMITS.district),
      city: clampStr(draft.city, FIELD_LIMITS.city),
      province: clampStr(draft.province, FIELD_LIMITS.province),
      previousSchool: clampStr(draft.previousSchool, FIELD_LIMITS.previousSchool),
      educationDuration: draft.educationDuration,
      program: draft.program,
      scholarshipReason: clampStr(draft.scholarshipReason, FIELD_LIMITS.scholarshipReason),
      scholarshipVerificationAgreed: Boolean(draft.scholarshipVerificationAgreed),
      referralSource: clampStr(draft.referralSource, FIELD_LIMITS.referralSource),
      reasonChoosingSchool: clampStr(draft.reasonChoosingSchool, FIELD_LIMITS.reasonChoosingSchool),
      childInterests: clampStr(draft.childInterests, FIELD_LIMITS.childInterests),
      parentExpectations: clampStr(draft.parentExpectations, FIELD_LIMITS.parentExpectations),
      primaryParentName,
      primaryWhatsapp,
      registrationStatus: 'Terdaftar',
      paymentStatusSummary: initialPaymentStatus,
      verificationNote: '',
      createdAt: submittedAt,
      updatedAt: submittedAt,
    },
    parents: {
      registrationId,
      fatherName: clampStr(draft.fatherName, FIELD_LIMITS.parentName),
      fatherStatus: draft.fatherStatus,
      fatherNik: sanitizeDigits(draft.fatherNik, 16),
      fatherBirthPlaceDate: clampStr(draft.fatherBirthPlaceDate, FIELD_LIMITS.birthPlaceDate),
      fatherEducation: clampStr(draft.fatherEducation, FIELD_LIMITS.education),
      fatherOccupation: clampStr(draft.fatherOccupation, FIELD_LIMITS.occupation),
      fatherWhatsapp: clampStr(draft.fatherWhatsapp, FIELD_LIMITS.phone),
      motherName: clampStr(draft.motherName, FIELD_LIMITS.parentName),
      motherStatus: draft.motherStatus,
      motherNik: sanitizeDigits(draft.motherNik, 16),
      motherBirthPlaceDate: clampStr(draft.motherBirthPlaceDate, FIELD_LIMITS.birthPlaceDate),
      motherEducation: clampStr(draft.motherEducation, FIELD_LIMITS.education),
      motherOccupation: clampStr(draft.motherOccupation, FIELD_LIMITS.occupation),
      motherWhatsapp: clampStr(draft.motherWhatsapp, FIELD_LIMITS.phone),
    },
    guardians: {
      registrationId,
      livesWith: draft.livesWith,
      guardianName: clampStr(draft.guardianName, FIELD_LIMITS.parentName),
      guardianRelation: clampStr(draft.guardianRelation, FIELD_LIMITS.relation),
      guardianWhatsapp: clampStr(draft.guardianWhatsapp, FIELD_LIMITS.phone),
      guardianAddress: clampStr(draft.guardianAddress, FIELD_LIMITS.address),
      emergencyContactName: clampStr(draft.emergencyContactName, FIELD_LIMITS.parentName),
      emergencyContactPhone: clampStr(draft.emergencyContactPhone, FIELD_LIMITS.phone),
    },
    health: {
      registrationId,
      hasDiseaseHistory: Boolean(draft.hasDiseaseHistory),
      diseaseHistoryDetail: clampStr(draft.diseaseHistoryDetail, FIELD_LIMITS.healthDetail),
      hasAllergy: Boolean(draft.hasAllergy),
      allergyDetail: clampStr(draft.allergyDetail, FIELD_LIMITS.healthDetail),
      takesRoutineMedication: Boolean(draft.takesRoutineMedication),
      routineMedicationDetail: clampStr(draft.routineMedicationDetail, FIELD_LIMITS.healthDetail),
      hasSpecialHealthCondition: Boolean(draft.hasSpecialHealthCondition),
      specialHealthConditionDetail: clampStr(draft.specialHealthConditionDetail, FIELD_LIMITS.healthDetail),
      hasSpecialNeeds: Boolean(draft.hasSpecialNeeds),
      specialNeedsDetail: clampStr(draft.specialNeedsDetail, FIELD_LIMITS.healthDetail),
      communicationAbility: clampStr(draft.communicationAbility, FIELD_LIMITS.ability),
      eatingIndependence: clampStr(draft.eatingIndependence, FIELD_LIMITS.ability),
      toiletIndependence: clampStr(draft.toiletIndependence, FIELD_LIMITS.ability),
      socializationAbility: clampStr(draft.socializationAbility, FIELD_LIMITS.ability),
      characterAndDevelopmentNote: clampStr(draft.characterAndDevelopmentNote, FIELD_LIMITS.characterNote),
    },
    documents: {
      registrationId,
      kkUrl: uploadedUrls.kk?.url || '',
      kkName: uploadedUrls.kk?.name || '',
      kkStatus: uploadedUrls.kk?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
      birthCertUrl: uploadedUrls.birthCert?.url || '',
      birthCertName: uploadedUrls.birthCert?.name || '',
      birthCertStatus: uploadedUrls.birthCert?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
      fatherKtpUrl: uploadedUrls.fatherKtp?.url || '',
      fatherKtpName: uploadedUrls.fatherKtp?.name || '',
      fatherKtpStatus: uploadedUrls.fatherKtp?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
      motherKtpUrl: uploadedUrls.motherKtp?.url || '',
      motherKtpName: uploadedUrls.motherKtp?.name || '',
      motherKtpStatus: uploadedUrls.motherKtp?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
      childPhotoUrl: uploadedUrls.childPhoto?.url || '',
      childPhotoName: uploadedUrls.childPhoto?.name || '',
      childPhotoStatus: uploadedUrls.childPhoto?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
      orphanCertUrl: uploadedUrls.orphanCert?.url || '',
      orphanCertName: uploadedUrls.orphanCert?.name || '',
      orphanCertStatus: uploadedUrls.orphanCert?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
      tahfidzCertUrl: uploadedUrls.tahfidzCert?.url || '',
      tahfidzCertName: uploadedUrls.tahfidzCert?.name || '',
      tahfidzCertStatus: uploadedUrls.tahfidzCert?.url ? 'Menunggu Verifikasi' : 'Belum Diunggah',
    },
    payments: {
      registrationId,
      program: draft.program,
      paymentPlan: draft.paymentPlan,
      paymentMethod: draft.paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentDate: draft.paymentDate,
      paymentAmount: parsedAmount,
      proofUrl: uploadedUrls.paymentProof?.url || '',
      proofName: uploadedUrls.paymentProof?.name || '',
      paymentNote: clampStr(draft.paymentNote, FIELD_LIMITS.paymentNote),
    },
    consents: {
      registrationId,
      dataTruthAgreed: Boolean(draft.dataTruthAgreed),
      schoolRulesAgreed: Boolean(draft.schoolRulesAgreed),
      administrationPaymentAgreed: Boolean(draft.administrationPaymentAgreed),
      healthUpdateAgreed: Boolean(draft.healthUpdateAgreed),
      dataProcessingAgreed: Boolean(draft.dataProcessingAgreed),
      internalDocumentationAgreed: Boolean(draft.internalDocumentationAgreed),
      publicMediaAgreed: Boolean(draft.publicMediaAgreed),
    },
  };
}

// --- OTORISASI & OPERASI ADMIN ---

export async function verifyAdminAccess(user: User | null): Promise<{
  authorized: boolean;
  role?: AdminRole;
  reason?: string;
}> {
  if (!user) {
    return { authorized: false, reason: 'Silakan masuk menggunakan akun Google admin.' };
  }
  if (!user.emailVerified || !user.email) {
    return { authorized: false, reason: 'Email Google belum terverifikasi.' };
  }

  const emailLower = user.email.toLowerCase();
  if (emailLower === SCHOOL_INFO.rootAdminEmail) {
    // Sinkronkan dokumen admin utama bila belum ada
    const adminRef = doc(db, 'admins', user.uid);
    try {
      const snap = await getDoc(adminRef);
      if (!snap.exists()) {
        await setDoc(adminRef, {
          uid: user.uid,
          email: emailLower,
          displayName: clampStr(user.displayName || 'Administrator Utama', 120),
          role: 'super_admin',
          active: true,
          addedBy: 'system',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      // Sinkronkan kontak resmi jika dokumen academic_years/2027_2028 masih menyimpan placeholder awal
      const defaultYearRef = doc(db, 'academic_years', DEFAULT_ACADEMIC_YEAR.id);
      const defaultYearSnap = await getDoc(defaultYearRef);
      if (defaultYearSnap.exists()) {
        const yData = defaultYearSnap.data() as Partial<AcademicYearConfig>;
        if (hasLegacyPlaceholderContacts(yData)) {
          await updateDoc(defaultYearRef, {
            schoolPhone: DEFAULT_ACADEMIC_YEAR.schoolPhone,
            schoolWhatsapp: DEFAULT_ACADEMIC_YEAR.schoolWhatsapp,
            schoolEmail: DEFAULT_ACADEMIC_YEAR.schoolEmail,
            schoolAddress: DEFAULT_ACADEMIC_YEAR.schoolAddress,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch {
      // Tetap lanjut karena rootAdminEmail dijamin oleh rules
    }
    return { authorized: true, role: 'super_admin' };
  }

  try {
    const uidSnap = await getDoc(doc(db, 'admins', user.uid));
    if (uidSnap.exists() && uidSnap.data()?.active === true) {
      return { authorized: true, role: uidSnap.data()?.role as AdminRole };
    }

    const emailKeySnap = await getDoc(doc(db, 'admins', emailToKey(emailLower)));
    if (emailKeySnap.exists() && emailKeySnap.data()?.active === true) {
      return { authorized: true, role: emailKeySnap.data()?.role as AdminRole };
    }

    return {
      authorized: false,
      reason: `Akun ${user.email} belum terdaftar sebagai admin PPDB RA Darusyifa Arjawinangun.`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `admins/${user.uid}`);
  }
}

export async function fetchAllRegistrations(): Promise<PpdbRegistrationRecord[]> {
  const path = 'ppdb_registrations';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PpdbRegistrationRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchRegistrationBundle(
  registrationId: string
): Promise<RegistrationFullBundle | null> {
  try {
    const [regSnap, parSnap, guaSnap, heaSnap, docSnap, paySnap, conSnap, verSnap] =
      await Promise.all([
        getDoc(doc(db, 'ppdb_registrations', registrationId)),
        getDoc(doc(db, 'ppdb_parents', registrationId)),
        getDoc(doc(db, 'ppdb_guardians', registrationId)),
        getDoc(doc(db, 'ppdb_health', registrationId)),
        getDoc(doc(db, 'ppdb_documents', registrationId)),
        getDoc(doc(db, 'ppdb_payments', registrationId)),
        getDoc(doc(db, 'ppdb_consents', registrationId)),
        getDocs(
          query(
            collection(db, 'ppdb_verifications'),
            where('registrationId', '==', registrationId)
          )
        ),
      ]);

    if (!regSnap.exists()) return null;

    const logs = verSnap.docs
      .map((d) => d.data() as PpdbVerificationLogRecord)
      .sort((a, b) => {
        const ta = (a.createdAt as { seconds?: number })?.seconds || 0;
        const tb = (b.createdAt as { seconds?: number })?.seconds || 0;
        return tb - ta;
      });

    return {
      registration: regSnap.data() as PpdbRegistrationRecord,
      parents: parSnap.data() as PpdbParentsRecord,
      guardians: guaSnap.data() as PpdbGuardiansRecord,
      health: heaSnap.data() as PpdbHealthRecord,
      documents: docSnap.data() as PpdbDocumentsRecord,
      payments: paySnap.data() as PpdbPaymentsRecord,
      consents: conSnap.data() as PpdbConsentsRecord,
      verifications: logs,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `ppdb_registrations/${registrationId}`);
  }
}

export async function fetchBundlesForExport(
  registrations: PpdbRegistrationRecord[]
): Promise<RegistrationFullBundle[]> {
  if (registrations.length === 0) return [];
  try {
    const [parSnap, guaSnap, heaSnap, docSnap, paySnap, conSnap] = await Promise.all([
      getDocs(collection(db, 'ppdb_parents')),
      getDocs(collection(db, 'ppdb_guardians')),
      getDocs(collection(db, 'ppdb_health')),
      getDocs(collection(db, 'ppdb_documents')),
      getDocs(collection(db, 'ppdb_payments')),
      getDocs(collection(db, 'ppdb_consents')),
    ]);

    const toMap = <T,>(snap: Awaited<ReturnType<typeof getDocs>>): Record<string, T> => {
      const m: Record<string, T> = {};
      snap.forEach((d) => {
        m[d.id] = d.data() as T;
      });
      return m;
    };

    const parentsMap = toMap<PpdbParentsRecord>(parSnap);
    const guardiansMap = toMap<PpdbGuardiansRecord>(guaSnap);
    const healthMap = toMap<PpdbHealthRecord>(heaSnap);
    const docsMap = toMap<PpdbDocumentsRecord>(docSnap);
    const paymentsMap = toMap<PpdbPaymentsRecord>(paySnap);
    const consentsMap = toMap<PpdbConsentsRecord>(conSnap);

    return registrations.map((reg) => ({
      registration: reg,
      parents: parentsMap[reg.registrationId],
      guardians: guardiansMap[reg.registrationId],
      health: healthMap[reg.registrationId],
      documents: docsMap[reg.registrationId],
      payments: paymentsMap[reg.registrationId],
      consents: consentsMap[reg.registrationId],
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ppdb_export_bundles');
  }
}

async function appendVerificationLog(
  batch: ReturnType<typeof writeBatch>,
  params: {
    registrationId: string;
    registrationNumber: string;
    actionType: VerificationActionType;
    previousValue: string;
    newValue: string;
    note: string;
    adminUser: User;
  }
) {
  const verificationId = generateSafeId('ver');
  batch.set(doc(db, 'ppdb_verifications', verificationId), {
    verificationId,
    registrationId: params.registrationId,
    registrationNumber: params.registrationNumber,
    actionType: params.actionType,
    previousValue: clampStr(params.previousValue, 500),
    newValue: clampStr(params.newValue, 500),
    note: clampStr(params.note, 1000),
    adminUid: params.adminUser.uid,
    adminEmail: clampStr(params.adminUser.email || 'admin', 160),
    createdAt: serverTimestamp(),
  });
}

export async function updateRegistrationStatus(
  registration: PpdbRegistrationRecord,
  newStatus: RegistrationStatus,
  note: string,
  adminUser: User
): Promise<void> {
  const path = `ppdb_registrations/${registration.registrationId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'ppdb_registrations', registration.registrationId), {
      registrationStatus: newStatus,
      verificationNote: clampStr(note, FIELD_LIMITS.verificationNote),
      updatedAt: serverTimestamp(),
    });
    appendVerificationLog(batch, {
      registrationId: registration.registrationId,
      registrationNumber: registration.registrationNumber,
      actionType: 'STATUS_CHANGE',
      previousValue: registration.registrationStatus,
      newValue: newStatus,
      note: note || `Status pendaftaran diubah menjadi ${newStatus}`,
      adminUser,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function verifyPaymentByAdmin(
  registration: PpdbRegistrationRecord,
  currentPayment: PpdbPaymentsRecord,
  updates: {
    paymentStatus: PaymentStatus;
    paymentAmount: number;
    paymentDate: string;
    treasurerNote: string;
  },
  adminUser: User
): Promise<void> {
  const path = `ppdb_payments/${registration.registrationId}`;
  try {
    const batch = writeBatch(db);
    // Pembaruan status pembayaran berdiri sendiri, TIDAK mengubah registrationStatus
    batch.update(doc(db, 'ppdb_payments', registration.registrationId), {
      paymentStatus: updates.paymentStatus,
      paymentAmount: Math.max(0, Number(updates.paymentAmount) || 0),
      paymentDate: clampStr(updates.paymentDate, 20),
      treasurerNote: clampStr(updates.treasurerNote, FIELD_LIMITS.treasurerNote),
      verifiedByUid: adminUser.uid,
      verifiedByEmail: clampStr(adminUser.email || '', 160),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'ppdb_registrations', registration.registrationId), {
      paymentStatusSummary: updates.paymentStatus,
      updatedAt: serverTimestamp(),
    });
    appendVerificationLog(batch, {
      registrationId: registration.registrationId,
      registrationNumber: registration.registrationNumber,
      actionType: 'PAYMENT_VERIFICATION',
      previousValue: `${currentPayment.paymentStatus} (${currentPayment.paymentAmount})`,
      newValue: `${updates.paymentStatus} (${updates.paymentAmount})`,
      note: updates.treasurerNote || `Verifikasi pembayaran: ${updates.paymentStatus}`,
      adminUser,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function verifyDocumentsByAdmin(
  registration: PpdbRegistrationRecord,
  updates: Partial<PpdbDocumentsRecord>,
  note: string,
  adminUser: User
): Promise<void> {
  const path = `ppdb_documents/${registration.registrationId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'ppdb_documents', registration.registrationId), {
      ...updates,
      documentNote: clampStr(note, FIELD_LIMITS.documentNote),
      updatedAt: serverTimestamp(),
    });
    appendVerificationLog(batch, {
      registrationId: registration.registrationId,
      registrationNumber: registration.registrationNumber,
      actionType: 'DOCUMENT_VERIFICATION',
      previousValue: 'Status Dokumen Sebelumnya',
      newValue: `KK:${updates.kkStatus || '-'}, Akta:${updates.birthCertStatus || '-'}`,
      note: note || 'Verifikasi kelengkapan dokumen oleh admin',
      adminUser,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveDataCorrectionByAdmin(
  bundle: RegistrationFullBundle,
  correctedRegistration: Partial<PpdbRegistrationRecord>,
  correctedParents: Partial<PpdbParentsRecord>,
  correctionReason: string,
  adminUser: User
): Promise<void> {
  const regId = bundle.registration.registrationId;
  try {
    const batch = writeBatch(db);
    const age = calculateAge(
      correctedRegistration.birthDate || bundle.registration.birthDate
    );

    batch.update(doc(db, 'ppdb_registrations', regId), {
      ...correctedRegistration,
      ageYears: age.years,
      ageMonths: age.months,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'ppdb_parents', regId), {
      ...correctedParents,
      updatedAt: serverTimestamp(),
    });

    const changedSummary = [
      correctedRegistration.fullName && correctedRegistration.fullName !== bundle.registration.fullName
        ? `Nama: ${bundle.registration.fullName} -> ${correctedRegistration.fullName}`
        : null,
      correctedRegistration.nik && correctedRegistration.nik !== bundle.registration.nik
        ? `NIK: ${bundle.registration.nik} -> ${correctedRegistration.nik}`
        : null,
      correctedRegistration.program && correctedRegistration.program !== bundle.registration.program
        ? `Program: ${bundle.registration.program} -> ${correctedRegistration.program}`
        : null,
      correctedParents.fatherName && correctedParents.fatherName !== bundle.parents.fatherName
        ? `Ayah: ${bundle.parents.fatherName} -> ${correctedParents.fatherName}`
        : null,
      correctedParents.motherName && correctedParents.motherName !== bundle.parents.motherName
        ? `Ibu: ${bundle.parents.motherName} -> ${correctedParents.motherName}`
        : null,
    ]
      .filter(Boolean)
      .join('; ');

    appendVerificationLog(batch, {
      registrationId: regId,
      registrationNumber: bundle.registration.registrationNumber,
      actionType: 'DATA_CORRECTION',
      previousValue: bundle.registration.fullName,
      newValue: changedSummary || 'Koreksi data oleh admin',
      note: correctionReason,
      adminUser,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ppdb_registrations/${regId}`);
  }
}

export async function addAdminNoteOnly(
  registration: PpdbRegistrationRecord,
  note: string,
  adminUser: User
): Promise<void> {
  const path = `ppdb_registrations/${registration.registrationId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'ppdb_registrations', registration.registrationId), {
      verificationNote: clampStr(note, FIELD_LIMITS.verificationNote),
      updatedAt: serverTimestamp(),
    });
    appendVerificationLog(batch, {
      registrationId: registration.registrationId,
      registrationNumber: registration.registrationNumber,
      actionType: 'NOTE_ADDED',
      previousValue: registration.verificationNote || '-',
      newValue: clampStr(note, 500),
      note,
      adminUser,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveAcademicYearSettings(
  config: AcademicYearConfig,
  isNew: boolean
): Promise<void> {
  const path = `academic_years/${config.id}`;
  try {
    if (config.isActive) {
      const all = await getDocs(collection(db, 'academic_years'));
      const batch = writeBatch(db);
      all.forEach((d) => {
        if (d.id !== config.id && d.data().isActive) {
          batch.update(d.ref, { isActive: false, updatedAt: serverTimestamp() });
        }
      });
      await batch.commit();
    }

    const payload = {
      yearLabel: clampStr(config.yearLabel, 20),
      yearCode: sanitizeDigits(config.yearCode, 4),
      isActive: Boolean(config.isActive),
      isOpen: Boolean(config.isOpen),
      currentSequence: Math.max(0, Math.floor(config.currentSequence || 0)),
      maxFileSizeMb: Math.max(1, Math.min(15, Math.floor(config.maxFileSizeMb || 5))),
      schoolPhone: clampStr(config.schoolPhone, 30),
      schoolWhatsapp: clampStr(config.schoolWhatsapp, 30),
      schoolEmail: clampStr(config.schoolEmail, 120),
      schoolAddress: clampStr(config.schoolAddress, FIELD_LIMITS.schoolAddress),
      announcementNote: clampStr(config.announcementNote, FIELD_LIMITS.announcementNote),
      updatedAt: serverTimestamp(),
    };

    if (isNew) {
      await setDoc(doc(db, 'academic_years', config.id), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'academic_years', config.id), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllAdmins(): Promise<AdminUserRecord[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AdminUserRecord, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function upsertAdminUser(params: {
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  addedBy: string;
}): Promise<void> {
  const cleanEmail = params.email.trim().toLowerCase();
  const docId = emailToKey(cleanEmail);
  const path = `admins/${docId}`;
  try {
    const existing = await getDoc(doc(db, 'admins', docId));
    if (existing.exists()) {
      await updateDoc(doc(db, 'admins', docId), {
        email: clampStr(cleanEmail, 160),
        displayName: clampStr(params.displayName, 120),
        role: params.role,
        active: Boolean(params.active),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'admins', docId), {
        uid: docId,
        email: clampStr(cleanEmail, 160),
        displayName: clampStr(params.displayName, 120),
        role: params.role,
        active: Boolean(params.active),
        addedBy: clampStr(params.addedBy, 160),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAdminUser(adminId: string): Promise<void> {
  const path = `admins/${adminId}`;
  try {
    await deleteDoc(doc(db, 'admins', adminId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteRegistrationBundle(registrationId: string): Promise<void> {
  const path = `ppdb_registrations/${registrationId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'ppdb_registrations', registrationId));
    batch.delete(doc(db, 'ppdb_parents', registrationId));
    batch.delete(doc(db, 'ppdb_guardians', registrationId));
    batch.delete(doc(db, 'ppdb_health', registrationId));
    batch.delete(doc(db, 'ppdb_documents', registrationId));
    batch.delete(doc(db, 'ppdb_payments', registrationId));
    batch.delete(doc(db, 'ppdb_consents', registrationId));

    const verSnap = await getDocs(
      query(collection(db, 'ppdb_verifications'), where('registrationId', '==', registrationId))
    );
    verSnap.forEach((vDoc) => {
      batch.delete(vDoc.ref);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
