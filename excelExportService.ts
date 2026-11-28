import ExcelJS from 'exceljs';
import { formatIndonesianDate, toDateObject } from '../lib/utils';
import { RegistrationFullBundle } from '../types/ppdb';

function styleWorksheet(
  sheet: ExcelJS.Worksheet,
  headers: string[],
  rows: (string | number | Date | null | undefined)[][],
  currencyCols: number[] = [],
  dateCols: number[] = []
) {
  const headerRow = sheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF15803D' }, // Hijau tua profesional
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF14532D' } },
      left: { style: 'thin', color: { argb: 'FF14532D' } },
      bottom: { style: 'medium', color: { argb: 'FF14532D' } },
      right: { style: 'thin', color: { argb: 'FF14532D' } },
    };
  });

  rows.forEach((rowValues, rowIdx) => {
    const row = sheet.addRow(
      rowValues.map((v) => (v === undefined || v === null ? '-' : v))
    );
    row.height = 22;

    row.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Calibri',
        size: 10.5,
        color: { argb: 'FF1E293B' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowIdx % 2 === 1 ? 'FFF8FAF9' : 'FFFFFFFF' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };

      if (currencyCols.includes(colNumber)) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (dateCols.includes(colNumber)) {
        cell.numFmt = 'dd/mm/yyyy';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  // Freeze baris header
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-filter
  if (headers.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: headers.length },
    };
  }

  // Lebar kolom menyesuaikan isi
  sheet.columns.forEach((column, idx) => {
    let maxLen = (headers[idx] || '').length + 4;
    rows.forEach((r) => {
      const val = r[idx];
      const str =
        val instanceof Date
          ? '20 November 2027'
          : val !== null && val !== undefined
            ? String(val)
            : '';
      maxLen = Math.max(maxLen, Math.min(48, str.length + 4));
    });
    column.width = Math.max(14, maxLen);
  });
}

export async function exportPpdbWorkbook(
  bundles: RegistrationFullBundle[],
  academicYearLabel: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RA Darusyifa Arjawinangun';
  workbook.created = new Date();

  // 1. REKAP PENDAFTAR
  const sRekap = workbook.addWorksheet('REKAP PENDAFTAR');
  styleWorksheet(
    sRekap,
    [
      'Nomor Pendaftaran',
      'Tanggal Pendaftaran',
      'Tahun Pelajaran',
      'Nama Anak',
      'Jenis Kelamin',
      'Tanggal Lahir',
      'Usia',
      'Program Pendidikan',
      'Status Pendaftaran',
      'Status Pembayaran',
    ],
    bundles.map((b) => [
      b.registration.registrationNumber,
      toDateObject(b.registration.createdAt) || formatIndonesianDate(b.registration.createdAt),
      b.registration.academicYearLabel,
      b.registration.fullName,
      b.registration.gender,
      formatIndonesianDate(b.registration.birthDate),
      `${b.registration.ageYears} thn ${b.registration.ageMonths} bln`,
      b.registration.program,
      b.registration.registrationStatus,
      b.registration.paymentStatusSummary,
    ]),
    [],
    [2]
  );

  // 2. DATA SISWA
  const sSiswa = workbook.addWorksheet('DATA SISWA');
  styleWorksheet(
    sSiswa,
    [
      'Nomor Pendaftaran',
      'Nama Lengkap',
      'Nama Panggilan',
      'Jenis Kelamin',
      'NIK Anak',
      'Nomor KK',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Usia',
      'Agama',
      'Anak Ke',
      'Tinggi (cm)',
      'Berat (kg)',
      'Alamat Lengkap',
      'Desa/Kelurahan',
      'Kecamatan',
      'Kabupaten/Kota',
      'Provinsi',
      'Asal Sekolah',
      'Lama Pendidikan',
    ],
    bundles.map((b) => [
      b.registration.registrationNumber,
      b.registration.fullName,
      b.registration.nickname,
      b.registration.gender,
      b.registration.nik,
      b.registration.kkNumber,
      b.registration.birthPlace,
      formatIndonesianDate(b.registration.birthDate),
      `${b.registration.ageYears} tahun ${b.registration.ageMonths} bulan`,
      b.registration.religion,
      b.registration.childOrder,
      b.registration.heightCm,
      b.registration.weightKg,
      b.registration.address,
      b.registration.village,
      b.registration.district,
      b.registration.city,
      b.registration.province,
      b.registration.previousSchool || '-',
      b.registration.educationDuration,
    ])
  );

  // 3. DATA ORANG TUA
  const sOrtu = workbook.addWorksheet('DATA ORANG TUA');
  styleWorksheet(
    sOrtu,
    [
      'Nomor Pendaftaran',
      'Nama Anak',
      'Nama Ayah',
      'Status Ayah',
      'NIK Ayah',
      'TTL Ayah',
      'Pendidikan Ayah',
      'Pekerjaan Ayah',
      'WhatsApp Ayah',
      'Nama Ibu',
      'Status Ibu',
      'NIK Ibu',
      'TTL Ibu',
      'Pendidikan Ibu',
      'Pekerjaan Ibu',
      'WhatsApp Ibu',
    ],
    bundles.map((b) => [
      b.registration.registrationNumber,
      b.registration.fullName,
      b.parents?.fatherName || '-',
      b.parents?.fatherStatus || '-',
      b.parents?.fatherNik || '-',
      b.parents?.fatherBirthPlaceDate || '-',
      b.parents?.fatherEducation || '-',
      b.parents?.fatherOccupation || '-',
      b.parents?.fatherWhatsapp || '-',
      b.parents?.motherName || '-',
      b.parents?.motherStatus || '-',
      b.parents?.motherNik || '-',
      b.parents?.motherBirthPlaceDate || '-',
      b.parents?.motherEducation || '-',
      b.parents?.motherOccupation || '-',
      b.parents?.motherWhatsapp || '-',
    ])
  );

  // 4. DATA WALI
  const sWali = workbook.addWorksheet('DATA WALI');
  styleWorksheet(
    sWali,
    [
      'Nomor Pendaftaran',
      'Nama Anak',
      'Tinggal Bersama',
      'Nama Wali',
      'Hubungan dengan Anak',
      'WhatsApp Wali',
      'Alamat Wali',
      'Nama Kontak Darurat',
      'Nomor Kontak Darurat',
    ],
    bundles.map((b) => [
      b.registration.registrationNumber,
      b.registration.fullName,
      b.guardians?.livesWith || '-',
      b.guardians?.guardianName || '-',
      b.guardians?.guardianRelation || '-',
      b.guardians?.guardianWhatsapp || '-',
      b.guardians?.guardianAddress || '-',
      b.guardians?.emergencyContactName || '-',
      b.guardians?.emergencyContactPhone || '-',
    ])
  );

  // 5. KESEHATAN DAN PERKEMBANGAN
  const sKesehatan = workbook.addWorksheet('KESEHATAN DAN PERKEMBANGAN');
  styleWorksheet(
    sKesehatan,
    [
      'Nomor Pendaftaran',
      'Nama Anak',
      'Riwayat Penyakit',
      'Alergi',
      'Obat Rutin',
      'Kondisi Kesehatan Khusus',
      'Kebutuhan Khusus',
      'Kemampuan Komunikasi',
      'Kemandirian Makan',
      'Kemandirian Toilet',
      'Kemampuan Sosialisasi',
      'Catatan Karakter Anak',
    ],
    bundles.map((b) => [
      b.registration.registrationNumber,
      b.registration.fullName,
      b.health?.hasDiseaseHistory ? `Ya (${b.health.diseaseHistoryDetail || '-'})` : 'Tidak',
      b.health?.hasAllergy ? `Ya (${b.health.allergyDetail || '-'})` : 'Tidak',
      b.health?.takesRoutineMedication ? `Ya (${b.health.routineMedicationDetail || '-'})` : 'Tidak',
      b.health?.hasSpecialHealthCondition
        ? `Ya (${b.health.specialHealthConditionDetail || '-'})`
        : 'Tidak',
      b.health?.hasSpecialNeeds ? `Ya (${b.health.specialNeedsDetail || '-'})` : 'Tidak',
      b.health?.communicationAbility || '-',
      b.health?.eatingIndependence || '-',
      b.health?.toiletIndependence || '-',
      b.health?.socializationAbility || '-',
      b.health?.characterAndDevelopmentNote || '-',
    ])
  );

  // 6. DOKUMEN
  const sDokumen = workbook.addWorksheet('DOKUMEN');
  styleWorksheet(
    sDokumen,
    [
      'Nomor Pendaftaran',
      'Nama Anak',
      'Program',
      'Status KK',
      'Status Akta Kelahiran',
      'Status KTP Ayah',
      'Status KTP Ibu',
      'Status Foto Anak',
      'Status Surat Yatim/Piatu',
      'Status Sertifikat Tahfidz',
      'Kelengkapan Wajib',
      'Catatan Berkas',
    ],
    bundles.map((b) => {
      const hasMandatory =
        Boolean(b.documents?.kkUrl) && Boolean(b.documents?.birthCertUrl);
      return [
        b.registration.registrationNumber,
        b.registration.fullName,
        b.registration.program,
        b.documents?.kkStatus || 'Belum Diunggah',
        b.documents?.birthCertStatus || 'Belum Diunggah',
        b.documents?.fatherKtpStatus || 'Belum Diunggah',
        b.documents?.motherKtpStatus || 'Belum Diunggah',
        b.documents?.childPhotoStatus || 'Belum Diunggah',
        b.documents?.orphanCertStatus || 'Belum Diunggah',
        b.documents?.tahfidzCertStatus || 'Belum Diunggah',
        hasMandatory ? 'KK & Akta Terunggah' : 'Belum Lengkap',
        b.documents?.documentNote || '-',
      ];
    })
  );

  // 7. PEMBAYARAN
  const sPembayaran = workbook.addWorksheet('PEMBAYARAN');
  styleWorksheet(
    sPembayaran,
    [
      'Nomor Pendaftaran',
      'Nama Anak',
      'Program Pendidikan',
      'Rencana Pembayaran',
      'Metode Pembayaran',
      'Jumlah Pembayaran',
      'Tanggal Pembayaran',
      'Status Pembayaran',
      'Diverifikasi Oleh',
      'Catatan Bendahara',
    ],
    bundles.map((b) => [
      b.registration.registrationNumber,
      b.registration.fullName,
      b.payments?.program || b.registration.program,
      b.payments?.paymentPlan || '-',
      b.payments?.paymentMethod || '-',
      b.payments?.paymentAmount ?? 0,
      b.payments?.paymentDate ? formatIndonesianDate(b.payments.paymentDate) : '-',
      b.payments?.paymentStatus || b.registration.paymentStatusSummary,
      b.payments?.verifiedByEmail || '-',
      b.payments?.treasurerNote || '-',
    ]),
    [6]
  );

  // 8. REKAP BEASISWA
  const scholarshipBundles = bundles.filter((b) =>
    b.registration.program.toLowerCase().includes('beasiswa')
  );
  const sBeasiswa = workbook.addWorksheet('REKAP BEASISWA');
  styleWorksheet(
    sBeasiswa,
    [
      'Nomor Pendaftaran',
      'Nama Siswa',
      'Jenis Beasiswa',
      'Alasan Pengajuan',
      'Kelengkapan Persyaratan',
      'Status Verifikasi Dokumen',
      'Status Pendaftaran',
    ],
    scholarshipBundles.map((b) => {
      const isYatim = b.registration.program.includes('Yatim');
      const isTahfidz = b.registration.program.includes('Tahfidz');
      const hasDoc = isYatim
        ? Boolean(b.documents?.orphanCertUrl)
        : isTahfidz
          ? Boolean(b.documents?.tahfidzCertUrl)
          : false;
      const docStatus = isYatim
        ? b.documents?.orphanCertStatus || 'Belum Diunggah'
        : isTahfidz
          ? b.documents?.tahfidzCertStatus || 'Belum Diunggah'
          : '-';
      return [
        b.registration.registrationNumber,
        b.registration.fullName,
        b.registration.program,
        b.registration.scholarshipReason || '-',
        hasDoc ? 'Lengkap (Terunggah)' : 'Belum Lengkap',
        docStatus,
        b.registration.registrationStatus,
      ];
    })
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeYear = academicYearLabel.replace(/[^0-9a-zA-Z]/g, '-');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Rekap-PPDB-RA-Darusyifa-${safeYear}-${dateStamp}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
