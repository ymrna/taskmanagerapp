# Jadwal Tim Kerja

Aplikasi manajemen jadwal task untuk tim kerja: tabel **Tim Kerja → Kegiatan × Minggu per bulan**, CRUD task di setiap sel minggu, status task, dan data petugas.

## Fitur

- **Schedule**: baris dikelompokkan per tim → kegiatan; kolom = minggu kalender per bulan (4–5 minggu). Rentang bulan bebas (maks. 24 bulan), plus pintasan bulan/triwulan/semester/tahun. Minggu berjalan disorot.
- **Task**: tambah/ubah/hapus task di sel minggu, banyak task per sel, banyak petugas per task.
- **Status**: Belum · Selesai · Diganti · Tidak dikerjakan.
  - *Diganti → Dijadwal ulang*: pilih minggu tujuan; task pengganti dibuat otomatis (dengan petugas yang sama) dan saling tertaut. Menjadwal ulang lagi akan memindahkan task pengganti, bukan menduplikasi.
  - *Diganti → Ganti kegiatan*: catat kegiatan pengganti + alasan.
- **Master data** (admin): Tim & Kegiatan, Petugas (nama, NIP, jabatan, telepon, email, tim), Pengguna.
- **Filter & pencarian**: tim, petugas, status, teks bebas (URL dapat di-bookmark).
- **Export**: Excel (.xlsx dengan header, merge, wrap, freeze pane) dan PDF via halaman cetak (Simpan sebagai PDF).
- **Role**: *Admin* mengelola semua data; *Anggota* melihat jadwal dan mengubah status task.
- UI Bahasa Indonesia, responsif (kolom sticky, dialog ramah layar sentuh).

## Aturan minggu

Minggu = Senin–Minggu, dan menjadi milik bulan tempat **hari Kamis**-nya jatuh (seperti ISO-8601). Setiap bulan punya 4 atau 5 minggu tanpa tumpang tindih. Task disimpan dengan `week_start` (tanggal Senin). Lihat `src/lib/weeks.ts`.

## Stack

Next.js 16 (App Router, Cache Components, Server Actions) · TypeScript · Tailwind CSS 4 · Drizzle ORM + Postgres (`postgres` driver) · Zod.
Tanpa library UI, auth, atau Excel eksternal: auth memakai `scrypt` + sesi di DB, dan `.xlsx` ditulis oleh `src/lib/xlsx.ts`.

## Menjalankan lokal

Tidak perlu memasang Postgres; `npm run db:local` menjalankan [PGlite](https://pglite.dev) (Postgres WASM) di port 54329.

```bash
npm install
cp .env.example .env          # set ADMIN_PASSWORD
npm run db:local              # terminal 1: database lokal (data di ./.pglite)
npm run db:migrate            # terminal 2
npm run db:seed               # admin pertama (tambah `-- --demo` untuk data contoh)
npm run dev                   # http://localhost:3000
```

Perintah lain: `npm test` (unit test minggu), `npm run typecheck`, `npm run lint`, `npm run db:generate` (setelah mengubah `src/db/schema.ts`).

## Deploy ke Vercel + Neon

1. Buat database Neon (atau Vercel Postgres/Neon integration), salin **pooled connection string**.
2. Di Vercel → Environment Variables: `DATABASE_URL=<pooled url>`.
3. Jalankan migrasi & admin pertama dari mesin lokal, mengarah ke DB produksi:
   ```bash
   DATABASE_URL="<url>" ADMIN_PASSWORD="<kuat>" npm run db:migrate
   DATABASE_URL="<url>" ADMIN_PASSWORD="<kuat>" npm run db:seed
   ```
4. Deploy (`vercel` atau push ke Git yang terhubung).

## Struktur

```
src/
  app/(app)/jadwal     halaman schedule, dialog task, filter
  app/(app)/tim        CRUD tim & kegiatan
  app/(app)/petugas    CRUD petugas
  app/(app)/pengguna   CRUD pengguna
  app/cetak            tampilan cetak / PDF
  app/api/export       unduh .xlsx
  app/actions          server actions (auth, task, master data)
  db/schema.ts         skema Drizzle
  lib/                 auth, validasi (zod), loader jadwal, logika minggu, penulis xlsx
  proxy.ts             redirect cepat ke /login bila tidak ada cookie sesi
drizzle/               file migrasi SQL
scripts/seed.ts        admin pertama & data contoh
```

## Keamanan

- Setiap server action & route handler memverifikasi sesi dan role di server (bukan hanya UI).
- Password di-hash `scrypt` (salt acak); cookie sesi `httpOnly`, `sameSite=lax`, `secure` di produksi; yang disimpan di DB hanya hash SHA-256 token.
- Minimal satu admin dijaga; admin tidak bisa menghapus atau menurunkan role akunnya sendiri.
