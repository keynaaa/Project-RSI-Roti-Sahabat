/*
FILE 03 - PENYESUAIAN SKEMA & DATA AWAL SESUAI PRD v1.2 (BAGIAN 11.3)
*/

USE RotiSahabat;
GO

-- 1. Tambah kolom Id_Pengguna pada PENJUALAN untuk mencatat kasir
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PENJUALAN') AND name = N'Id_Pengguna'
)
BEGIN
    ALTER TABLE dbo.PENJUALAN ADD Id_Pengguna INT NULL;
    ALTER TABLE dbo.PENJUALAN ADD CONSTRAINT FK_PENJUALAN_PENGGUNA 
        FOREIGN KEY (Id_Pengguna) REFERENCES dbo.PENGGUNA(Id_Pengguna);
END;
GO

-- 2. Tambah tabel RIWAYAT_HARGA
IF OBJECT_ID(N'dbo.RIWAYAT_HARGA', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RIWAYAT_HARGA (
        Id_Riwayat_Harga INT IDENTITY(1,1) PRIMARY KEY,
        Id_Varian INT NOT NULL,
        Id_Pengguna INT NULL,
        Harga_Lama DECIMAL(15,2) NOT NULL,
        Harga_Baru DECIMAL(15,2) NOT NULL,
        Selisih DECIMAL(15,2) NOT NULL,
        Waktu DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_RIWAYAT_HARGA_VARIAN FOREIGN KEY (Id_Varian)
            REFERENCES dbo.VARIAN_PRODUK(Id_Varian),
        CONSTRAINT FK_RIWAYAT_HARGA_PENGGUNA FOREIGN KEY (Id_Pengguna)
            REFERENCES dbo.PENGGUNA(Id_Pengguna)
    );
END;
GO

-- 3. Ubah default PESANAN.Status_Pesanan menjadi 'Baru'
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.PESANAN') AND name LIKE '%Status%')
BEGIN
    DECLARE @defName NVARCHAR(256);
    SELECT @defName = name FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID(N'dbo.PESANAN') 
      AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.PESANAN'), 'Status_Pesanan', 'ColumnId');
    IF @defName IS NOT NULL
        EXEC('ALTER TABLE dbo.PESANAN DROP CONSTRAINT ' + @defName);
    ALTER TABLE dbo.PESANAN ADD CONSTRAINT DF_PESANAN_Status DEFAULT 'Baru' FOR Status_Pesanan;
END;
GO

-- 4. Tambah indeks unik pada PRODUK(Nama_Produk)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_PRODUK_Nama' AND object_id = OBJECT_ID(N'dbo.PRODUK'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_PRODUK_Nama ON dbo.PRODUK(Nama_Produk);
END;
GO

-- 5. Tambah indeks performa kueri
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PRODUK_Kategori' AND object_id = OBJECT_ID(N'dbo.PRODUK'))
    CREATE NONCLUSTERED INDEX IX_PRODUK_Kategori ON dbo.PRODUK(Id_Kategori);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PENJUALAN_Tanggal' AND object_id = OBJECT_ID(N'dbo.PENJUALAN'))
    CREATE NONCLUSTERED INDEX IX_PENJUALAN_Tanggal ON dbo.PENJUALAN(Tanggal_Penjualan);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PESANAN_Tanggal' AND object_id = OBJECT_ID(N'dbo.PESANAN'))
    CREATE NONCLUSTERED INDEX IX_PESANAN_Tanggal ON dbo.PESANAN(Tanggal_Pesanan);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PENGIRIMAN_Resi' AND object_id = OBJECT_ID(N'dbo.PENGIRIMAN'))
    CREATE NONCLUSTERED INDEX IX_PENGIRIMAN_Resi ON dbo.PENGIRIMAN(Nomor_Resi);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_PERSEDIAAN_Gudang_Varian' AND object_id = OBJECT_ID(N'dbo.PERSEDIAAN'))
    CREATE UNIQUE NONCLUSTERED INDEX UQ_PERSEDIAAN_Gudang_Varian ON dbo.PERSEDIAAN(Id_Gudang, Id_Varian) WHERE Id_Varian IS NOT NULL;
GO

-- 6. Constraint CHECK Stok_Tersedia >= 0
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PERSEDIAAN_STOK_POSITIF')
BEGIN
    ALTER TABLE dbo.PERSEDIAAN ADD CONSTRAINT CK_PERSEDIAAN_STOK_POSITIF CHECK (Stok_Tersedia >= 0);
END;
GO

-- 7. Update Password Hash Bcrypt untuk akun bawaan
-- Password Owner: Owner123!
UPDATE dbo.PENGGUNA 
SET Password_Hash = '$2a$10$bQCxeweiqiPb9Rt6tR2CzeTovicjSSteR05H6G.V7Nx5zKfEngWsC'
WHERE Username = 'owner';

-- Password Staff: Staff123!
UPDATE dbo.PENGGUNA 
SET Password_Hash = '$2a$10$qR8p3/I0b67k.OPe40Pp0ePPEOPVTr0u./Kj44NyRDUFlidk4rkQO'
WHERE Username = 'adminops';
GO

-- 8. Data Kategori Lengkap sesuai PRD (Roti, Bolu, Kue Kering, Lainnya)
IF NOT EXISTS (SELECT 1 FROM dbo.KATEGORI WHERE Nama_Kategori = 'Bolu')
    INSERT INTO dbo.KATEGORI (Nama_Kategori, Deskripsi) VALUES ('Bolu', 'Produk bolu dan cake');

IF NOT EXISTS (SELECT 1 FROM dbo.KATEGORI WHERE Nama_Kategori = 'Kue Kering')
    INSERT INTO dbo.KATEGORI (Nama_Kategori, Deskripsi) VALUES ('Kue Kering', 'Kue kering toples dan camilan');

IF NOT EXISTS (SELECT 1 FROM dbo.KATEGORI WHERE Nama_Kategori = 'Lainnya')
    INSERT INTO dbo.KATEGORI (Nama_Kategori, Deskripsi) VALUES ('Lainnya', 'Aneka minuman dan pelengkap');
GO

-- 9. Metode Pembayaran Lengkap (Tunai, Transfer Bank, QRIS)
IF NOT EXISTS (SELECT 1 FROM dbo.METODE_PEMBAYARAN WHERE Nama_Metode = 'Tunai')
    INSERT INTO dbo.METODE_PEMBAYARAN (Nama_Metode, Jenis_Metode, Deskripsi) 
    VALUES ('Tunai', 'Cash', 'Pembayaran tunai langsung di kasir');

IF NOT EXISTS (SELECT 1 FROM dbo.METODE_PEMBAYARAN WHERE Nama_Metode = 'QRIS')
    INSERT INTO dbo.METODE_PEMBAYARAN (Nama_Metode, Jenis_Metode, Deskripsi) 
    VALUES ('QRIS', 'Digital', 'Pembayaran statis / dinamis QRIS');
GO

-- 10. Kurir Tambahan Dummy
IF NOT EXISTS (SELECT 1 FROM dbo.KURIR WHERE Nama_Kurir = 'JNE Regular (Dummy)')
    INSERT INTO dbo.KURIR (Nama_Kurir, Jenis_Kurir, No_Telp, Nama_Perusahaan, Status_Kurir)
    VALUES ('JNE Regular (Dummy)', 'Ekspedisi', '02129278888', 'JNE Express', 'Aktif');

IF NOT EXISTS (SELECT 1 FROM dbo.KURIR WHERE Nama_Kurir = 'SiCepat BEST (Dummy)')
    INSERT INTO dbo.KURIR (Nama_Kurir, Jenis_Kurir, No_Telp, Nama_Perusahaan, Status_Kurir)
    VALUES ('SiCepat BEST (Dummy)', 'Ekspedisi', '02150200050', 'SiCepat', 'Aktif');
GO
