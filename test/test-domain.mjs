import assert from 'node:assert';
import { Persediaan } from '../src/server/domain/Persediaan.ts';
import { DiskonNominal, DiskonPersen, TanpaDiskon } from '../src/server/domain/Diskon.ts';
import { PembayaranTunai, PembayaranTransfer, PembayaranQris, MetodePembayaranFactory } from '../src/server/domain/MetodePembayaran.ts';
import { Pengiriman } from '../src/server/domain/Pengiriman.ts';
import { Penjualan, DetailPenjualan } from '../src/server/domain/Penjualan.ts';
import { Pengguna } from '../src/server/domain/Pengguna.ts';
import { KirimKurir, AmbilDiToko } from '../src/server/domain/SerahTerima.ts';
import { LaporanPenjualan } from '../src/server/domain/LaporanPenjualan.ts';
import bcrypt from 'bcryptjs';

console.log("==================================================");
console.log("UNIT TESTING: ATURAN BISNIS & 8 PRINSIP OOP (PRD v1.2)");
console.log("==================================================");

// 1. Encapsulation: Persediaan (AC-29)
console.log("\n[1] Testing Persediaan (Encapsulation)...");
const p = new Persediaan(1, 101, 10, 10, 3);
assert.strictEqual(p.stokTersedia, 10);
assert.strictEqual(p.menipis, false);

p.kurangi(7);
assert.strictEqual(p.stokTersedia, 3);
assert.strictEqual(p.menipis, true); // <= 3

assert.throws(() => {
  p.kurangi(5); // Melebihi sisa 3
}, (err) => {
  assert.strictEqual(err.kode, "ERR-STK-02");
  return true;
});
console.log("✓ Persediaan berhasil menjaga stok tidak pernah minus!");

// 2. Polymorphism & Overriding: MetodePembayaran (AC-30)
console.log("\n[2] Testing MetodePembayaran (Polymorphism & Overriding)...");
const tunai = MetodePembayaranFactory.dari("Tunai");
const transfer = MetodePembayaranFactory.dari("Transfer");
const qris = MetodePembayaranFactory.dari("QRIS");

// Tunai cukup
const hasilTunai = tunai.proses(50000, 70000);
assert.strictEqual(hasilTunai.dibayar, 70000);
assert.strictEqual(hasilTunai.kembalian, 20000);

// Tunai kurang -> ERR-KSR-01
assert.throws(() => {
  tunai.proses(50000, 40000);
}, (err) => {
  assert.strictEqual(err.kode, "ERR-KSR-01");
  return true;
});

// Transfer & QRIS -> kembalian 0
const hasilTransfer = transfer.proses(50000);
assert.strictEqual(hasilTransfer.kembalian, 0);
assert.strictEqual(hasilTransfer.dibayar, 50000);

const hasilQris = qris.proses(50000);
assert.strictEqual(hasilQris.kembalian, 0);
console.log("✓ Polimorfisme & Overriding metode pembayaran valid!");

// 3. Polymorphism & Overriding: Diskon (AC-31)
console.log("\n[3] Testing Diskon (Polymorphism & Overriding)...");
const diskonPersen = new DiskonPersen(10);
diskonPersen.validasi(100000);
assert.strictEqual(diskonPersen.hitung(100000), 10000);

// Diskon persen > 100 -> ERR-KSR-02
assert.throws(() => {
  const dSalah = new DiskonPersen(101);
  dSalah.validasi(100000);
}, (err) => {
  assert.strictEqual(err.kode, "ERR-KSR-02");
  return true;
});

// Diskon nominal > subtotal -> ERR-KSR-02
assert.throws(() => {
  const dNominalSalah = new DiskonNominal(150000);
  dNominalSalah.validasi(100000);
}, (err) => {
  assert.strictEqual(err.kode, "ERR-KSR-02");
  return true;
});
console.log("✓ Polimorfisme & Overriding diskon valid!");

// 4. Encapsulation: Pengiriman status transitions (AC-23)
console.log("\n[4] Testing Pengiriman Status Transition (Encapsulation)...");
const shp = new Pengiriman(1, "RS-001", "Diproses");
assert.strictEqual(shp.status, "Diproses");

// Diproses -> Dikirim (Valid)
shp.pindahKe("Dikirim");
assert.strictEqual(shp.status, "Dikirim");

// Dikirim -> Terkirim (Valid)
shp.pindahKe("Terkirim");
assert.strictEqual(shp.status, "Terkirim");
assert.ok(shp.tanggalDiterima !== null);

// Terkirim -> Diproses (Illegal -> ERR-SHP-03)
assert.throws(() => {
  shp.pindahKe("Diproses");
}, (err) => {
  assert.strictEqual(err.kode, "ERR-SHP-03");
  return true;
});
console.log("✓ Urutan status pengiriman Diproses -> Dikirim -> Terkirim terjaga!");

// 5. Composition & Calculation: Penjualan + DetailPenjualan
console.log("\n[5] Testing Penjualan & DetailPenjualan (Composition)...");
const kasir = new Pengguna(1, "Staff", "adminops", "admin@test.com", "hash", "Staff");
const trx = new Penjualan("PJ-001", kasir);

trx.tambahItem(new DetailPenjualan(1, 2, 10000, 0, "Roti Cokelat"));
trx.tambahItem(new DetailPenjualan(2, 1, 35000, 0, "Bolu Pandan"));

assert.strictEqual(trx.subtotal, 55000);
trx.terapkanDiskon(new DiskonNominal(5000));
trx.setOngkir(10000);

assert.strictEqual(trx.total, 60000); // 55000 - 5000 + 10000
console.log("✓ Komposisi Penjualan dan kalkulasi total berhasil!");

// 6. Encapsulation: Pengguna password & DTO (AC-36)
console.log("\n[6] Testing Pengguna (Encapsulation)...");
const hash = bcrypt.hashSync("Rahasia123!", 8);
const user = new Pengguna(2, "Owner Sri", "owner", "owner@rotisahabat.test", hash, "Owner");

const isValidPass = await user.verifikasiPassword("Rahasia123!");
assert.strictEqual(isValidPass, true);

const isWrongPass = await user.verifikasiPassword("Salah!");
assert.strictEqual(isWrongPass, false);

const dto = user.toDto();
assert.strictEqual(dto.hasOwnProperty("Password_Hash"), false);
assert.strictEqual(dto.hasOwnProperty("passwordHash"), false);
assert.strictEqual(dto.username, "owner");
console.log("✓ Hash password terenkapsulasi dan tidak pernah bocor ke DTO!");

// 7. Polymorphism: SerahTerima (AC-22)
console.log("\n[7] Testing SerahTerima (Polymorphism)...");
const ambil = new AmbilDiToko();
ambil.validasi(); // Tidak melempar error

const kirimLengkap = new KirimKurir({
  nama: "Alya",
  telepon: "08123456789",
  alamat: "Jl. Mawar No. 3",
  kota: "Kebumen",
});
kirimLengkap.validasi(); // Valid

assert.throws(() => {
  const kirimKosong = new KirimKurir({
    nama: "",
    telepon: "",
    alamat: "",
    kota: "",
  });
  kirimKosong.validasi();
}, (err) => {
  assert.strictEqual(err.kode, "ERR-SHP-01");
  return true;
});
console.log("✓ Validasi SerahTerima berhasil!");

// 8. Aggregation: LaporanPenjualan
console.log("\n[8] Testing LaporanPenjualan (Aggregation)...");
const laporan = new LaporanPenjualan(
  new Date(),
  new Date(),
  [
    { idPenjualan: 1, kodePenjualan: "PJ-1", totalPenjualan: 50000, subtotal: 50000, diskon: 0, biayaLain: 10000, tanggal: new Date() },
    { idPenjualan: 2, kodePenjualan: "PJ-2", totalPenjualan: 30000, subtotal: 30000, diskon: 0, biayaLain: 0, tanggal: new Date() },
  ],
  []
);
assert.strictEqual(laporan.jumlahTransaksi, 2);
assert.strictEqual(laporan.totalPenjualan, 80000);
assert.strictEqual(laporan.totalPenjualanBarang, 70000); // 80000 - 10000
console.log("✓ Agregasi LaporanPenjualan berhasil!");

console.log("\n==================================================");
console.log("SEMUA PENGUJIAN DOMAIN & ATURAN BISNIS LULUS (100%)");
console.log("==================================================");
