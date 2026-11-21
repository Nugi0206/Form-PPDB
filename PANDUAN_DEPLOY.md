# Panduan Deployment PPDB Online RA Darusyifa Arjawinangun
**Arsitektur:** GitHub (Kode Sumber) → Firebase Pribadi (Auth, Firestore, Storage) → Cloudflare Pages (`*.pages.dev`)

---

## Tahap 1 — Siapkan Project Firebase Pribadi
1. Buka [Firebase Console](https://console.firebase.google.com/) lalu klik **Create a project** (misalnya: `ppdb-ra-darusyifa`).
2. **Aktifkan Authentication (Google Sign-In):**
   - Masuk ke menu **Build → Authentication → Get started**.
   - Pilih tab **Sign-in method** → klik **Google** → aktifkan (*Enable*) → pilih email support `muhamadnugiandri@gmail.com` → **Save**.
3. **Buat Cloud Firestore:**
   - Masuk ke menu **Build → Firestore Database → Create database**.
   - Pilih lokasi region terdekat (disarankan `asia-southeast2` Jakarta atau `asia-southeast1` Singapura).
   - Pilih **Start in production mode** → biarkan nama database default `(default)` → klik **Enable**.
4. **Aktifkan Firebase Storage:**
   - Masuk ke menu **Build → Storage → Get started** → pilih mode production → lokasi sama dengan Firestore → **Done**.
5. **Ambil Konfigurasi Web App (`firebaseConfig`):**
   - Klik ikon roda gigi (Project Settings) → bagian **Your apps** → klik ikon Web **`</>`**.
   - Beri nama app (misal `ppdb-web`) tanpa mencentang Firebase Hosting → klik **Register app**.
   - Catat nilai berikut dari `firebaseConfig`:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

---

## Tahap 2 — Deploy Aturan Keamanan (`firestore.rules` & `storage.rules`) ke Firebase Pribadi
Repositori ini sudah dilengkapi `firebase.json`, `firestore.rules`, dan `storage.rules`. Jalankan perintah berikut di terminal laptop/komputer Anda pada folder project ini:

```bash
# 1. Install Firebase CLI (jika belum punya)
npm install -g firebase-tools

# 2. Login ke akun Google Firebase Anda
firebase login

# 3. Arahkan ke Project ID Firebase pribadi Anda (ganti dengan ID project Anda)
firebase use <PROJECT_ID_FIREBASE_ANDA>

# 4. Deploy aturan Firestore dan Storage
firebase deploy --only firestore:rules,storage
```

> **Penting:** Pastikan email admin utama `muhamadnugiandri@gmail.com` sesuai dengan aturan di `firestore.rules` dan `storage.rules`. Jika ingin mengubah email admin utama sebelum deploy, perbarui juga nilai `rootAdminEmail` di `src/types/ppdb.ts` serta pengecekan email di `firestore.rules` dan `storage.rules`.

---

## Tahap 3 — Upload / Push Kode ke GitHub
1. Buat repositori baru di [GitHub](https://github.com/new) (boleh **Private** maupun **Public**, misal: `ppdb-ra-darusyifa`).
2. Jalankan perintah berikut di folder project:

```bash
git init
git add .
git commit -m "Initial deploy: PPDB Online RA Darusyifa Arjawinangun"
git branch -M main
git remote add origin https://github.com/<USERNAME_GITHUB_ANDA>/<NAMA_REPO>.git
git push -u origin main
```

---

## Tahap 4 — Deploy ke Cloudflare Pages (`*.pages.dev`)
1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) → menu **Workers & Pages** → klik **Create** → pilih tab **Pages** → **Connect to Git**.
2. Pilih repositori GitHub Anda (`ppdb-ra-darusyifa`) lalu klik **Begin setup**.
3. Isi **Build settings**:
   - **Framework preset:** `Vite` (atau `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Buka bagian **Environment variables (for Production)** dan tambahkan variabel berikut dari `firebaseConfig` Tahap 1:
   - `VITE_FIREBASE_API_KEY` = *(isi `apiKey` Anda)*
   - `VITE_FIREBASE_AUTH_DOMAIN` = *(isi `authDomain` Anda)*
   - `VITE_FIREBASE_PROJECT_ID` = *(isi `projectId` Anda)*
   - `VITE_FIREBASE_STORAGE_BUCKET` = *(isi `storageBucket` Anda)*
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = *(isi `messagingSenderId` Anda)*
   - `VITE_FIREBASE_APP_ID` = *(isi `appId` Anda)*
   - *(Opsional)* `NODE_VERSION` = `20`
   - *(Catatan: `VITE_FIREBASE_DATABASE_ID` tidak perlu diisi jika memakai database Firestore standar `(default)`).*
5. Klik **Save and Deploy**. Tunggu proses build selesai hingga mendapatkan alamat subdomain seperti:
   `https://ppdb-ra-darusyifa.pages.dev`

> **Catatan SPA Routing:** File `public/_redirects` (`/* /index.html 200`) sudah disertakan agar membuka `/daftar` dan `/ppdb-admin` secara langsung atau me-refresh halaman tidak memunculkan error 404 di Cloudflare Pages.

---

## Tahap 5 — WAJIB: Daftarkan Subdomain `*.pages.dev` ke Firebase Authorized Domains
Agar tombol **Masuk dengan Google** di `/ppdb-admin` berfungsi pada domain Cloudflare Pages:
1. Buka **Firebase Console** project pribadi Anda → **Authentication → Settings → Authorized domains**.
2. Klik **Add domain**.
3. Masukkan domain persis tanpa `https://`, misalnya: `ppdb-ra-darusyifa.pages.dev`.
4. Klik **Add**.

---

## Verifikasi Setelah Live
1. Buka halaman utama `https://<nama-app>.pages.dev` — pastikan logo, foto kegiatan, program, dan kontak sekolah tampil lengkap.
2. Buka `https://<nama-app>.pages.dev/ppdb-admin` lalu login menggunakan akun Google `muhamadnugiandri@gmail.com` untuk memastikan admin dashboard terhubung ke Firestore pribadi Anda.
3. Lakukan 1 pendaftaran uji coba dari `/daftar` beserta unggah berkas, lalu periksa datanya di `/ppdb-admin` dan coba tombol Export Excel / Cetak Bukti.
