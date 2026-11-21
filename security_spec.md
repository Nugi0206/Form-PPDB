# Spesifikasi Keamanan Firestore — PPDB Online RA Darusyifa Arjawinangun

## 1. Invarian Keamanan Data

1. **Zero Public Read untuk PII**: Pengunjung publik (tidak login) dilarang keras melakukan `get` atau `list` terhadap koleksi `ppdb_registrations`, `ppdb_parents`, `ppdb_guardians`, `ppdb_health`, `ppdb_documents`, `ppdb_payments`, `ppdb_consents`, `ppdb_verifications`, dan `admins`.
2. **Pembuatan Pendaftaran Atomik & Anti-Duplikasi Nomor Registrasi**: Pembuatan dokumen pendaftaran wajib terjadi bersamaan dengan kenaikan `currentSequence` tepat `+1` pada dokumen `academic_years/{yearId}` yang berstatus `isOpen == true`, diverifikasi melalui `getAfter()` dan `existsAfter()`.
3. **Kunci Status Awal Pendaftaran & Pembayaran**: Pendaftaran baru dari orang tua wajib memiliki `registrationStatus == 'Terdaftar'` dan `paymentStatusSummary` / `paymentStatus` hanya boleh `'Belum Bayar'` atau `'Menunggu Verifikasi'` (tidak dapat langsung `'Diterima'` atau `'Lunas'`).
4. **Anti-Shadow-Field & Batas Panjang**: Seluruh koleksi menerapkan `keys().hasAll(...)` dan `keys().hasOnly(...)` serta pemeriksaan tipe dan batas `size()` yang sinkron dengan `firebase-blueprint.json`.
5. **Integritas Timestamp Server**: `createdAt` pada pembuatan dan `updatedAt` pada pembaruan wajib sama dengan `request.time`.
6. **Otorisasi Admin Terverifikasi**: Operasi baca, ubah status, verifikasi pembayaran, verifikasi berkas, dan audit log hanya diizinkan bagi pengguna Google Auth dengan `email_verified == true` yang cocok dengan admin utama atau terdaftar aktif pada koleksi `admins`. Tidak ada registrasi admin publik.
7. **Immortal Fields**: `registrationId`, `registrationNumber`, `sequenceNumber`, `academicYearId`, dan `createdAt` tidak dapat diubah setelah dibuat.

## 2. The "Dirty Dozen" Adversarial Test Payloads

1. **Public Scrape Attack**: Pengguna anonim mencoba `list` pada `/ppdb_registrations` -> **PERMISSION_DENIED**.
2. **Unverified Admin Email Spoof**: Pengguna dengan `email_verified: false` mencoba membaca `/ppdb_registrations` -> **PERMISSION_DENIED**.
3. **Privilege Escalation via Registration**: Orang tua mengirim payload pendaftaran dengan menambahkan field tersembunyi `isAdmin: true` -> **PERMISSION_DENIED** (`hasOnly` menolak field asing).
4. **Auto-Accept Bypass**: Orang tua mengirim payload `ppdb_registrations` dengan `registrationStatus: "Diterima"` -> **PERMISSION_DENIED**.
5. **Auto-Paid Bypass**: Orang tua mengirim payload `ppdb_payments` dengan `paymentStatus: "Lunas"` -> **PERMISSION_DENIED**.
6. **Orphaned Sub-Record**: Orang tua mengirim dokumen ke `/ppdb_parents/reg_fake` tanpa membuat `/ppdb_registrations/reg_fake` -> **PERMISSION_DENIED** (`existsAfter` gagal).
7. **Sequence Skipping / Hijacking**: Orang tua menaikkan `academic_years/2027_2028.currentSequence` sebanyak `+10` atau menurunkan `-1` -> **PERMISSION_DENIED**.
8. **ID Poisoning**: Penyerang mencoba membuat dokumen `/ppdb_registrations/../../admins/evil` atau ID > 128 karakter -> **PERMISSION_DENIED** (`isValidId` gagal).
9. **Client Timestamp Spoofing**: Pengirim memalsukan `createdAt` menjadi tahun 2020 -> **PERMISSION_DENIED** (`createdAt == request.time`).
10. **Public Admin Self-Signup**: Pengguna non-admin mencoba menulis dokumen ke `/admins/{uid}` -> **PERMISSION_DENIED**.
11. **Oversized String Denial-of-Wallet**: Pengirim menyisipkan teks 50KB pada kolom `address` atau `scholarshipReason` -> **PERMISSION_DENIED** (`.size()` melebihi batas blueprint).
12. **Immutable Field Tampering**: Admin atau penyerang mencoba mengubah `registrationNumber` atau `createdAt` pada dokumen yang sudah ada -> **PERMISSION_DENIED**.
