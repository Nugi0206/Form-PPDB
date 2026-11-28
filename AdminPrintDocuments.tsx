import { formatIndonesianDate, formatRupiah } from '../lib/utils';
import { AcademicYearConfig, RegistrationFullBundle, SCHOOL_INFO } from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface AdminPrintDocumentsProps {
  bundle: RegistrationFullBundle;
  academicYear: AcademicYearConfig;
  mode: 'form' | 'acceptance';
}

export function AdminPrintDocuments({
  bundle,
  academicYear,
  mode,
}: AdminPrintDocumentsProps) {
  const { registration, parents, guardians, health, documents, payments, consents } = bundle;

  if (mode === 'acceptance') {
    return (
      <div className="bg-white text-slate-900 p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 pb-5 border-b-2 border-emerald-900">
          <div className="flex items-center gap-4">
            <BrandMark size="lg" />
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                YAYASAN / LEMBAGA PENDIDIKAN ISLAM
              </p>
              <h1 className="font-display text-xl font-bold text-slate-900">{SCHOOL_INFO.name}</h1>
              <p className="text-xs text-slate-600">{SCHOOL_INFO.tagline}</p>
              <p className="text-xs text-slate-500">{academicYear.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-slate-500">Nomor Pendaftaran</p>
            <p className="font-mono font-bold text-base text-emerald-900 tabular-nums">
              {registration.registrationNumber}
            </p>
          </div>
        </div>

        <div className="my-8 text-center">
          <h2 className="font-display text-xl font-bold underline underline-offset-4">
            SURAT BUKTI PENERIMAAN PESERTA DIDIK BARU
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Tahun Pelajaran {registration.academicYearLabel}
          </p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Berdasarkan hasil verifikasi berkas administrasi dan keputusan Panitia Penerimaan Peserta Didik Baru (PPDB) <strong>{SCHOOL_INFO.name}</strong>, dengan ini menerangkan bahwa:
          </p>

          <div className="p-5 rounded-xl border border-slate-300 bg-slate-50/50 space-y-2.5">
            <PrintRow label="Nomor Pendaftaran" value={registration.registrationNumber} mono />
            <PrintRow label="Nama Lengkap Anak" value={registration.fullName} />
            <PrintRow label="Jenis Kelamin" value={registration.gender} />
            <PrintRow
              label="Tempat, Tanggal Lahir"
              value={`${registration.birthPlace}, ${formatIndonesianDate(registration.birthDate)}`}
            />
            <PrintRow label="Nama Orang Tua (Ayah / Ibu)" value={`${parents?.fatherName || '-'} / ${parents?.motherName || '-'}`} />
            <PrintRow label="Program Pendidikan" value={registration.program} />
            <PrintRow label="Lama Pendidikan" value={registration.educationDuration} />
            <PrintRow label="Status Penerimaan" value="DITERIMA SEBAGAI PESERTA DIDIK BARU" />
            <PrintRow label="Status Pembayaran" value={payments?.paymentStatus || registration.paymentStatusSummary} />
          </div>

          <p>
            Demikian surat bukti penerimaan ini diterbitkan untuk dipergunakan sebagaimana mestinya. Orang tua/wali dimohon untuk mengikuti informasi daftar ulang dan masa orientasi peserta didik baru dari pihak sekolah.
          </p>
        </div>

        <div className="mt-12 flex justify-between items-end text-sm">
          <div className="text-xs text-slate-600">
            <p>Kontak Sekolah: {academicYear.schoolPhone}</p>
            <p>Email: {academicYear.schoolEmail}</p>
          </div>
          <div className="text-center">
            <p>Arjawinangun, {formatIndonesianDate(new Date())}</p>
            <p className="font-semibold mt-1">Kepala / Ketua Panitia PPDB</p>
            <p className="mt-16 font-bold underline">{SCHOOL_INFO.name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 p-6 max-w-4xl mx-auto text-xs space-y-5">
      {/* Kop */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-emerald-900">
        <div className="flex items-center gap-3">
          <BrandMark size="md" />
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">
              FORMULIR PENDAFTARAN PESERTA DIDIK BARU
            </h1>
            <p className="text-xs text-slate-600">
              {SCHOOL_INFO.name} · {SCHOOL_INFO.tagline} · TP {registration.academicYearLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-sm text-emerald-900 tabular-nums">
            {registration.registrationNumber}
          </p>
          <p className="text-[11px] text-slate-500">
            Tgl Daftar: {formatIndonesianDate(registration.createdAt, true)}
          </p>
        </div>
      </div>

      {/* 1. Identitas */}
      <Section title="1. Identitas Calon Peserta Didik">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <PrintRow label="Nama Lengkap" value={registration.fullName} />
          <PrintRow label="Nama Panggilan" value={registration.nickname} />
          <PrintRow label="Jenis Kelamin" value={registration.gender} />
          <PrintRow label="Agama" value={registration.religion} />
          <PrintRow label="NIK Anak" value={registration.nik} mono />
          <PrintRow label="Nomor KK" value={registration.kkNumber} mono />
          <PrintRow
            label="Tempat, Tanggal Lahir"
            value={`${registration.birthPlace}, ${formatIndonesianDate(registration.birthDate)}`}
          />
          <PrintRow
            label="Usia Saat Daftar"
            value={`${registration.ageYears} tahun ${registration.ageMonths} bulan`}
          />
          <PrintRow label="Anak Ke" value={String(registration.childOrder)} />
          <PrintRow
            label="Tinggi / Berat"
            value={`${registration.heightCm} cm / ${registration.weightKg} kg`}
          />
          <PrintRow
            label="Alamat Lengkap"
            value={`${registration.address}, Ds. ${registration.village}, Kec. ${registration.district}, ${registration.city}, ${registration.province}`}
          />
          <PrintRow label="Asal Sekolah" value={registration.previousSchool || '-'} />
          <PrintRow label="Lama Pendidikan" value={registration.educationDuration} />
        </div>
      </Section>

      {/* 2. Orang Tua */}
      <Section title="2. Data Ayah dan Ibu">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <PrintRow label="Nama Ayah" value={`${parents?.fatherName || '-'} (${parents?.fatherStatus || '-'})`} />
          <PrintRow label="Nama Ibu" value={`${parents?.motherName || '-'} (${parents?.motherStatus || '-'})`} />
          <PrintRow label="NIK Ayah" value={parents?.fatherNik || '-'} mono />
          <PrintRow label="NIK Ibu" value={parents?.motherNik || '-'} mono />
          <PrintRow label="TTL Ayah" value={parents?.fatherBirthPlaceDate || '-'} />
          <PrintRow label="TTL Ibu" value={parents?.motherBirthPlaceDate || '-'} />
          <PrintRow label="Pendidikan / Pekerjaan Ayah" value={`${parents?.fatherEducation || '-'} / ${parents?.fatherOccupation || '-'}`} />
          <PrintRow label="Pendidikan / Pekerjaan Ibu" value={`${parents?.motherEducation || '-'} / ${parents?.motherOccupation || '-'}`} />
          <PrintRow label="WhatsApp Ayah" value={parents?.fatherWhatsapp || '-'} mono />
          <PrintRow label="WhatsApp Ibu" value={parents?.motherWhatsapp || '-'} mono />
        </div>
      </Section>

      {/* 3. Wali & Darurat */}
      <Section title="3. Data Wali dan Kontak Darurat">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <PrintRow label="Tinggal Bersama" value={guardians?.livesWith || '-'} />
          <PrintRow label="Kontak Darurat" value={`${guardians?.emergencyContactName || '-'} (${guardians?.emergencyContactPhone || '-'})`} />
          <PrintRow label="Nama & Hubungan Wali" value={`${guardians?.guardianName || '-'} (${guardians?.guardianRelation || '-'})`} />
          <PrintRow label="WhatsApp & Alamat Wali" value={`${guardians?.guardianWhatsapp || '-'} · ${guardians?.guardianAddress || '-'}`} />
        </div>
      </Section>

      {/* 4. Kesehatan */}
      <Section title="4. Riwayat Kesehatan dan Perkembangan">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <PrintRow label="Riwayat Penyakit" value={health?.hasDiseaseHistory ? `Ya: ${health.diseaseHistoryDetail}` : 'Tidak'} />
          <PrintRow label="Alergi" value={health?.hasAllergy ? `Ya: ${health.allergyDetail}` : 'Tidak'} />
          <PrintRow label="Obat Rutin" value={health?.takesRoutineMedication ? `Ya: ${health.routineMedicationDetail}` : 'Tidak'} />
          <PrintRow label="Kondisi / Kebutuhan Khusus" value={`${health?.hasSpecialHealthCondition ? health.specialHealthConditionDetail : 'Tidak'} / ${health?.hasSpecialNeeds ? health.specialNeedsDetail : 'Tidak'}`} />
          <PrintRow label="Komunikasi" value={health?.communicationAbility || '-'} />
          <PrintRow label="Makan & Toilet" value={`${health?.eatingIndependence || '-'} · ${health?.toiletIndependence || '-'}`} />
          <PrintRow label="Sosialisasi" value={health?.socializationAbility || '-'} />
          <PrintRow label="Catatan Karakter" value={health?.characterAndDevelopmentNote || '-'} />
        </div>
      </Section>

      {/* 5 & 6. Program, Dokumen, Pembayaran */}
      <Section title="5 & 6. Program Pendidikan, Dokumen, dan Pembayaran">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <PrintRow label="Program Pendidikan" value={registration.program} />
          <PrintRow label="Status Pendaftaran" value={registration.registrationStatus} />
          <PrintRow label="Rencana / Metode Bayar" value={`${payments?.paymentPlan || '-'} (${payments?.paymentMethod || '-'})`} />
          <PrintRow label="Nominal & Status Bayar" value={`${formatRupiah(payments?.paymentAmount || 0)} · ${payments?.paymentStatus || '-'}`} />
          <PrintRow label="KK & Akta" value={`KK: ${documents?.kkStatus || '-'} · Akta: ${documents?.birthCertStatus || '-'}`} />
          <PrintRow label="KTP & Foto" value={`KTP A: ${documents?.fatherKtpStatus || '-'} · KTP I: ${documents?.motherKtpStatus || '-'} · Foto: ${documents?.childPhotoStatus || '-'}`} />
        </div>
      </Section>

      {/* 7 & 8. Tambahan & Persetujuan */}
      <Section title="7 & 8. Informasi Tambahan dan Persetujuan">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <PrintRow label="Sumber Informasi" value={registration.referralSource || '-'} />
          <PrintRow label="Minat Anak" value={registration.childInterests || '-'} />
          <PrintRow label="Alasan Memilih Sekolah" value={registration.reasonChoosingSchool || '-'} />
          <PrintRow label="Harapan Orang Tua" value={registration.parentExpectations || '-'} />
          <PrintRow label="Persetujuan Wajib (5 Poin)" value={consents?.dataTruthAgreed ? 'Disetujui Lengkap' : 'Belum Lengkap'} />
          <PrintRow
            label="Izin Dokumentasi"
            value={`Internal: ${consents?.internalDocumentationAgreed ? 'Ya' : 'Tidak'} · Publikasi: ${consents?.publicMediaAgreed ? 'Ya' : 'Tidak'}`}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-300 rounded-lg p-3 print-break-inside-avoid">
      <h2 className="font-display font-bold text-emerald-900 border-b border-slate-200 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PrintRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-0.5">
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className={`font-medium text-slate-900 text-right ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}
