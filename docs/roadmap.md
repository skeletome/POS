# Roadmap POS Kasir — Fitur Masa Depan

**Versi:** 1.0
**Status:** Draft
**Sumber:** Audit codebase + daftar Non-Goals di `docs/prd-pos-kasir.md` §3
**Tanggal:** 10 September 2026

---

# 1. Konteks

MVP POS Kasir sudah mencakup:

- **Auth & roles** — login (rate-limited), role `OWNER` / `CASHIER`.
- **Menu** — CRUD produk, kategori, product options; harga dine-in/takeaway; photo/emoji; toggle aktif.
- **POS** — cart, customization, tipe order dine-in/takeaway, pajak dine-in & takeaway, pembayaran cash / bank transfer / QRIS, snapshot transaksi.
- **Transaksi** — riwayat lengkap (filter, search, sort, pagination 30), detail, ubah status, cancel, cetak struk.
- **Laporan** — dashboard (jumlah transaksi, total omset, tren, top produk, breakdown pembayaran) & halaman reports.
- **Pengaturan** — profil store, logo, pajak, metode pembayaran, bank, QRIS, kelola kasir.
- **Keamanan backend** — RLS Supabase aktif, validasi Zod, write data penting dibatasi `isOwner`, rate-limit login, `requireStoreContext` di semua route data.

Item di bawah adalah kandidat yang **tidak termasuk MVP** (sesuai Non-Goals PRD) tetapi patut direncanakan. Prinsip arsitektur tetap: konsep `Store` agar siap multi-store.

---

# 2. Label Prioritas

| Label | Makna |
|---|---|
| **P0** | Dibutuhkan agar sistem layak untuk operasional toko nyata (bukan demo). |
| **P1** | Penguatan operasional restoran/kafe dan kontrol manajemen. |
| **P2** | Pengembangan lanjut / diferensiasi skala besar. |

Setiap item dilengkapi acceptance criteria yang dapat diverifikasi secara teknis.

---

# 3. P0 — Prasyarat Operasional Toko Nyata

## 3.1 Inventory & Stok

**Deskripsi:** Kelola stok produk; transaksi yang diselesaikan otomatis mengurangi stok; peringatan stok menipis (low-stock) di dashboard; stok opname (penyesuaian stok fisik).

**Dampak skema/data:**
- `products`: tambah kolom `stock` (nullable), `low_stock_threshold` (nullable), `track_stock` (boolean).
- Tabel baru `stock_movements` (produk, qty, jenis: `SALE / PURCHASE / ADJUSTMENT / RETURN`, ref transaksi, dicatat oleh user, timestamp).
- Tabel `stock_opnames` (produk, stok sistem vs fisik, selisih, catatan).

**Role & permission:** Kasir otomatis menurunkan stok (via server, bukan client). Hanya OWNER yang boleh stok opname/admin—justment.

**Catatan RLS:** `stock_movements` di-scope by `store_id`; pengurangan stok dieksekusi di server (route transaksi), jangan pernah dari client.

**Acceptance criteria:**
1. Produk bertipe `track_stock` menolak checkout melebihi stok (`qty > stock` → error).
2. Transaksi selesai → `stock` produk berkurang tepat sesuai qty item.
3. Retur → stok kembali bertambah.
4. Produk dengan `stock <= low_stock_threshold` muncul di indikator "Stok menipis" pada dashboard/menu.
5. Semua perubahan stok tercatat di `stock_movements` dengan pelaku & timestamp.
6. Hanya OWNER dapat membuat adjustment/opname; kasir tidak.

## 3.2 Retur / Refund

**Deskripsi:** Pisahkan **cancel** (seluruh transaksi batal di awal) dan **refund** (pengembalian sebagian/sebagian item setelah transaksi selesai). Refund harus mencatat alasan, item yang dikembalikan, dan nominal; mengembalikan stok bila barang dikembalikan.

**Dampak skema/data:**
- Tabel `returns` (transaction_id, jumlah, alasan, dicatat oleh user, timestamp, status refund tersimpan di snapshot).
- Hubungan refund → `stock_movements` (jenis `RETURN`) bila fitur stok aktif (item 3.1).

**Role & permission:** OWNER dan CASHIER dapat membuat refund, tapi **cancel** tetap terbatas (lihat acceptance criteria).

**Catatan RLS:** insersi `returns` hanya dari server route transaksi; snapshot total transaksi tidak boleh berubah, refund dicatat terpisah agar riwayat tetap integritas.

**Acceptance criteria:**
1. Transaksi berstatus `COMPLETED` → bisa refund sebagian per item (qty & nominal dihitung ulang terhadap snapshot).
2. Refund tercatat dengan alasan wajib, pelaku, dan timestamp; struk/riwayat menampilkan entri refund.
3. Refund item → stok bertambah kembali (jika tracking stok aktif).
4. Cancel seluruh transaksi tetap satu alur (status `CANCELLED`), kini disertai alasan wajib + pelaku.
5. Laporan revenue tidak menghitung ulang transaksi lama; nilai bersih diperoleh dari koreksi refund (kolom `refunded` di laporan).

## 3.3 Diskon & Voucher

**Deskripsi:** Diskon per item dan per transaksi (persen & nominal), serta voucher kode (sekali pakai, kadaluarsa, minimum pembelian), ditampilkan transparan di ringkasan dan struk.

**Dampak skema/data:**
- Tabel `discounts` / `vouchers` (kode, tipe `PERCENT / FIXED`, nilai, min subtotal, max diskon, masa berlaku, kuota, aktif).
- `transactions`: tambah kolom `discount_amount`, `voucher_id`.

**Role & permission:** Hanya OWNER yang membuat/mengedit voucher & aturan diskon. Kasir hanya menerapkan pada transaksi.

**Acceptance criteria:**
1. Diskon menurunkan subtotal sebelum pajak; struk menampilkan rincian diskon.
2. Voucher kadaluarsa / melebihi kuota / di bawah min subtotal ditolak dengan pesan jelas.
3. Voucher sekali pakai tidak dapat dipakai dua kali.
4. Laporan menampilkan total diskon & voucher terpakai per periode.
5. Edit harga produk oleh kasir tetap dilarang; diskon tidak dapat melewati batas (mis. diskon negatif / melebihi total).

## 3.4 Shift Kasir & Laci Uang (X/Z Report)

**Deskripsi:** Kasir membuka/menutup shift dengan saldo awal; laporan per shift (X-report sementara, Z-report final saat tutup) berisi total penjualan per metode pembayaran, diskon, refund, dan setoran.

**Dampak skema/data:**
- Tabel `shifts` (kasir, `opened_at`, `closed_at`, `opening_balance`, `closing_balance`, `expected`, `actual`, status).
- `transactions`: tautkan `shift_id` saat kasir bertransaksi.

**Role & permission:** Kasir membuka/tutup shift miliknya; hanya OWNER melihat semua shift & laporan gabungan.

**Acceptance criteria:**
1. Kasir tidak dapat memulai transaksi jika tidak ada shift terbuka miliknya (atau ada kebijakan shift bersama yang dicatat).
2. X-report menampilkan total s.d. waktu itu; Z-report final & mengunci shift (tidak dapat diubah).
3. Laporan shift merinci: saldo awal, penjualan per metode (cash/transfer/QRIS), diskon, refund, total setoran.
4. Kasir kedua tidak dapat menutup shift kasir lain.
5. Semua shift terekam di riwayat dan dapat dilihat OWNER.

---

# 4. P1 — Penguatan Operasional Restoran/Kafe

## 4.1 Manajemen Meja & Split Bill

**Deskripsi:** Nomor/management meja untuk dine-in; pindah meja; split pembayaran (satu tagihan dipecah).

**Dampak skema/data:**
- Tabel `tables` (nomor/QR meja, kapasitas, status), `transactions.order_type = DINE_IN` menautkan `table_id`.
- Simpan relasi split-bill ke transaksi gabungan.

**Acceptance criteria:**
1. Meja dapat di-reserve/diisi & dilepas; status meja terlihat di POS.
2. Satu meja dapat punya beberapa transaksi (split) tanpa kehilangan snapshot.
3. Struk menampilkan nomor meja.

## 4.2 Hold / Resume Order

**Deskripsi:** Simpan sementara cart yang belum selesai (mis. menunggu pelanggan memutuskan), lanjutkan kapan pun dalam sesi.

**Acceptance criteria:**
1. Kasir bisa "hold" cart & melihat daftar order tertahan.
2. Resume mengembalikan item, customization, dan tipe order lengkap.
3. Order tertahan kedaluwarsa otomatis (configure!) lalu dibersihkan.

## 4.3 Customer & Membership / Loyalty

**Deskripsi:** Basis pelanggan sederhana (nama, nomor HP), riwayat pembelian per pelanggan, poin loyalitas, dan diskon member.

**Dampak skema/data:**
- Tabel `customers` (nama, phone, poin, tier), tautan di `transactions.customer_id`.

**Acceptance criteria:**
1. Kasir dapat memilih/membuat pelanggan saat transaksi.
2. Poin bertambah per transaksi (aturan terpusat), dapat ditukar diskon.
3. Riwayat pembelian per pelanggan tersedia di detail pelanggan.
4. Data pelanggan di-scope by `store_id` (RLS).

## 4.4 Audit Log

**Deskripsi:** Jejak siapa mengubah apa (harga produk, cancel, refund, setoran, perubahan settings).

**Dampak skema/data:**
- Tabel `audit_logs` (user, aksi, entity, entity_id, before/after (JSON), timestamp).

**Acceptance criteria:**
1. Setiap mutasi sensitif (harga, cancel, refund, settings, shift) wajib menulis audit log.
2. OWNER dapat melihat riwayat audit per entitas; kasir tidak dapat mengubah/menghapus log.

## 4.5 Ekspor Laporan & Ringkasan Pajak

**Deskripsi:** Ekspor transaksi & laporan (produk, pembayaran) ke CSV/Excel; ringkasan pajak penghasilan per periode untuk pembukuan.

**Acceptance criteria:**
1. Ekspor menghasilkan file CSV/Excel yang isinya sama dengan tampilan laporan (bukan data mentah mentah).
2. Ringkasan pajak per periode (dine-in vs takeaway, total DPP & PPN) tersedia & dapat diekspor.

---

# 5. P2 — Pengembangan Lanjut

| Fitur | Deskripsi singkat |
|---|---|
| **Multi-cabang** | Satu akun OWNER mengelola beberapa store; report gabungan per cabang. Arsitektur `Store` sudah mendukung arah ini (PRD §3). |
| **Kitchen Display System (KDS)** | Status order diteruskan ke dapur (new → preparing → served) sesuai tipe order. |
| **Barcode / SKU** | Kode produk (barcode/SKU) untuk scan cepat di POS & pencarian. |
| **Role granular & permission** | Ganti role hardcoded dengan permission-based RBAC (mis. manager, kitchen staff). |
| **Printer termal ESC/POS** | Konfigurasi printer thermal untuk struk & laporan kasir. |
| **Perlengkapan kasir** | Integrasi laci uang, slip kedapatan. |

---

# 6. Non-Fungsional (disarankan dicatat di PRD)

- **Test suite & linter** — hari ini tidak ada test runner maupun ESLint; setiap perubahan berisiko regresi. Tambahkan minimal lint + unit test untuk `lib/api` dan route transaksi.
- **Guard global API** — tambah `middleware.ts` agar seluruh `/api/*` wajib `requireStoreContext` kecuali `/api/auth/login` (saat ini proteksi hanya per-route).
- **Backup & retensi data** — kebijakan backup DB dan retensi data transaksi/laporan.
- **Observability** — error tracking & logging terpusat untuk route API.

---

# 7. Jangan Dikerjakan (keputusan tercatat)

Perubahan berikut **sengaja tidak dilakukan** dan tidak boleh dibatalkan tanpa kesepakatan baru:

- **3 celah keamanan Database** yang pernah diidentifikasi — dibiarkan sesuai keputusan.
- **Rate-limiter tanpa fail-open** — `rateLimit()` di `lib/rate-limit.ts` dibiarkan apa adanya (tidak ditambahkan try/catch fail-open).
- Fitur yang masih di Non-Goals PRD dan belum masuk daftar prioritas ini (mis. payment gateway, integrasi API bank, accounting/payroll) tidak dikerjakan oleh MVP.