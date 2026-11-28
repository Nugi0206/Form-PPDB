import { Printer, X } from 'lucide-react';
import { AcademicYearConfig, SCHOOL_INFO } from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface BlankRegularFormPrintProps {
  academicYear: AcademicYearConfig;
  onClose: () => void;
}

export function BlankRegularFormPrint({ academicYear, onClose }: BlankRegularFormPrintProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:bg-white print:overflow-visible">
      {/* Top action bar (no print) */}
      <div className="no-print sticky top-0 z-30 bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm font-bold">Pratinjau Cetak A4: Formulir Pendaftaran Reguler</p>
          <p className="text-xs text-slate-400">Pastikan ukuran kertas diatur ke A4 pada dialog printer.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Form Content A4 Optimized */}
      <div className="printable-form-area max-w-[210mm] mx-auto my-6 p-8 bg-white text-slate-900 text-[11px] leading-snug space-y-4 shadow-2xl rounded-xl print:shadow-none print:my-0 print:p-0 print:max-w-none">
        {/* Kop Surat */}
        <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-3">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div>
              <p className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wider">
                YAYASAN / LEMBAGA PENDIDIKAN ISLAM
              </p>
              <h1 className="font-display text-base font-bold text-slate-900">{SCHOOL_INFO.name}</h1>
              <p className="text-[10px] text-slate-600">{SCHOOL_INFO.tagline}</p>
              <p className="text-[9px] text-slate-500">{academicYear.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right border border-slate-300 p-2 rounded-lg bg-slate-50/50 w-44">
            <p className="text-[9px] text-slate-500 uppercase font-bold">No. Pendaftaran</p>
            <p className="font-mono text-xs font-bold text-emerald-900 mt-0.5">PPDB-2027-____</p>
            <p className="text-[9px] text-slate-500">TP {academicYear.yearLabel}</p>
          </div>
        </div>

        <div className="text-center my-2">
          <h2 className="font-display text-sm font-bold underline underline-offset-4">
            FORMULIR PENDAFTARAN PESERTA DIDIK BARU (PPDB)
          </h2>
          <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
            PROGRAM PENDIDIKAN: REGULER — TAHUN PELAJARAN {academicYear.yearLabel}
          </p>
        </div>

        {/* 1. Identitas Anak */}
        <BlankSection title="1. Identitas Calon Peserta Didik">
          <BlankRow label="Nama Lengkap Anak (Sesuai Akta)" />
          <BlankRow label="Nama Panggilan" />
          <BlankRow label="Jenis Kelamin" type="checkbox" options={['Laki-laki', 'Perempuan']} />
          <BlankRow label="NIK (16 Digit Sesuai KK/Akta)" />
          <BlankRow label="Nomor Kartu Keluarga (KK)" />
          <BlankRow label="Tempat, Tanggal Lahir" />
          <BlankRow label="Agama / Anak ke- / Jumlah Saudara" />
          <BlankRow label="Tinggi Badan (cm) / Berat Badan (kg)" />
          <BlankRow label="Alamat Tempat Tinggal (Jalan, RT/RW)" />
          <BlankRow label="Desa/Kelurahan, Kecamatan, Kabupaten/Kota" />
          <BlankRow label="Asal TK/PAUD Sebelumnya (Jika ada) / Lama Pendidikan" />
        </BlankSection>

        {/* 2. Data Orang Tua */}
        <BlankSection title="2. Data Orang Tua Kandung">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="font-bold text-emerald-900 border-b border-emerald-200 pb-0.5 text-[10px]">A. Data Ayah</p>
              <BlankRow label="Nama Ayah" />
              <BlankRow label="Status" type="checkbox" options={['Hidup', 'Wafat']} />
              <BlankRow label="NIK Ayah" />
              <BlankRow label="TTL Ayah" />
              <BlankRow label="Pendidikan Terakhir" />
              <BlankRow label="Pekerjaan Utama" />
              <BlankRow label="No. WhatsApp / HP" />
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-emerald-900 border-b border-emerald-200 pb-0.5 text-[10px]">B. Data Ibu</p>
              <BlankRow label="Nama Ibu" />
              <BlankRow label="Status" type="checkbox" options={['Hidup', 'Wafat']} />
              <BlankRow label="NIK Ibu" />
              <BlankRow label="TTL Ibu" />
              <BlankRow label="Pendidikan Terakhir" />
              <BlankRow label="Pekerjaan Utama" />
              <BlankRow label="No. WhatsApp / HP" />
            </div>
          </div>
        </BlankSection>

        {/* 3. Wali & Darurat */}
        <BlankSection title="3. Data Wali & Kontak Darurat">
          <BlankRow label="Anak Tinggal Bersama" type="checkbox" options={['Ayah & Ibu', 'Ayah', 'Ibu', 'Wali', 'Lainnya']} />
          <BlankRow label="Nama Wali (Jika diasuh wali)" />
          <BlankRow label="Hubungan Keluarga & Alamat Wali" />
          <BlankRow label="Kontak Darurat (Nama & No. HP/Telp)" />
        </BlankSection>

        {/* 4. Kesehatan */}
        <BlankSection title="4. Riwayat Kesehatan & Kemandirian Anak">
          <BlankRow label="Riwayat Penyakit / Alergi / Obat Rutin" />
          <BlankRow label="Kebutuhan Khusus / Kondisi Kesehatan" />
          <BlankRow label="Kemampuan Komunikasi & Sosialisasi" />
          <BlankRow label="Kemandirian Makan & Toilet Training" />
        </BlankSection>

        {/* 5. Program & Pembayaran */}
        <BlankSection title="5. Pilihan Program & Administrasi Pembayaran">
          <BlankRow label="Pilihan Program" value="Program Reguler" />
          <BlankRow label="Rencana Pembayaran" type="checkbox" options={['Lunas (Sekaligus)', 'Cicilan 3 Tahap']} />
          <BlankRow label="Metode Pembayaran" type="checkbox" options={['Transfer BRI', 'Tunai ke Bendahara']} />
          <div className="p-2 rounded border border-slate-300 bg-slate-50 text-[10px] space-y-0.5">
            <p className="font-bold text-emerald-900">Rekening Resmi Pembayaran PPDB:</p>
            <p className="font-mono">Bank BRI No. Rek: 415001003649509 a.n. GIAN DWI WAHYUNI</p>
          </div>
        </BlankSection>

        {/* 6. Pernyataan & Tanda Tangan */}
        <BlankSection title="6. Pernyataan Kebenaran Data & Tanda Tangan">
          <p className="text-[10px] text-slate-700 leading-normal mb-3">
            Dengan mengisi dan menyerahkan formulir ini, saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah. Saya bersedia mematuhi seluruh peraturan tata tertib yang berlaku di <strong>{SCHOOL_INFO.name}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="text-center space-y-10">
              <p className="text-[10px]">Mengetahui,<br />Kepala / Panitia PPDB</p>
              <div className="pt-2 border-b border-slate-400 w-40 mx-auto" />
              <p className="text-[9px] text-slate-500">( Nama & Stempel )</p>
            </div>
            <div className="text-center space-y-10">
              <p className="text-[10px]">Arjawinangun, .......................... 2027<br />Orang Tua / Wali Murid</p>
              <div className="pt-2 border-b border-slate-400 w-40 mx-auto" />
              <p className="text-[9px] text-slate-500">( Tanda Tangan & Nama Terang )</p>
            </div>
          </div>
        </BlankSection>

        <div className="text-center text-[9px] text-slate-500 pt-3 border-t border-slate-200">
          <p>{SCHOOL_INFO.name} · {academicYear.schoolAddress} · Telp/WA: {academicYear.schoolPhone}</p>
        </div>
      </div>
    </div>
  );
}

function BlankSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-300 rounded-lg p-3 space-y-1.5 print-break-inside-avoid">
      <h3 className="font-display font-bold text-emerald-900 border-b border-slate-200 pb-0.5 text-[11px] uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BlankRow({
  label,
  type = 'line',
  options,
  value,
}: {
  label: string;
  type?: 'line' | 'checkbox';
  options?: string[];
  value?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-0.5 border-b border-slate-100">
      <span className="text-slate-700 font-medium w-60 shrink-0 text-[10px] sm:text-[11px]">{label}:</span>
      {type === 'checkbox' && options ? (
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {options.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-1.5 text-slate-700 font-normal cursor-pointer text-[10px] sm:text-[11px]">
              <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs inline-block" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : value ? (
        <span className="flex-1 font-semibold text-emerald-900 text-[10px] sm:text-[11px]">{value}</span>
      ) : (
        <div className="flex-1 border-b border-dotted border-slate-400 min-h-[16px]" />
      )}
    </div>
  );
}
