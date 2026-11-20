# Backend Katalog Digital & Kasir Toko Roti Sahabat (PRD v1.2)

Backend REST API untuk sistem **Katalog Digital dan Kasir Toko Roti Sahabat**, dibangun menggunakan **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM**, dan **Microsoft SQL Server**.

---

## 🛠️ Tech Stack & Konfigurasi

- **Framework**: Next.js 16 (App Router, Route Handlers)
- **Bahasa**: TypeScript (Strict mode, `noImplicitOverride: true`)
- **Database**: Microsoft SQL Server (`MSSQLSERVER25`)
- **ORM**: Prisma ORM v5
- **Autentikasi**: JWT (`jsonwebtoken`) & bcrypt password hashing (`bcryptjs`)
- **Validasi Schema**: Zod v3
- **Dokumentasi API & Testing**: Postman Collection v2.1

---

## 🏛️ Implementasi 8 Prinsip OOP (PRD Bagian 12)

| No | Prinsip OOP | Lokasi Implementasi | Penjelasan Singkat |
|:---|:---|:---|:---|
| 1 | **Encapsulation** | `src/server/domain/Persediaan.ts`, `Pengguna.ts`, `Pengiriman.ts` | State internal `#stokTersedia`, `#passwordHash`, dan `#status` privat. Tidak bisa dimanipulasi langsung; validasi ketat (stok tidak pernah minus, password tidak bocor ke DTO). |
| 2 | **Polymorphism** | `src/server/domain/Diskon.ts`, `MetodePembayaran.ts`, `SerahTerima.ts` | Objek turunan diakses melalui tipe abstract base class (`Diskon`, `MetodePembayaran`, `SerahTerima`). |
| 3 | **Overriding** | `src/server/domain/MetodePembayaran.ts`, `Diskon.ts` | Method `hitungKembalian()`, `validasi()`, dan `hitungDiskon()` di-override oleh subclass dengan anotasi `override`. |
| 4 | **Overloading** | `src/server/services/LaporanService.ts`, `StrukService.ts`, `ProdukRepository.ts` | Multiple function signature (misal `ringkasan(periode)` vs `ringkasan(awal, akhir)`; `ambil(id)` vs `ambil(barcode)`). |
| 5 | **Asynchronous** | `src/server/services/TransaksiService.ts`, `src/app/api/admin/dasbor/route.ts` | Transaksi atomik database (`prisma.$transaction`), concurrency via `Promise.all` untuk metrics dasbor. |
| 6 | **Association** | `src/server/domain/Penjualan.ts` | Relasi asosiasi antar domain model (`Penjualan` berasosiasi dengan kasir/pengguna yang melayani). |
| 7 | **Aggregation** | `src/server/domain/LaporanPenjualan.ts` | `LaporanPenjualan` mengumpulkan daftar `Penjualan[]` independen untuk kalkulasi omzet, laba kotor, dan item terlaris. |
| 8 | **Composition** | `src/server/domain/Penjualan.ts`, `Pesanan.ts`, `Produk.ts` | `Penjualan` memiliki `DetailPenjualan[]`. Jika penjualan dihapus/dibatalkan, detail itemnya terikat kuat pada siklus hidup induknya. |

---

## 🚀 Panduan Menjalankan Sistem

### 1. Menyalakan Layanan SQL Server
Layanan SQL Server bernama `MSSQL$MSSQLSERVER25`.
- **Opsi A**: Klik kanan file `start-sqlserver.bat` -> pilih **"Run as Administrator"**.
- **Opsi B**: Buka `services.msc` -> cari **SQL Server (MSSQLSERVER25)** -> klik **Start**.

### 2. Menyiapkan Database & Seed Data
Buka folder `db/` lalu jalankan batch script:
```cmd
cd "E:\SEM 3\RSI\project_roti_shbt\db"
run-database-setup.bat
```
*(Jika diminta nama instance server, tekan **Enter** untuk menggunakan default `.\MSSQLSERVER25`).*

Script ini akan menjalankan 3 file SQL secara otomatis:
1. `00-Setup-SQL-Server.sql` (Membuat Login & User SQL Server)
2. `01-Create-Database-Tables.sql` (Membuat skema tabel, relasi, & seed dasar)
3. `03-PRD-Updates.sql` (Update constraint PRD v1.2, tabel `RIWAYAT_HARGA`, kurir, metode pembayaran, & hash password bcrypt)

### 3. Akun Pengguna Bawaan (Database Seed)
| Peran | Username | Password | Hak Akses |
|:---|:---|:---|:---|
| **Owner** | `owner` | `Owner123!` | Akses penuh (Katalog, Kasir, Ubah/Hapus Produk, Laporan, Batalkan Transaksi, Audit Log) |
| **Staff** | `adminops` | `Staff123!` | Akses operasional (Katalog, Kasir, Tambah/Edit Produk, Kelola Stok, Pengiriman) |

---

## 🧪 Pengujian & Verifikasi

### 1. Unit Testing Domain & Business Logic (8 Prinsip OOP)
Jalankan pengujian logika domain tanpa ketergantungan koneksi jaringan:
```cmd
npx tsx test/test-domain.mjs
```
*Hasil: 8 dari 8 modul pengujian OOP lulus 100%.*

### 2. Kompilasi & Build Produksi Next.js
Verifikasi type-safety TypeScript dan bundling seluruh route API:
```cmd
npm run build
```
*Hasil: 21 route statis & dinamis berhasil terkompilasi.*

### 3. Menjalankan Server Development
```cmd
npm run dev
```
Server backend akan aktif di: `http://localhost:3000`

---

## 📬 Pengujian Lengkap Menggunakan Postman

Koleksi lengkap Postman telah disediakan di:
`postman/RotiSahabat_API_Collection.json`

### Cara Mengimpor & Menjalankan:
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** -> pilih file `postman/RotiSahabat_API_Collection.json`.
3. Variabel `base_url` telah di-set ke `http://localhost:3000`.
4. Jalankan permintaan secara berurutan:
   - **Folder 1 (Autentikasi)**: Jalankan `POST Login Owner` & `POST Login Staff` (token JWT otomatis tersimpan ke variabel Postman).
   - **Folder 2 (Katalog Publik)**: Uji pencarian, filter kategori, detail produk.
   - **Folder 3 (Keranjang & Pemesanan)**: Cek validasi keranjang dan buat pesanan publik (menghasilkan URL WhatsApp terstruktur).
   - **Folder 4 (Pelacakan Pengiriman Publik)**: Lacak pesanan lewat nomor resi dengan masking data pribadi.
   - **Folder 5 & 6 (Manajemen Produk & Stok)**: Tambah produk, ubah harga (otomatis tersimpan ke tabel riwayat), uji coba pencegahan staff menghapus produk.
   - **Folder 7 (Kasir & Transaksi)**: Simpan transaksi tunai (kembalian dihitung), transaksi diskon, transaksi kirim kurir (auto generate resi & pengiriman), serta pembatalan transaksi oleh Owner (mengembalikan stok secara atomik).
   - **Folder 8 & 9 (Pengiriman & Pesanan Masuk)**: Transisi status pengiriman teratur (`Diproses` -> `Dikirim` -> `Terkirim`), uji cegah lompatan status ilegal, dan pembuatan pesan WhatsApp resi pengiriman.
   - **Folder 10 & 11 (Laporan, Dasbor, & Audit Log)**: Ringkasan penjualan berkala dan jejak audit aktivitas sistem.
