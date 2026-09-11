# Prompt Log — POS Kasir

Riwayat hasil setiap prompt/tugas. **Append-only:** entri baru selalu ditambahkan
di paling bawah; entri lama tidak boleh dihapus/diubah. Format & aturan: lihat
skill `append-notes`.

---

## [2026-09-11] — Implementasi Diskon Produk & Voucher (roadmap 3.3)

**Prompt:** "Implement diskon produk + voucher (owner mengelola, kasir memakai) hingga build hijau, update PRD & docs. Tulis ringkasan di memori."

**Yang diubah:**
- `supabase/migrations/20260911000001_discount_vouchers.sql` — tabel `product_discounts`, `product_discount_items`, `vouchers` + RLS + kolom snapshot di `transactions` + `create_transaction` memvalidasi voucher & menghitung ulang diskon server-side
- `lib/pricing.ts` — helper klien `computePricing`/`validateVoucher` (identik dengan RPC)
- `lib/schemas/` (`discount.ts`, `voucher.ts`, `index.ts`) — schema create & update, `optionalNumber`, export update schema
- `lib/types/` (`discount.ts`, `voucher.ts`, `index.ts`) — tipe ProductDiscount/Voucher + timeout transaction
- `app/api/discounts/`, `app/api/vouchers/` — route CRUD (borrowed schema pattern dari products), PATCH parsial
- `app/api/transactions/route.ts` — terima `voucherCode`, panggil RPC
- `lib/api/keys.ts`, `lib/api/hooks.ts`, `lib/use-pos-store.ts`, `components/data-loader.tsx` — state & query discounts/vouchers
- `app/(app)/promo/page.tsx` — halaman kelola promo & voucher (OWNER only, 2 tab, CRUD + toggle + konfirmasi hapus)
- `components/app-shell.tsx` — nav "Promo & Diskon"
- `components/pos/product-grid.tsx` — badge diskon + harga coret
- `components/pos/cart-panel.tsx` — input voucher + validasi live + ringkasan diskon
- `components/pos/receipt-pdf.tsx`, `app/(app)/transactions/[id]/page.tsx`, `lib/dummy-data.ts` — snapshot & tampilan diskon
- `docs/prd-pos-kasir.md` — section baru #21 (PROMO-001..008) & #22 (VOUCHER-001..009) + renumber seluruh section
- `docs/database.md`, `docs/backend-rules.md`, `docs/roadmap.md` — sinkronisasi skema & aturan; roadmap 3.3 ditandai selesai

**Perbaikan durante:** export schema update yg hilang; `TransactionCreateInput` import di hooks; destructure `baseSubtotal` di cart-panel; resolver type di promo page.

**Verifikasi:** build ✓ (`npm run build`, 29 route, TypeScript clean)

**Lanjutan:** perubahan belum di-commit (tunggu instruksi user); laporan total diskon per periode belum ada.

---

## [2026-09-11] — Commit & push Diskon/Voucher ke development + main

**Prompt:** "push ke development dan merge main dengan development"

**Yang diubah:**
- Commit `c248c62` di branch `development` (51 file, +3084 −195) berisi seluruh fitur Diskon & Voucher + feature mini (sound/theme toggle) + `docs/prompt-log.md` + aturan append-notes di `AGENTS.md`.
- `development` dan `main` di-remote diperbarui via fast-forward (`d72f395..c248c62`), keduanya kini sama-sama `c248c62`.

**Verifikasi:** `git push origin development` ✓, `git merge development` (main) fast-forward ✓, `git push origin main` ✓. Tidak ada file `.env*`/secret ter-stage.

**Lanjutan:** migration V7 (`20260911000001_discount_vouchers.sql`) masih **belum diterapkan** ke DB supabase database (rencana: SQL Editor Dashboard) — setelah itu `/promo` bisa dipakai.

---

## [2026-09-12] — Alur stok Model 1 masuk ke PRD

**Prompt:** "Tambahkan alur stok ini dalam PRD" (setelah konfirmasi scope Model 1 + fitur pelengkap: halaman /stok & riwayat, tambah stok barang masuk, opname, indikator dashboard + filter menu).

**Yang diubah:**
- `docs/prd-pos-kasir.md` — sisip section baru `# 23. Manajemen Stok Produk` (definisi stok per produk jadi, diagram alur PURCHASE/SALE/RETURN/ADJUST/OPNAME → ledger immutable, tabel acceptance `STOK-001..011`) + renumber heading `# 23..#58` → `# 24..#59` (regex .NET UTF-8 tanpa BOM, verifikasi `git diff` hanya nomor heading berubah).
- `docs/prd-pos-kasir.md` — sinkronisasi: `PRODUCT-006` (stock tracking opsional), block `### Stok` di DoD, langkah stok di MVP User Journey (Owner & kasir), ringkasan scope `├── Stock`, boundary Final MVP (qualify "inventory bahan baku/BOM"), Future Roadmap (V2 `~~Inventory~~ ✓ Implemented`), Product Principles (#2 tambah Stock; blok NO RECIPE/BOM INVENTORY).

**Verifikasi:** `git diff` bersih — 36 heading direnumber (tanpa mojibake), sisip + konsistensi rapi.

---

## [2026-09-12] — Implementasi fitur stok Model 1 (roadmap 3.1)

**Prompt:** "lanjut" — eksekusi implementasi fitur stok sesuai scope yang disepakati (halaman /stok + riwayat, tambah stok barang masuk, opname, indikator dashboard + filter menu, cancel→restock, badge POS + cap qty).

**Yang diubah:**
- `supabase/migrations/20260912000001_inventory.sql` (baru) — kolom `products` (`track_stock`, `stock` CHECK ≥0, `low_stock_threshold`); tabel `stock_movements` (ledger immutable: SALE/RETURN/PURCHASE/ADJUSTMENT/OPNAME, quantity bertanda, `balance_after`, RLS select-member/insert-owner, tanpa update/delete); `create_transaction` memotong stok atomik (`FOR UPDATE` + tolak oversell + log SALE); RPC `cancel_transaction` (owner, batal+restock RETURN atomik & idempotent); RPC `stock_mutation` (owner, PURCHASE/ADJUST/OPNAME, note wajib selain PURCHASE)
- `lib/schemas/product.ts` — `trackStock/stock/lowStockThreshold` di Product/ProductInput; `lib/schemas/stock.ts` (baru) — `stockMutationSchema` + interface `StockMovement`
- `lib/api/products.ts` — pass-through kolom stok + filter `stockStatus=LOW|OUT` (server-side) di `listProductsPage`
- `app/api/products/route.ts` — terima param `stockStatus`
- `app/api/stock/route.ts` + `app/api/stock/movements/route.ts` (baru) — POST mutasi (owner) & GET riwayat (member, filter productId/type/from/to/limit)
- `app/api/transactions/[id]/route.ts` — PATCH CANCELLED → RPC `cancel_transaction` (restock otomatis)
- `lib/api/keys.ts`, `lib/api/hooks.ts` — `useStockMovements`/`useStockMutation` + `invalidateStockChanges`/`fetchProductsIntoStore`; invalidate movements saat cancel
- `lib/use-pos-store.ts` — state + `setProducts`
- `app/(app)/stok/page.tsx` (baru) — ringkasan (dilacak/total/menipis/habis), tabel stok + aksi mutasi, riwayat ledger + filter, modal mutasi (PURCHASE/ADJUST/OPNAME, owner-only)
- `components/app-shell.tsx` — nav "Stok"
- `components/pos/product-grid.tsx` — badge stok + disable "habis"; `components/pos/product-modal.tsx` & `cart-panel.tsx` — cap qty sesuai stok
- `app/(app)/menu/page.tsx` — kolom Stok + filter `stockStatus` + blok "Manajemen Stok" di form produk (toggle + stok awal + ambang)
- `app/(app)/dashboard/page.tsx` — alert "Stok menipis/habis" + link /stok
- `lib/dummy-data.ts` — 11 produk diberi field stok (beberapa menipis/habis utk demo)
- `docs/database.md`, `docs/backend-rules.md`, `docs/roadmap.md` — skema (stock_movements + index), matriks akses & aturan (11-13), roadmap 3.1 ditandai ✅ (catatan: `stock_opnames` deviasi → pakai tipe OPNAME di ledger)

**Verifikasi:** build ✓ (`npm run build`, 32 route, TypeScript clean)

**Lanjutan:** migration V8 **belum diterapkan** ke DB supabase (rencana: SQL Editor Dashboard) — setelah itu /stok, cancel→restock, dan potongan stok otomatis aktif. Perubahan belum di-commit (tunggu instruksi user).

---

## [2026-09-12] — Fix tabel riwayat halaman /stok

**Prompt:** user melaporkan error tabel di `/stok`: "Column with id 'productName' does not exist", "Column with id 'balanceAfter' does not exist", dan "Received NaN for the children".

**Yang diubah:**
- `app/(app)/stok/page.tsx` — kolom `product` & `balance` di `movementColumns` memakai `id` yang beda dari `accessorKey`, padahal `cell` membaca via `row.getValue("<accessorKey>")`; TanStack mengenali kolom berdasarkan `id`. Fix: `id: "product"` → `"productName"` dan `id: "balance"` → `"balanceAfter"` (getValue berhasil, NaN hilang). Kolom lain sudah `id` = `accessorKey`.

**Verifikasi:** build ✓ (`npm run build`, TypeScript clean)
**Lanjutan:** migration V8 belum diterapkan; belum commit (tunggu instruksi user).

**Lanjutan:** belum commit (tunggu instruksi). Implementasi fitur stok (migration V8, `/api/stock`, halaman `/stok`, badge POS, toggle & filter menu, kartu dashboard, cancel restock) masih antre — migration V8 nanti di-apply manual via SQL Editor seperti V7.