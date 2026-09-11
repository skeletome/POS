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