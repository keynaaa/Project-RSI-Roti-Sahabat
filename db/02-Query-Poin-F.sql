/*
FILE 02 - QUERY POIN F
1. Super Admin (Owner)
2. Admin Operasional
3. Naive User / Pelanggan

*/

USE RotiSahabat;
GO

/* =========================================================
   A. SUPER ADMIN (OWNER)
   ========================================================= */

-- A1. Melihat daftar produk, kategori, varian, dan harga.
SELECT
    p.Id_Produk, p.Kode_Produk, p.Nama_Produk,
    k.Nama_Kategori, v.Nama_Varian,
    h.Harga_Jual, h.Harga_Reseller, h.Harga_Promo
FROM dbo.PRODUK p
LEFT JOIN dbo.KATEGORI k ON p.Id_Kategori = k.Id_Kategori
LEFT JOIN dbo.VARIAN_PRODUK v ON p.Id_Produk = v.Id_Produk
LEFT JOIN dbo.HARGA_PRODUK h ON v.Id_Varian = h.Id_Varian
ORDER BY p.Nama_Produk;

-- A2. Memantau jumlah dan nilai seluruh pesanan.
SELECT
    COUNT(*) AS Jumlah_Pesanan,
    SUM(Total_Pesanan) AS Total_Nilai_Pesanan
FROM dbo.PESANAN;

-- A3. Melihat laporan penjualan per cabang.
SELECT
    c.Nama_Cabang,
    COUNT(pj.Id_Penjualan) AS Jumlah_Transaksi,
    SUM(pj.Total_Penjualan) AS Total_Penjualan
FROM dbo.PENJUALAN pj
LEFT JOIN dbo.CABANG c ON pj.Id_Cabang = c.Id_Cabang
GROUP BY c.Nama_Cabang
ORDER BY Total_Penjualan DESC;

-- A4. Melihat total pengeluaran per kategori.
SELECT
    kp.Nama_Kategori,
    SUM(pg.Jumlah_Pengeluaran) AS Total_Pengeluaran
FROM dbo.PENGELUARAN pg
JOIN dbo.KATEGORI_PENGELUARAN kp
    ON pg.Id_Kategori_Pengeluaran = kp.Id_Kategori_Pengeluaran
GROUP BY kp.Nama_Kategori
ORDER BY Total_Pengeluaran DESC;

-- A5. Memantau data supplier dan jumlah pembelian.
SELECT
    s.Nama_Supplier,
    COUNT(pb.Id_Pembelian) AS Jumlah_Pembelian,
    SUM(pb.Total_Pembelian) AS Total_Pembelian
FROM dbo.SUPPLIER s
LEFT JOIN dbo.PEMBELIAN pb ON s.Id_Supplier = pb.Id_Supplier
GROUP BY s.Nama_Supplier
ORDER BY Total_Pembelian DESC;

-- A6. Melihat ringkasan hasil produksi.
SELECT
    p.Nama_Produk,
    SUM(pr.Jumlah_Rencana) AS Total_Rencana,
    SUM(pr.Jumlah_Hasil) AS Total_Hasil,
    SUM(pr.Jumlah_Gagal) AS Total_Gagal
FROM dbo.PRODUKSI pr
JOIN dbo.PRODUK p ON pr.Id_Produk = p.Id_Produk
GROUP BY p.Nama_Produk
ORDER BY p.Nama_Produk;


/* =========================================================
   B. ADMIN OPERASIONAL
   ========================================================= */

-- B1. Melihat pesanan yang masih diproses.
SELECT
    ps.Kode_Pesanan, pl.Nama_Pelanggan,
    ps.Tanggal_Pesanan, ps.Total_Pesanan, ps.Status_Pesanan
FROM dbo.PESANAN ps
JOIN dbo.PELANGGAN pl ON ps.Id_Pelanggan = pl.Id_Pelanggan
WHERE ps.Status_Pesanan IN ('Menunggu', 'Diproses')
ORDER BY ps.Tanggal_Pesanan;

-- B2. Melihat detail item pada setiap pesanan.
SELECT
    ps.Kode_Pesanan, p.Nama_Produk, v.Nama_Varian,
    dp.Jumlah_Pesanan, dp.Harga_Satuan, dp.Subtotal
FROM dbo.DETAIL_PESANAN dp
JOIN dbo.PESANAN ps ON dp.Id_Pesanan = ps.Id_Pesanan
JOIN dbo.VARIAN_PRODUK v ON dp.Id_Varian = v.Id_Varian
JOIN dbo.PRODUK p ON v.Id_Produk = p.Id_Produk
ORDER BY ps.Tanggal_Pesanan DESC;

-- B3. Memantau stok produk jadi per gudang.
SELECT
    g.Nama_Gudang, p.Nama_Produk, v.Nama_Varian,
    s.Jumlah_Stok, s.Stok_Tersedia, s.Stok_Minimum
FROM dbo.PERSEDIAAN s
JOIN dbo.GUDANG g ON s.Id_Gudang = g.Id_Gudang
JOIN dbo.VARIAN_PRODUK v ON s.Id_Varian = v.Id_Varian
JOIN dbo.PRODUK p ON v.Id_Produk = p.Id_Produk
WHERE s.Id_Varian IS NOT NULL
ORDER BY p.Nama_Produk;

-- B4. Menampilkan bahan baku yang stoknya di bawah batas minimum.
SELECT
    b.Nama_Bahan_Baku, g.Nama_Gudang,
    s.Jumlah_Stok, s.Stok_Minimum
FROM dbo.PERSEDIAAN s
JOIN dbo.BAHAN_BAKU b ON s.Id_Bahan_Baku = b.Id_Bahan_Baku
JOIN dbo.GUDANG g ON s.Id_Gudang = g.Id_Gudang
WHERE s.Id_Bahan_Baku IS NOT NULL
  AND s.Jumlah_Stok <= s.Stok_Minimum
ORDER BY s.Jumlah_Stok;

-- B5. Melihat pembelian bahan baku beserta supplier.
SELECT
    pb.Kode_Pembelian, sp.Nama_Supplier,
    pb.Tanggal_Pembelian, pb.Total_Pembelian, pb.Status_Pembelian
FROM dbo.PEMBELIAN pb
JOIN dbo.SUPPLIER sp ON pb.Id_Supplier = sp.Id_Supplier
ORDER BY pb.Tanggal_Pembelian DESC;

-- B6. Melihat status produksi.
SELECT
    pr.Kode_Produksi, p.Nama_Produk,
    pr.Tanggal_Produksi, pr.Jumlah_Rencana,
    pr.Jumlah_Hasil, pr.Status_Produksi
FROM dbo.PRODUKSI pr
JOIN dbo.PRODUK p ON pr.Id_Produk = p.Id_Produk
ORDER BY pr.Tanggal_Produksi DESC;

-- B7. Memantau status pengiriman.
SELECT
    pg.Id_Pengiriman, ps.Kode_Pesanan,
    k.Nama_Kurir, pg.Nomor_Resi,
    pg.Tanggal_Estimasi, pg.Status_Pengiriman
FROM dbo.PENGIRIMAN pg
LEFT JOIN dbo.PESANAN ps ON pg.Id_Pesanan = ps.Id_Pesanan
LEFT JOIN dbo.KURIR k ON pg.Id_Kurir = k.Id_Kurir
ORDER BY pg.Tanggal_Pengiriman DESC;


/* =========================================================
   C. NAIVE USER / PELANGGAN
   Pada aplikasi nyata, Id_Pelanggan berasal dari akun yang login.
   Untuk simulasi SSMS, ganti angka 1 dengan ID pelanggan uji coba.
   ========================================================= */

DECLARE @IdPelanggan INT = 1;

-- C1. Melihat katalog produk yang aktif.
SELECT
    p.Id_Produk, p.Nama_Produk, p.Deskripsi_Produk,
    v.Id_Varian, v.Nama_Varian, h.Harga_Jual, h.Harga_Promo
FROM dbo.PRODUK p
JOIN dbo.VARIAN_PRODUK v ON p.Id_Produk = v.Id_Produk
LEFT JOIN dbo.HARGA_PRODUK h ON v.Id_Varian = h.Id_Varian
WHERE p.Status_Produk = 'Aktif'
ORDER BY p.Nama_Produk;

-- C2. Melihat riwayat pesanan milik pelanggan.
SELECT
    Kode_Pesanan, Tanggal_Pesanan,
    Total_Pesanan, Status_Pesanan
FROM dbo.PESANAN
WHERE Id_Pelanggan = @IdPelanggan
ORDER BY Tanggal_Pesanan DESC;

-- C3. Melihat detail pesanan milik pelanggan.
SELECT
    ps.Kode_Pesanan, p.Nama_Produk, v.Nama_Varian,
    dp.Jumlah_Pesanan, dp.Harga_Satuan, dp.Subtotal
FROM dbo.PESANAN ps
JOIN dbo.DETAIL_PESANAN dp ON ps.Id_Pesanan = dp.Id_Pesanan
JOIN dbo.VARIAN_PRODUK v ON dp.Id_Varian = v.Id_Varian
JOIN dbo.PRODUK p ON v.Id_Produk = p.Id_Produk
WHERE ps.Id_Pelanggan = @IdPelanggan
ORDER BY ps.Tanggal_Pesanan DESC;

-- C4. Melihat status pengiriman pesanan milik pelanggan.
SELECT
    ps.Kode_Pesanan, pg.Nomor_Resi,
    pg.Tanggal_Estimasi, pg.Tanggal_Diterima,
    pg.Status_Pengiriman
FROM dbo.PESANAN ps
JOIN dbo.PENGIRIMAN pg ON ps.Id_Pesanan = pg.Id_Pesanan
WHERE ps.Id_Pelanggan = @IdPelanggan
ORDER BY pg.Tanggal_Pengiriman DESC;

-- C5. Melihat ulasan dan rating produk.
SELECT
    p.Nama_Produk, u.Isi_Ulasan,
    u.Nilai_Rating, u.Tanggal_Ulasan
FROM dbo.ULASAN u
JOIN dbo.PRODUK p ON u.Id_Produk = p.Id_Produk
WHERE u.Id_Pelanggan = @IdPelanggan
ORDER BY u.Tanggal_Ulasan DESC;
GO
