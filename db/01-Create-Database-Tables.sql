/*
FILE 01 - CREATE DATABASE, TABLE, RELATION, DAN DATABASE USER
*/

IF DB_ID(N'RotiSahabat') IS NULL
    CREATE DATABASE RotiSahabat;
GO
USE RotiSahabat;
GO

/* 1. MASTER DATA */

CREATE TABLE dbo.SUPPLIER (
    Id_Supplier INT IDENTITY(1,1) PRIMARY KEY,
    Kode_Supplier VARCHAR(30) NOT NULL UNIQUE,
    Nama_Supplier VARCHAR(100) NOT NULL,
    Jenis_Supplier VARCHAR(50),
    No_Telp VARCHAR(20), Email VARCHAR(100),
    Jalan VARCHAR(150), Kota VARCHAR(60), Provinsi VARCHAR(60), Kode_Pos VARCHAR(10),
    Status VARCHAR(20) DEFAULT 'Aktif',
    Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.PELANGGAN (
    Id_Pelanggan INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Pelanggan VARCHAR(100) NOT NULL,
    Jenis_Pelanggan VARCHAR(30), No_Telp VARCHAR(20),
    Jalan VARCHAR(150), Kota VARCHAR(60), Provinsi VARCHAR(60), Kode_Pos VARCHAR(10)
);

CREATE TABLE dbo.PENGGUNA (
    Id_Pengguna INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Pengguna VARCHAR(100) NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    No_Telp VARCHAR(20),
    Foto_Profil VARCHAR(255), Status_Aktif BIT DEFAULT 1,
    Terakhir_Login DATETIME2,
    Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME(),
    Tanggal_Diubah DATETIME2
);

CREATE TABLE dbo.PEGAWAI (
    Id_Pegawai INT IDENTITY(1,1) PRIMARY KEY,
    Nomor_Induk_Pegawai VARCHAR(30) UNIQUE,
    Nama_Lengkap VARCHAR(100) NOT NULL,
    Jenis_Kelamin VARCHAR(15), Nomor_Telepon VARCHAR(20),
    Id_Cabang INT NULL,
    Jabatan VARCHAR(50), Status_Pegawai VARCHAR(30),
    Tanggal_Masuk DATE, Tanggal_Keluar DATE,
    Alamat VARCHAR(200), Status_Aktif BIT DEFAULT 1
);

CREATE TABLE dbo.PERAN (
    Id_Peran INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pengguna INT NOT NULL,
    Nama_Peran VARCHAR(50) NOT NULL,
    Deskripsi_Peran VARCHAR(200), Status_Aktif BIT DEFAULT 1,
    CONSTRAINT FK_PERAN_PENGGUNA FOREIGN KEY (Id_Pengguna)
        REFERENCES dbo.PENGGUNA(Id_Pengguna)
);

CREATE TABLE dbo.CABANG (
    Id_Cabang INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pengguna INT NULL,
    Kode_Cabang VARCHAR(30) NOT NULL UNIQUE,
    Nama_Cabang VARCHAR(100) NOT NULL,
    Alamat VARCHAR(200), No_Telepon VARCHAR(20),
    Nama_Penanggung_Jawab VARCHAR(100),
    Tanggal_Dibuka DATE, Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME(),
    Status_Cabang VARCHAR(20) DEFAULT 'Aktif',
    CONSTRAINT FK_CABANG_PENGGUNA FOREIGN KEY (Id_Pengguna)
        REFERENCES dbo.PENGGUNA(Id_Pengguna)
);

ALTER TABLE dbo.PEGAWAI ADD CONSTRAINT FK_PEGAWAI_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang);

CREATE TABLE dbo.GUDANG (
    Id_Gudang INT IDENTITY(1,1) PRIMARY KEY,
    Id_Cabang INT NULL,
    Nama_Gudang VARCHAR(100) NOT NULL,
    Jenis_Gudang VARCHAR(50), Kapasitas_Gudang DECIMAL(12,2),
    Status_Operasional VARCHAR(30), Penanggung_Jawab VARCHAR(100),
    Jalan VARCHAR(150), Kota VARCHAR(60), Provinsi VARCHAR(60), Kode_Pos VARCHAR(10),
    CONSTRAINT FK_GUDANG_CABANG FOREIGN KEY (Id_Cabang)
        REFERENCES dbo.CABANG(Id_Cabang)
);

CREATE TABLE dbo.KATEGORI (
    Id_Kategori INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Kategori VARCHAR(100) NOT NULL,
    Deskripsi VARCHAR(255), Status_Aktif BIT DEFAULT 1,
    Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.PRODUK (
    Id_Produk INT IDENTITY(1,1) PRIMARY KEY,
    Id_Kategori INT NULL,
    Kode_Produk VARCHAR(30) NOT NULL UNIQUE,
    Nama_Produk VARCHAR(100) NOT NULL,
    Deskripsi_Produk VARCHAR(500), Jenis_Produk VARCHAR(50),
    Foto_Produk VARCHAR(255), Berat_Produk DECIMAL(10,2),
    Status_Produk VARCHAR(30) DEFAULT 'Aktif',
    Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_PRODUK_KATEGORI FOREIGN KEY (Id_Kategori)
        REFERENCES dbo.KATEGORI(Id_Kategori)
);

CREATE TABLE dbo.SATUAN (
    Id_Satuan INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Satuan VARCHAR(50) NOT NULL,
    Simbol_Satuan VARCHAR(15), Deskripsi VARCHAR(200)
);

CREATE TABLE dbo.VARIAN_PRODUK (
    Id_Varian INT IDENTITY(1,1) PRIMARY KEY,
    Id_Produk INT NOT NULL,
    Kode_Varian VARCHAR(30) NOT NULL UNIQUE,
    Nama_Varian VARCHAR(100) NOT NULL, Barcode VARCHAR(50), Status_Aktif BIT DEFAULT 1,
    CONSTRAINT FK_VARIAN_PRODUK FOREIGN KEY (Id_Produk)
        REFERENCES dbo.PRODUK(Id_Produk)
);

CREATE TABLE dbo.HARGA_PRODUK (
    Id_Harga_Produk INT IDENTITY(1,1) PRIMARY KEY,
    Id_Varian INT NOT NULL,
    Harga_Jual DECIMAL(15,2) NOT NULL,
    Harga_Reseller DECIMAL(15,2), Harga_Promo DECIMAL(15,2),
    Selisih_Harga_Promo AS (Harga_Jual - ISNULL(Harga_Promo, Harga_Jual)) PERSISTED,
    Tanggal_Dibuat DATE DEFAULT CAST(GETDATE() AS DATE),
    Tanggal_Akhir DATE,
    CONSTRAINT FK_HARGA_VARIAN FOREIGN KEY (Id_Varian)
        REFERENCES dbo.VARIAN_PRODUK(Id_Varian),
    CONSTRAINT CK_HARGA_JUAL CHECK (Harga_Jual >= 0)
);

CREATE TABLE dbo.BAHAN_BAKU (
    Id_Bahan_Baku INT IDENTITY(1,1) PRIMARY KEY,
    Id_Produk INT NULL,
    Kode_Bahan_Baku VARCHAR(30) UNIQUE,
    Nama_Bahan_Baku VARCHAR(100) NOT NULL,
    Id_Satuan INT NULL,
    Stok_Min DECIMAL(12,2), Stok_Max DECIMAL(12,2),
    Tanggal_Kadaluarsa DATE, Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME(),
    Deskripsi VARCHAR(255),
    CONSTRAINT FK_BAHAN_PRODUK FOREIGN KEY (Id_Produk)
        REFERENCES dbo.PRODUK(Id_Produk),
    CONSTRAINT FK_BAHAN_SATUAN FOREIGN KEY (Id_Satuan)
        REFERENCES dbo.SATUAN(Id_Satuan)
);

/* Tabel penghubung relasi M:N PRODUK membutuhkan BAHAN_BAKU.
   Atribut relasi pada ERD: jumlah kebutuhan, satuan kebutuhan, tanggal berlaku. */
CREATE TABLE dbo.RESEP_PRODUK (
    Id_Produk INT NOT NULL,
    Id_Bahan_Baku INT NOT NULL,
    Jumlah_Kebutuhan DECIMAL(12,2) NOT NULL,
    Id_Satuan INT NULL,
    Tanggal_Berlaku DATE NOT NULL,
    CONSTRAINT PK_RESEP_PRODUK PRIMARY KEY (Id_Produk, Id_Bahan_Baku, Tanggal_Berlaku),
    CONSTRAINT FK_RESEP_PRODUK FOREIGN KEY (Id_Produk) REFERENCES dbo.PRODUK(Id_Produk),
    CONSTRAINT FK_RESEP_BAHAN FOREIGN KEY (Id_Bahan_Baku) REFERENCES dbo.BAHAN_BAKU(Id_Bahan_Baku),
    CONSTRAINT FK_RESEP_SATUAN FOREIGN KEY (Id_Satuan) REFERENCES dbo.SATUAN(Id_Satuan)
);

CREATE TABLE dbo.RESELLER (
    Id_Reseller INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pelanggan INT NULL,
    Kode_Reseller VARCHAR(30) NOT NULL UNIQUE,
    Nama_Pemilik VARCHAR(100), Nama_Usaha VARCHAR(100),
    No_Telp VARCHAR(20), Alamat VARCHAR(200),
    Status_Reseller VARCHAR(20) DEFAULT 'Aktif',
    Tanggal_Bergabung DATE DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT FK_RESELLER_PELANGGAN FOREIGN KEY (Id_Pelanggan)
        REFERENCES dbo.PELANGGAN(Id_Pelanggan)
);

/* 2. PEMBELIAN, PESANAN, PENJUALAN, DAN PEMBAYARAN */

CREATE TABLE dbo.PEMBELIAN (
    Id_Pembelian INT IDENTITY(1,1) PRIMARY KEY,
    Id_Supplier INT NOT NULL, Id_Cabang INT NULL, Id_Gudang INT NULL, Id_Pengguna INT NULL,
    Kode_Pembelian VARCHAR(30) NOT NULL UNIQUE, No_Faktur VARCHAR(50),
    Tanggal_Pembelian DATE NOT NULL,
    Subtotal DECIMAL(15,2) DEFAULT 0, Diskon DECIMAL(15,2) DEFAULT 0,
    Pajak DECIMAL(15,2) DEFAULT 0, Biaya_Pengiriman DECIMAL(15,2) DEFAULT 0,
    Total_Pembelian DECIMAL(15,2) DEFAULT 0,
    Status_Pembelian VARCHAR(30), Status_Pembayaran VARCHAR(30),
    CONSTRAINT FK_PEMBELIAN_SUPPLIER FOREIGN KEY (Id_Supplier) REFERENCES dbo.SUPPLIER(Id_Supplier),
    CONSTRAINT FK_PEMBELIAN_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang),
    CONSTRAINT FK_PEMBELIAN_GUDANG FOREIGN KEY (Id_Gudang) REFERENCES dbo.GUDANG(Id_Gudang),
    CONSTRAINT FK_PEMBELIAN_PENGGUNA FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna)
);

CREATE TABLE dbo.PESANAN (
    Id_Pesanan INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pelanggan INT NOT NULL, Id_Pengguna INT NULL, Id_Cabang INT NULL,
    Kode_Pesanan VARCHAR(30) NOT NULL UNIQUE,
    Tanggal_Pesanan DATETIME2 DEFAULT SYSDATETIME(),
    Tanggal_Dibutuhkan DATE, Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME(),
    Tanggal_Diubah DATETIME2, Catatan_Pesanan VARCHAR(500),
    Total_Pesanan DECIMAL(15,2) DEFAULT 0,
    Status_Pesanan VARCHAR(30) DEFAULT 'Menunggu',
    Biaya_Pengiriman DECIMAL(15,2) DEFAULT 0,
    Nama_Penerima VARCHAR(100), Alamat VARCHAR(200), Kota_Pengiriman VARCHAR(60),
    CONSTRAINT FK_PESANAN_PELANGGAN FOREIGN KEY (Id_Pelanggan) REFERENCES dbo.PELANGGAN(Id_Pelanggan),
    CONSTRAINT FK_PESANAN_PENGGUNA FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna),
    CONSTRAINT FK_PESANAN_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang)
);

CREATE TABLE dbo.PENJUALAN (
    Id_Penjualan INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pesanan INT NULL, Id_Cabang INT NULL, Id_Pelanggan INT NULL,
    Kode_Penjualan VARCHAR(30) NOT NULL UNIQUE,
    Tanggal_Penjualan DATETIME2 DEFAULT SYSDATETIME(),
    Jenis_Penjualan VARCHAR(30), Subtotal DECIMAL(15,2) DEFAULT 0,
    Diskon DECIMAL(15,2) DEFAULT 0, Pajak DECIMAL(15,2) DEFAULT 0,
    Biaya_Lain DECIMAL(15,2) DEFAULT 0, Total_Penjualan DECIMAL(15,2) DEFAULT 0,
    Jumlah_Dibayar DECIMAL(15,2) DEFAULT 0, Jumlah_Kembalian DECIMAL(15,2) DEFAULT 0,
    Keuntungan DECIMAL(15,2), Status_Penjualan VARCHAR(30), Keterangan VARCHAR(255),
    CONSTRAINT FK_PENJUALAN_PESANAN FOREIGN KEY (Id_Pesanan) REFERENCES dbo.PESANAN(Id_Pesanan),
    CONSTRAINT FK_PENJUALAN_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang),
    CONSTRAINT FK_PENJUALAN_PELANGGAN FOREIGN KEY (Id_Pelanggan) REFERENCES dbo.PELANGGAN(Id_Pelanggan)
);

CREATE TABLE dbo.DETAIL_PEMBELIAN (
    Id_Detail_Pembelian INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pembelian INT NOT NULL, Id_Bahan_Baku INT NOT NULL, Id_Satuan INT NULL,
    Jumlah_Pembelian DECIMAL(12,2) NOT NULL, Harga_Beli DECIMAL(15,2) NOT NULL,
    Diskon_Item DECIMAL(15,2) DEFAULT 0,
    Subtotal AS (Jumlah_Pembelian * Harga_Beli - Diskon_Item) PERSISTED,
    Jumlah_Diterima DECIMAL(12,2) DEFAULT 0, Keterangan VARCHAR(255),
    CONSTRAINT FK_DETAILPEMBELIAN_PEMBELIAN FOREIGN KEY (Id_Pembelian) REFERENCES dbo.PEMBELIAN(Id_Pembelian),
    CONSTRAINT FK_DETAILPEMBELIAN_BAHAN FOREIGN KEY (Id_Bahan_Baku) REFERENCES dbo.BAHAN_BAKU(Id_Bahan_Baku),
    CONSTRAINT FK_DETAILPEMBELIAN_SATUAN FOREIGN KEY (Id_Satuan) REFERENCES dbo.SATUAN(Id_Satuan)
);

CREATE TABLE dbo.DETAIL_PESANAN (
    Id_Detail_Pesanan INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pesanan INT NOT NULL, Id_Varian INT NOT NULL,
    Jumlah_Pesanan INT NOT NULL, Harga_Satuan DECIMAL(15,2) NOT NULL,
    Diskon_Item DECIMAL(15,2) DEFAULT 0,
    Subtotal AS (Jumlah_Pesanan * Harga_Satuan - Diskon_Item) PERSISTED,
    Keterangan VARCHAR(255),
    CONSTRAINT FK_DETAILPESANAN_PESANAN FOREIGN KEY (Id_Pesanan) REFERENCES dbo.PESANAN(Id_Pesanan),
    CONSTRAINT FK_DETAILPESANAN_VARIAN FOREIGN KEY (Id_Varian) REFERENCES dbo.VARIAN_PRODUK(Id_Varian)
);

CREATE TABLE dbo.DETAIL_PENJUALAN (
    Id_Detail_Penjualan INT IDENTITY(1,1) PRIMARY KEY,
    Id_Penjualan INT NOT NULL, Id_Varian INT NOT NULL,
    Jumlah_Item INT NOT NULL, Harga_Satuan DECIMAL(15,2) NOT NULL,
    Diskon_Item DECIMAL(15,2) DEFAULT 0, Pajak_Item DECIMAL(15,2) DEFAULT 0,
    Subtotal AS (Jumlah_Item * Harga_Satuan - Diskon_Item + Pajak_Item) PERSISTED,
    Keterangan VARCHAR(255),
    CONSTRAINT FK_DETAILPENJUALAN_PENJUALAN FOREIGN KEY (Id_Penjualan) REFERENCES dbo.PENJUALAN(Id_Penjualan),
    CONSTRAINT FK_DETAILPENJUALAN_VARIAN FOREIGN KEY (Id_Varian) REFERENCES dbo.VARIAN_PRODUK(Id_Varian)
);

CREATE TABLE dbo.METODE_PEMBAYARAN (
    Id_Metode INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Metode VARCHAR(50) NOT NULL, Jenis_Metode VARCHAR(30),
    Deskripsi VARCHAR(200), Status_Aktif BIT DEFAULT 1
);

CREATE TABLE dbo.PEMBAYARAN (
    Id_Pembayaran INT IDENTITY(1,1) PRIMARY KEY,
    Id_Penjualan INT NULL, Id_Metode INT NOT NULL, Id_Akun_Keuangan INT NULL,
    No_Pembayaran VARCHAR(40) NOT NULL UNIQUE,
    Tanggal_Pembayaran DATETIME2 DEFAULT SYSDATETIME(),
    Jumlah_Pembayaran DECIMAL(15,2) NOT NULL,
    Jenis_Pembayaran VARCHAR(30), Bukti_Pembayaran VARCHAR(255),
    Status_Pembayaran VARCHAR(30), Keterangan VARCHAR(255),
    CONSTRAINT FK_PEMBAYARAN_PENJUALAN FOREIGN KEY (Id_Penjualan) REFERENCES dbo.PENJUALAN(Id_Penjualan),
    CONSTRAINT FK_PEMBAYARAN_METODE FOREIGN KEY (Id_Metode) REFERENCES dbo.METODE_PEMBAYARAN(Id_Metode)
);

/* 3. PERSEDIAAN, TRANSFER STOK, DAN PRODUKSI */

CREATE TABLE dbo.PERSEDIAAN (
    Id_Persediaan INT IDENTITY(1,1) PRIMARY KEY,
    Id_Gudang INT NOT NULL, Id_Varian INT NULL, Id_Bahan_Baku INT NULL,
    Jumlah_Stok DECIMAL(12,2) DEFAULT 0, Stok_Tersedia DECIMAL(12,2) DEFAULT 0,
    Stok_Dipesan DECIMAL(12,2) DEFAULT 0, Stok_Minimum DECIMAL(12,2) DEFAULT 0,
    Stok_Maksimal DECIMAL(12,2), Tanggal_Stok_Terakhir DATETIME2,
    Tanggal_Dibuat DATETIME2 DEFAULT SYSDATETIME(), Tanggal_Diubah DATETIME2,
    CONSTRAINT FK_PERSEDIAAN_GUDANG FOREIGN KEY (Id_Gudang) REFERENCES dbo.GUDANG(Id_Gudang),
    CONSTRAINT FK_PERSEDIAAN_VARIAN FOREIGN KEY (Id_Varian) REFERENCES dbo.VARIAN_PRODUK(Id_Varian),
    CONSTRAINT FK_PERSEDIAAN_BAHAN FOREIGN KEY (Id_Bahan_Baku) REFERENCES dbo.BAHAN_BAKU(Id_Bahan_Baku),
    CONSTRAINT CK_PERSEDIAAN_JENIS CHECK (
        (Id_Varian IS NOT NULL AND Id_Bahan_Baku IS NULL) OR
        (Id_Varian IS NULL AND Id_Bahan_Baku IS NOT NULL)
    )
);

CREATE TABLE dbo.TRANSFER_STOK (
    Id_Transfer INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pengguna INT NULL,
    Nomor_Transfer VARCHAR(40) NOT NULL UNIQUE,
    Tanggal_Transfer DATETIME2 DEFAULT SYSDATETIME(),
    Tanggal_Diterima DATETIME2, Status_Transfer VARCHAR(30), Keterangan VARCHAR(255),
    CONSTRAINT FK_TRANSFER_PENGGUNA FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna)
);

CREATE TABLE dbo.DETAIL_TRANSFER_STOK (
    Id_Detail_Transfer INT IDENTITY(1,1) PRIMARY KEY,
    Id_Transfer INT NOT NULL, Id_Persediaan INT NOT NULL,
    Jumlah_Dikirim DECIMAL(12,2) NOT NULL, Jumlah_Diterima DECIMAL(12,2) DEFAULT 0,
    Selisih_Stok DECIMAL(12,2), Kondisi_Barang VARCHAR(100), Keterangan VARCHAR(255),
    CONSTRAINT FK_DETAILTRANSFER_TRANSFER FOREIGN KEY (Id_Transfer) REFERENCES dbo.TRANSFER_STOK(Id_Transfer),
    CONSTRAINT FK_DETAILTRANSFER_PERSEDIAAN FOREIGN KEY (Id_Persediaan) REFERENCES dbo.PERSEDIAAN(Id_Persediaan)
);

CREATE TABLE dbo.PRODUKSI (
    Id_Produksi INT IDENTITY(1,1) PRIMARY KEY,
    Id_Cabang INT NULL, Id_Gudang INT NULL, Id_Pengguna INT NULL, Id_Produk INT NOT NULL,
    Kode_Produksi VARCHAR(40) NOT NULL UNIQUE,
    Tanggal_Produksi DATE NOT NULL, Tanggal_Selesai DATE,
    Status_Produksi VARCHAR(30), Jumlah_Rencana DECIMAL(12,2),
    Jumlah_Hasil DECIMAL(12,2), Jumlah_Gagal DECIMAL(12,2),
    Biaya_Bahan DECIMAL(15,2) DEFAULT 0, Biaya_Tenaga_Kerja DECIMAL(15,2) DEFAULT 0,
    Biaya_Operasional DECIMAL(15,2) DEFAULT 0, Total_Biaya_Produksi DECIMAL(15,2) DEFAULT 0,
    Keterangan VARCHAR(255),
    CONSTRAINT FK_PRODUKSI_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang),
    CONSTRAINT FK_PRODUKSI_PRODUK FOREIGN KEY (Id_Produk) REFERENCES dbo.PRODUK(Id_Produk),
    CONSTRAINT FK_PRODUKSI_GUDANG FOREIGN KEY (Id_Gudang) REFERENCES dbo.GUDANG(Id_Gudang),
    CONSTRAINT FK_PRODUKSI_PENGGUNA FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna)
);

CREATE TABLE dbo.DETAIL_PRODUKSI (
    Id_Detail_Produksi INT IDENTITY(1,1) PRIMARY KEY,
    Id_Produksi INT NOT NULL, Id_Bahan_Baku INT NOT NULL, Id_Satuan INT NULL,
    Jumlah_Kebutuhan DECIMAL(12,2), Jumlah_Digunakan DECIMAL(12,2),
    Harga_Satuan DECIMAL(15,2),
    Subtotal_Bahan AS (Jumlah_Digunakan * Harga_Satuan) PERSISTED,
    Keterangan VARCHAR(255),
    CONSTRAINT FK_DETAILPRODUKSI_PRODUKSI FOREIGN KEY (Id_Produksi) REFERENCES dbo.PRODUKSI(Id_Produksi),
    CONSTRAINT FK_DETAILPRODUKSI_BAHAN FOREIGN KEY (Id_Bahan_Baku) REFERENCES dbo.BAHAN_BAKU(Id_Bahan_Baku),
    CONSTRAINT FK_DETAILPRODUKSI_SATUAN FOREIGN KEY (Id_Satuan) REFERENCES dbo.SATUAN(Id_Satuan)
);

CREATE TABLE dbo.RIWAYAT_STOK (
    Id_Riwayat_Stok INT IDENTITY(1,1) PRIMARY KEY,
    Id_Persediaan INT NOT NULL, Id_Cabang INT NULL, Jenis_Transaksi VARCHAR(40), Jenis_Perubahan VARCHAR(30),
    Stok_Sebelum DECIMAL(12,2), Stok_Sesudah DECIMAL(12,2),
    Tanggal_Transaksi DATETIME2 DEFAULT SYSDATETIME(),
    Id_Referensi INT, Nomor_Referensi VARCHAR(40), Keterangan VARCHAR(255),
    CONSTRAINT FK_RIWAYAT_PERSEDIAAN FOREIGN KEY (Id_Persediaan) REFERENCES dbo.PERSEDIAAN(Id_Persediaan),
    CONSTRAINT FK_RIWAYAT_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang)
);

/* 4. PENGIRIMAN DAN ULASAN */

CREATE TABLE dbo.KURIR (
    Id_Kurir INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Kurir VARCHAR(100) NOT NULL, Jenis_Kurir VARCHAR(40),
    No_Telp VARCHAR(20), Nama_Perusahaan VARCHAR(100), Status_Kurir VARCHAR(30)
);

CREATE TABLE dbo.PENGIRIMAN (
    Id_Pengiriman INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pesanan INT NULL, Id_Kurir INT NULL, Id_Transfer INT NULL,
    Tanggal_Pengiriman DATETIME2, Tanggal_Estimasi DATETIME2, Tanggal_Diterima DATETIME2,
    Nomor_Resi VARCHAR(60), Nama_Penerima VARCHAR(100),
    Alamat_Asal VARCHAR(200), Alamat_Tujuan VARCHAR(200),
    Biaya_Pengiriman DECIMAL(15,2) DEFAULT 0, Bukti_Pengiriman VARCHAR(255),
    Status_Pengiriman VARCHAR(30), Keterangan VARCHAR(255),
    CONSTRAINT FK_PENGIRIMAN_PESANAN FOREIGN KEY (Id_Pesanan) REFERENCES dbo.PESANAN(Id_Pesanan),
    CONSTRAINT FK_PENGIRIMAN_KURIR FOREIGN KEY (Id_Kurir) REFERENCES dbo.KURIR(Id_Kurir),
    CONSTRAINT FK_PENGIRIMAN_TRANSFER FOREIGN KEY (Id_Transfer) REFERENCES dbo.TRANSFER_STOK(Id_Transfer)
);

CREATE TABLE dbo.DETAIL_PENGIRIMAN (
    Id_Detail_Pengiriman INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pengiriman INT NOT NULL, Id_Varian INT NOT NULL,
    Jumlah_Dikirim INT, Jumlah_Diterima INT,
    Kondisi_Barang VARCHAR(100), Keterangan VARCHAR(255),
    CONSTRAINT FK_DETAILPENGIRIMAN_PENGIRIMAN FOREIGN KEY (Id_Pengiriman) REFERENCES dbo.PENGIRIMAN(Id_Pengiriman),
    CONSTRAINT FK_DETAILPENGIRIMAN_VARIAN FOREIGN KEY (Id_Varian) REFERENCES dbo.VARIAN_PRODUK(Id_Varian)
);

CREATE TABLE dbo.ULASAN (
    Id_Ulasan INT IDENTITY(1,1) PRIMARY KEY,
    Id_Produk INT NOT NULL, Id_Pelanggan INT NOT NULL,
    Isi_Ulasan VARCHAR(1000), Tanggal_Ulasan DATETIME2 DEFAULT SYSDATETIME(),
    Nilai_Rating TINYINT,
    CONSTRAINT FK_ULASAN_PRODUK FOREIGN KEY (Id_Produk) REFERENCES dbo.PRODUK(Id_Produk),
    CONSTRAINT FK_ULASAN_PELANGGAN FOREIGN KEY (Id_Pelanggan) REFERENCES dbo.PELANGGAN(Id_Pelanggan),
    CONSTRAINT CK_ULASAN_RATING CHECK (Nilai_Rating BETWEEN 1 AND 5)
);

/* 5. KEUANGAN DAN AUDIT */

CREATE TABLE dbo.AKUN_KEUANGAN (
    Id_Akun_Keuangan INT IDENTITY(1,1) PRIMARY KEY,
    Jenis_Akun VARCHAR(40), Nama_Akun VARCHAR(100) NOT NULL,
    Nama_Bank VARCHAR(100), No_Rek VARCHAR(50),
    Nama_Pemilik_Rekening VARCHAR(100),
    Saldo_Awal DECIMAL(15,2) DEFAULT 0, Status_Aktif BIT DEFAULT 1
);

ALTER TABLE dbo.PEMBAYARAN ADD CONSTRAINT FK_PEMBAYARAN_AKUN FOREIGN KEY (Id_Akun_Keuangan) REFERENCES dbo.AKUN_KEUANGAN(Id_Akun_Keuangan);

CREATE TABLE dbo.KATEGORI_PENGELUARAN (
    Id_Kategori_Pengeluaran INT IDENTITY(1,1) PRIMARY KEY,
    Nama_Kategori VARCHAR(100) NOT NULL,
    Deskripsi VARCHAR(255), Status_Aktif BIT DEFAULT 1
);

CREATE TABLE dbo.PENGELUARAN (
    Id_Pengeluaran INT IDENTITY(1,1) PRIMARY KEY,
    Id_Kategori_Pengeluaran INT NOT NULL, Id_Akun_Keuangan INT NULL,
    Id_Pembelian INT NULL, Id_Pengguna INT NULL, Id_Cabang INT NULL,
    No_Pengeluaran VARCHAR(40) NOT NULL UNIQUE,
    Nama_Pengeluaran VARCHAR(100) NOT NULL, Tanggal_Pengeluaran DATE NOT NULL,
    Jumlah_Pengeluaran DECIMAL(15,2) NOT NULL,
    Jenis_Pengeluaran VARCHAR(40), Metode_Pengeluaran VARCHAR(40),
    Nomor_Bukti VARCHAR(60), Bukti_Pengeluaran VARCHAR(255),
    Status_Pengeluaran VARCHAR(30), Keterangan VARCHAR(255),
    CONSTRAINT FK_PENGELUARAN_KATEGORI FOREIGN KEY (Id_Kategori_Pengeluaran)
        REFERENCES dbo.KATEGORI_PENGELUARAN(Id_Kategori_Pengeluaran),
    CONSTRAINT FK_PENGELUARAN_AKUN FOREIGN KEY (Id_Akun_Keuangan)
        REFERENCES dbo.AKUN_KEUANGAN(Id_Akun_Keuangan),
    CONSTRAINT FK_PENGELUARAN_PEMBELIAN FOREIGN KEY (Id_Pembelian) REFERENCES dbo.PEMBELIAN(Id_Pembelian),
    CONSTRAINT FK_PENGELUARAN_PENGGUNA FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna),
    CONSTRAINT FK_PENGELUARAN_CABANG FOREIGN KEY (Id_Cabang) REFERENCES dbo.CABANG(Id_Cabang)
);

CREATE TABLE dbo.AUDIT_LOG (
    Id_Audit_Log INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pengguna INT NULL, Nama_Tabel VARCHAR(100), Id_Data INT,
    Jenis_Aktivitas VARCHAR(30), Data_Sebelum VARCHAR(MAX), Data_Sesudah VARCHAR(MAX),
    Alamat_IP VARCHAR(50), User_Agent VARCHAR(255),
    Tanggal_Aktivitas DATETIME2 DEFAULT SYSDATETIME(),
    Status_Aktivitas VARCHAR(30), Deskripsi_Aktivitas VARCHAR(500),
    CONSTRAINT FK_AUDIT_PENGGUNA FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna)
);
GO


/* 6. DATA CONTOH UNTUK UJI QUERY POIN F */
INSERT INTO dbo.PENGGUNA
    (Nama_Pengguna, Username, Email, Password_Hash, No_Telp)
VALUES
    ('Pemilik Roti Sahabat', 'owner', 'owner@rotisahabat.test', 'hash_demo_owner', '081200000001'),
    ('Admin Operasional', 'adminops', 'admin@rotisahabat.test', 'hash_demo_admin', '081200000002');

INSERT INTO dbo.PERAN (Id_Pengguna, Nama_Peran, Deskripsi_Peran)
VALUES (1, 'Super Admin', 'Mengelola seluruh data usaha'),
       (2, 'Admin Operasional', 'Mengelola kegiatan operasional');

INSERT INTO dbo.CABANG (Id_Pengguna, Kode_Cabang, Nama_Cabang, Alamat, No_Telepon, Nama_Penanggung_Jawab, Tanggal_Dibuka)
VALUES (1, 'CBG001', 'Cabang Utama', 'Jl. Slamet Riyadi, Surakarta', '0271000000', 'Pemilik', '2024-01-01');

INSERT INTO dbo.PEGAWAI (Id_Cabang, Nomor_Induk_Pegawai, Nama_Lengkap, Jenis_Kelamin, Nomor_Telepon, Jabatan, Status_Pegawai, Tanggal_Masuk, Alamat)
VALUES (1, 'PGW001', 'Admin Operasional', 'Perempuan', '081200000002', 'Admin Operasional', 'Aktif', '2025-01-01', 'Surakarta');

INSERT INTO dbo.SUPPLIER (Kode_Supplier, Nama_Supplier, Jenis_Supplier, No_Telp, Email, Kota)
VALUES ('SUP001', 'Supplier Bahan Pangan', 'Bahan Baku', '081300000001', 'supplier@test.id', 'Surakarta');

INSERT INTO dbo.PELANGGAN (Nama_Pelanggan, Jenis_Pelanggan, No_Telp, Kota)
VALUES ('Alya', 'Umum', '081234567890', 'Surakarta'),
       ('Bima', 'Reseller', '081234567891', 'Surakarta');

INSERT INTO dbo.GUDANG (Id_Cabang, Nama_Gudang, Jenis_Gudang, Kapasitas_Gudang, Status_Operasional, Penanggung_Jawab, Kota)
VALUES (1, 'Gudang Utama', 'Bahan Baku dan Produk', 1000, 'Aktif', 'Admin Operasional', 'Surakarta');

INSERT INTO dbo.KATEGORI (Nama_Kategori, Deskripsi)
VALUES ('Roti', 'Produk roti dan bakery'), ('Kue', 'Produk kue');

INSERT INTO dbo.PRODUK (Id_Kategori, Kode_Produk, Nama_Produk, Deskripsi_Produk, Jenis_Produk, Berat_Produk)
VALUES (1, 'PRD001', 'Roti Cokelat', 'Roti isi cokelat', 'Makanan', 80),
       (2, 'PRD002', 'Brownies', 'Brownies cokelat', 'Makanan', 250);

INSERT INTO dbo.SATUAN (Nama_Satuan, Simbol_Satuan, Deskripsi)
VALUES ('Buah', 'bh', 'Satuan buah'), ('Kilogram', 'kg', 'Satuan berat');

INSERT INTO dbo.VARIAN_PRODUK (Id_Produk, Kode_Varian, Nama_Varian, Barcode)
VALUES (1, 'VRN001', 'Satuan', '899000000001'),
       (2, 'VRN002', 'Loyang', '899000000002');

INSERT INTO dbo.HARGA_PRODUK (Id_Varian, Harga_Jual, Harga_Reseller, Harga_Promo)
VALUES (1, 15000, 13000, 14000), (2, 50000, 45000, 48000);

INSERT INTO dbo.BAHAN_BAKU (Id_Produk, Id_Satuan, Kode_Bahan_Baku, Nama_Bahan_Baku, Stok_Min, Stok_Max, Deskripsi)
VALUES (NULL, 2, 'BB001', 'Tepung Terigu', 5, 100, 'Bahan utama roti');

INSERT INTO dbo.RESEP_PRODUK (Id_Produk, Id_Bahan_Baku, Jumlah_Kebutuhan, Id_Satuan, Tanggal_Berlaku)
VALUES (1, 1, 0.25, 2, '2026-01-01');

INSERT INTO dbo.METODE_PEMBAYARAN (Nama_Metode, Jenis_Metode, Deskripsi)
VALUES ('Transfer Bank', 'Transfer', 'Pembayaran melalui transfer bank');

INSERT INTO dbo.AKUN_KEUANGAN (Jenis_Akun, Nama_Akun, Nama_Bank, No_Rek, Nama_Pemilik_Rekening, Saldo_Awal)
VALUES ('Bank', 'Rekening Operasional', 'Bank Contoh', '1234567890', 'Roti Sahabat', 1000000);

INSERT INTO dbo.KATEGORI_PENGELUARAN (Nama_Kategori, Deskripsi)
VALUES ('Bahan Baku', 'Pembelian bahan baku produksi');

INSERT INTO dbo.PEMBELIAN (Id_Supplier, Id_Cabang, Id_Gudang, Id_Pengguna, Kode_Pembelian, No_Faktur, Tanggal_Pembelian, Subtotal, Total_Pembelian, Status_Pembelian, Status_Pembayaran)
VALUES (1, 1, 1, 2, 'PB001', 'INV-PB001', '2026-11-01', 200000, 200000, 'Diterima', 'Lunas');

INSERT INTO dbo.DETAIL_PEMBELIAN (Id_Pembelian, Id_Bahan_Baku, Id_Satuan, Jumlah_Pembelian, Harga_Beli, Jumlah_Diterima)
VALUES (1, 1, 2, 10, 20000, 10);

INSERT INTO dbo.PESANAN (Id_Pelanggan, Id_Pengguna, Id_Cabang, Kode_Pesanan, Tanggal_Pesanan, Catatan_Pesanan, Total_Pesanan, Status_Pesanan, Nama_Penerima, Alamat, Kota_Pengiriman)
VALUES (1, 2, 1, 'PSN001', SYSDATETIME(), 'Pesanan contoh', 30000, 'Selesai', 'Alya', 'Surakarta', 'Surakarta'),
       (2, 2, 1, 'PSN002', SYSDATETIME(), 'Pesanan contoh kedua', 50000, 'Diproses', 'Bima', 'Surakarta', 'Surakarta');

INSERT INTO dbo.DETAIL_PESANAN (Id_Pesanan, Id_Varian, Jumlah_Pesanan, Harga_Satuan)
VALUES (1, 1, 2, 15000), (2, 2, 1, 50000);

INSERT INTO dbo.PENJUALAN (Id_Pesanan, Id_Cabang, Id_Pelanggan, Kode_Penjualan, Tanggal_Penjualan, Jenis_Penjualan, Subtotal, Total_Penjualan, Jumlah_Dibayar, Status_Penjualan)
VALUES (1, 1, 1, 'PJ001', SYSDATETIME(), 'Online', 30000, 30000, 30000, 'Lunas');

INSERT INTO dbo.DETAIL_PENJUALAN (Id_Penjualan, Id_Varian, Jumlah_Item, Harga_Satuan)
VALUES (1, 1, 2, 15000);

INSERT INTO dbo.PEMBAYARAN (Id_Penjualan, Id_Metode, Id_Akun_Keuangan, No_Pembayaran, Jumlah_Pembayaran, Jenis_Pembayaran, Status_Pembayaran)
VALUES (1, 1, 1, 'PAY001', 30000, 'Transfer', 'Berhasil');

INSERT INTO dbo.PERSEDIAAN (Id_Gudang, Id_Varian, Jumlah_Stok, Stok_Tersedia, Stok_Minimum, Stok_Maksimal)
VALUES (1, 1, 50, 50, 10, 100);

INSERT INTO dbo.PERSEDIAAN (Id_Gudang, Id_Bahan_Baku, Jumlah_Stok, Stok_Tersedia, Stok_Minimum, Stok_Maksimal)
VALUES (1, 1, 3, 3, 5, 100);

INSERT INTO dbo.TRANSFER_STOK (Id_Pengguna, Nomor_Transfer, Tanggal_Transfer, Status_Transfer, Keterangan)
VALUES (2, 'TRF001', SYSDATETIME(), 'Dikirim', 'Transfer contoh');

INSERT INTO dbo.DETAIL_TRANSFER_STOK (Id_Transfer, Id_Persediaan, Jumlah_Dikirim, Jumlah_Diterima)
VALUES (1, 1, 5, 5);

INSERT INTO dbo.PRODUKSI (Id_Cabang, Id_Gudang, Id_Pengguna, Id_Produk, Kode_Produksi, Tanggal_Produksi, Status_Produksi, Jumlah_Rencana, Jumlah_Hasil, Jumlah_Gagal)
VALUES (1, 1, 2, 1, 'PRD-PRD001', CAST(GETDATE() AS DATE), 'Selesai', 20, 18, 2);

INSERT INTO dbo.DETAIL_PRODUKSI (Id_Produksi, Id_Bahan_Baku, Id_Satuan, Jumlah_Kebutuhan, Jumlah_Digunakan, Harga_Satuan)
VALUES (1, 1, 2, 5, 5, 20000);

INSERT INTO dbo.KURIR (Nama_Kurir, Jenis_Kurir, No_Telp, Nama_Perusahaan, Status_Kurir)
VALUES ('Kurir Internal', 'Internal', '081200000003', 'Roti Sahabat', 'Aktif');

INSERT INTO dbo.PENGIRIMAN (Id_Pesanan, Id_Kurir, Tanggal_Pengiriman, Tanggal_Estimasi, Nomor_Resi, Nama_Penerima, Alamat_Tujuan, Status_Pengiriman)
VALUES (1, 1, SYSDATETIME(), DATEADD(DAY, 1, SYSDATETIME()), 'RESI001', 'Alya', 'Surakarta', 'Terkirim');

INSERT INTO dbo.DETAIL_PENGIRIMAN (Id_Pengiriman, Id_Varian, Jumlah_Dikirim, Jumlah_Diterima)
VALUES (1, 1, 2, 2);

INSERT INTO dbo.ULASAN (Id_Produk, Id_Pelanggan, Isi_Ulasan, Nilai_Rating)
VALUES (1, 1, 'Rotinya enak dan lembut.', 5);

INSERT INTO dbo.PENGELUARAN (Id_Kategori_Pengeluaran, Id_Akun_Keuangan, Id_Pembelian, Id_Pengguna, Id_Cabang, No_Pengeluaran, Nama_Pengeluaran, Tanggal_Pengeluaran, Jumlah_Pengeluaran, Jenis_Pengeluaran, Metode_Pengeluaran, Status_Pengeluaran)
VALUES (1, 1, 1, 2, 1, 'OUT001', 'Pembelian tepung', CAST(GETDATE() AS DATE), 200000, 'Operasional', 'Transfer', 'Tercatat');

INSERT INTO dbo.RIWAYAT_STOK (Id_Persediaan, Id_Cabang, Jenis_Transaksi, Jenis_Perubahan, Stok_Sebelum, Stok_Sesudah, Id_Referensi, Nomor_Referensi, Keterangan)
VALUES (1, 1, 'Penyesuaian', 'Masuk', 45, 50, 1, 'TRF001', 'Contoh riwayat stok');

INSERT INTO dbo.AUDIT_LOG (Id_Pengguna, Nama_Tabel, Id_Data, Jenis_Aktivitas, Data_Sesudah, Status_Aktivitas, Deskripsi_Aktivitas)
VALUES (2, 'PESANAN', 1, 'INSERT', 'PSN001', 'Berhasil', 'Membuat data pesanan contoh');
GO

/* 7. ROLE DAN USER DATABASE
   Super Admin: hak penuh untuk kebutuhan pengelolaan database.
   Admin Operasional: dapat membaca dan mengubah data, tetapi bukan konfigurasi DB.
   Pelanggan: pada P2 mengakses aplikasi melalui web, bukan login SQL langsung.
*/
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'role_super_admin')
    CREATE ROLE role_super_admin;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'role_admin_operasional')
    CREATE ROLE role_admin_operasional;
GO

IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'RotiSahabatOwner')
AND NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'RotiSahabatOwner')
    CREATE USER RotiSahabatOwner FOR LOGIN RotiSahabatOwner;
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'RotiSahabatOperasional')
AND NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'RotiSahabatOperasional')
    CREATE USER RotiSahabatOperasional FOR LOGIN RotiSahabatOperasional;
GO

IF USER_ID(N'RotiSahabatOwner') IS NOT NULL
    ALTER ROLE role_super_admin ADD MEMBER RotiSahabatOwner;
IF USER_ID(N'RotiSahabatOperasional') IS NOT NULL
    ALTER ROLE role_admin_operasional ADD MEMBER RotiSahabatOperasional;
GO

-- Hak Super Admin untuk administrasi penuh database.
IF USER_ID(N'RotiSahabatOwner') IS NOT NULL
    ALTER ROLE db_owner ADD MEMBER RotiSahabatOwner;

-- Admin operasional hanya diberi hak baca dan tulis data.
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO role_admin_operasional;
GO

/* 7. CEK TABEL DAN RELASI */
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

SELECT
    fk.name AS Nama_FK,
    OBJECT_NAME(fk.parent_object_id) AS Tabel_Asal,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS Kolom_Asal,
    OBJECT_NAME(fk.referenced_object_id) AS Tabel_Tujuan,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS Kolom_Tujuan
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY Tabel_Asal, Nama_FK;
GO
