import { Printer, X } from 'lucide-react';
import { AcademicYearConfig, SCHOOL_INFO } from '../types/ppdb';
import { BrandMark } from './BrandMark';

interface BlankRegularFormPrintProps {
  academicYear: AcademicYearConfig;
  onClose: () => void;
}

export function BlankRegularFormPrint({ academicYear, onClose }: BlankRegularFormPrintProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Top action bar (no print) */}
      <div className="no-print sticky top-0 z-20 bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm font-bold">Pratinjau Cetak: Formulir Pendaftaran Reguler Kosong</p>
          <p className="text-xs text-slate-400">Siap dicetak atau disimpan sebagai PDF untuk pengisian manual.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
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

      {/* Printable Form Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white text-slate-900 text-xs space-y-6 print:p-0 print:max-w-none">
        {/* Kop Surat */}
        <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-4">
          <div className="flex items-center gap-3">
            <BrandMark size="md" />
            <div>
              <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                YAYASAN / LEMBAGA PENDIDIKAN ISLAM
              </p>
              <h1 className="font-display text-lg font-bold text-slate-900">{SCHOOL_INFO.name}</h1>
              <p className="text-[11px] text-slate-600">{SCHOOL_INFO.tagline}</p>
              <p className="text-[10px] text-slate-500">{academicYear.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right border border-slate-300 p-2.5 rounded-lg bg-slate-50/50 w-52">
            <p className="text-[10px] text-slate-500 uppercase font-bold">No. Pendaftaran</p>
            <p className="font-mono text-sm font-bold text-emerald-900 mt-1">PPDB-2027-____</p>
            <p className="text-[10px] text-slate-500 mt-0.5">TP {academicYear.yearLabel}</p>
          </div>
        </div>

        <div className="text-center my-4">
          <h2 className="font-display text-base font-bold underline underline-offset-4">
            FORMULIR PENDAFTARAN PESERTA DIDIK BARU (PPDB)
          </h2>
          <p className="text-xs font-semibold text-emerald-800 mt-1">
            PROGRAM PENDIDIKAN: REGULER — TAHUN PELAJARAN {academicYear.yearLabel}
          </p>
        </div>

        {/* 1. Identitas Anak */}
        <BlankSection title="1. Identitas Calon Peserta Didik">
          <BlankRow label="Nama Lengkap Anak" />
          <BlankRow label="Nama Panggilan" />
          <BlankRow label="Jenis Kelamin" type="checkbox" options={['Laki-laki', 'Perempuan']} />
          <BlankRow label="NIK (16 Digit Sesuai KK/Akta)" />
          <BlankRow label="Nomor Kartu Keluarga (KK)" />
          <BlankRow label="Tempat, Tanggal Lahir" />
          <BlankRow label="Agama / Anak ke- / Jumlah Saudara" />
          <BlankRow label="Tinggi Badan (cm) / Berat Badan (kg)" />
          <BlankRow label="Alamat Tempat Tinggal (Jalan, RT/RW)" />
          <BlankRow label="Desa/Kelurahan, Kecamatan, Kabupaten/Kota" />
          <BlankRow label="Asal Sekolah Sebelumnya (Jika ada) / Lama Pendidikan" />
        </BlankSection>

        {/* 2. Data Orang Tua */}
        <BlankSection title="2. Data Orang Tua Kandung">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-bold text-emerald-900 border-b border-emerald-200 pb-1">A. Data Ayah</p>
              <BlankRow label="Nama Lengkap Ayah" />
              <BlankRow label="Status" type="checkbox" options={['Masih Hidup', 'Meninggal']} />
              <BlankRow label="NIK Ayah" />
              <BlankRow label="Tempat, Tgl Lahir Ayah" />
              <BlankRow label="Pendidikan Terakhir" />
              <BlankRow label="Pekerjaan Utama" />
              <BlankRow label="No. WhatsApp / HP" />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-emerald-900 border-b border-emerald-200 pb-1">B. Data Ibu</p>
              <BlankRow label="Nama Lengkap Ibu" />
              <BlankRow label="Status" type="checkbox" options={['Masih Hidup', 'Meninggal']} />
              <BlankRow label="NIK Ibu" />
              <BlankRow label="Tempat, Tgl Lahir Ibu" />
              <BlankRow label="Pendidikan Terakhir" />
              <BlankRow label="Pekerjaan Utama" />
              <BlankRow label="No. WhatsApp / HP" />
            </div>
          </div>
        </BlankSection>

        {/* 3. Wali & Darurat */}
        <BlankSection title="3. Data Wali & Kontak Darurat">
          <BlankRow label="Anak Tinggal Bersama" type="checkbox" options={['Ayah & Ibu', 'Ayah', 'Ibu', 'Wali', 'Lainnya']} />
          <BlankRow label="Nama Wali (Jika diasumsikan oleh wali)" />
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
          <div className="p-2.5 rounded border border-slate-300 bg-slate-50 text-[11px] space-y-1">
            <p className="font-bold text-emerald-900">Rekening Pembayaran Resmi:</p>
            <p className="font-mono">Bank BRI No. Rek: 415001003649509 a.n. GIAN DWI WAHYUNI</p>
          </div>
        </BlankSection>

        {/* 6. Pernyataan & Tanda Tangan */}
        <BlankSection title="6. Pernyataan Kebenaran Data & Tanda Tangan">
          <p className="text-[11px] text-slate-700 leading-relaxed mb-4">
            Dengan mengisi dan menyerahkan formulir ini, saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah. Saya bersedia mematuhi seluruh peraturan tata tertib yang berlaku di <strong>{SCHOOL_INFO.name}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center space-y-12">
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala / Panitia PPDB</p>
              <div className="pt-4 border-b border-slate-400 w-48 mx-auto" />
              <p className="text-[10px] text-slate-500">( Nama & Stempel )</p>
            </div>
            <div className="text-center space-y-12">
              <p>Arjawinangun, .................................... 2027</p>
              <p className="font-semibold">Orang Tua / Wali Murid</p>
              <div className="pt-4 border-b border-slate-400 w-48 mx-auto" />
              <p className="text-[10px] text-slate-500">( Tanda Tangan & Nama Terang )</p>
            </div>
          </div>
        </BlankSection>

        <div className="text-center text-[10px] text-slate-500 pt-6 border-t border-slate-200">
          <p>{SCHOOL_INFO.name} · {academicYear.schoolAddress} · Telp/WA: {academicYear.schoolPhone}</p>
        </div>
      </div>
    </div>
  );
}

function BlankSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-300 rounded-lg p-4 space-y-2 print-break-inside-avoid">
      <h3 className="font-display font-bold text-emerald-900 border-b border-slate-200 pb-1 text-xs uppercase">
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-slate-100">
      <span className="text-slate-700 font-medium w-64 shrink-0">{label}:</span>
      {type === 'checkbox' && options ? (
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {options.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-1.5 text-slate-700 font-normal cursor-pointer">
              <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs inline-block" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : value ? (
        <span className="flex-1 font-semibold text-emerald-900">{value}</span>
      ) : (
        <div className="flex-1 border-b border-dotted border-slate-400 min-h-[18px]" />
      )}
    </div>
  );
}
