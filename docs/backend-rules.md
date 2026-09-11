# Backend Rules — POS Kasir

Ringkasan aturan backend: **Route Handlers Next.js** memvalidasi dengan zod (reuse `lib/schemas`), memanggil `@supabase/supabase-js` memakai sesi user (RLS aktif). `service_role` **hanya** untuk `POST /api/cashiers` dan `scripts/seed.mjs`.

---

## 1. Autentikasi

- Metode: **Supabase Auth, email + password** (`signInWithPassword`).
- Session dikelola cookie via `@supabase/ssr` (`createServerClient`).
- `proxy.ts` (pengganti middleware di Next 16) mem-redirect ke `/login` jika tidak ada sesi (route `(app)`).
- Route handler memakai helper `getServerSupabase()` + `requireAuth()`.
- Logout: `signOut()` + clear cookie + reset Zustand.

## 2. Authorization Matrix

Basis: RLS (`is_store_member` / `is_store_owner`). Layer kedua = pengecekan role di route handler.

| Resource | OWNER | CASHIER |
|---|---|---|
| Dashboard / POS / Transaksi (read) | ✅ | ✅ |
| Buat transaksi (POS checkout) | ✅ | ✅ |
| Ulas/lihat detail transaksi | ✅ | ✅ |
| Menambah/mengubah/nonaktifkan produk | ✅ | ❌ |
| Mengelola kategori | ✅ | ❌ |
| Mengelola product options | ✅ | ❌ |
| Mengelola bank | ✅ | ❌ |
| Mengubah store settings / tax / payment | ✅ | ❌ |
| Mengelola cashier (buat/nonaktif) | ✅ | ❌ |
| Mengelola promo diskon & voucher (CRUD) | ✅ | ❌ |
| Memakai voucher saat checkout | ✅ | ✅ |

RLS memastikan **authorization tidak bisa di-bypass dari client** — role frontend hanya untuk UI.

## 3. API Surface

Base: `/api`. Semua route mewajibkan sesi kecuali disebut tidak.

| Route | Method | Auth | Fungsi |
|---|---|---|---|
| `/api/me` | GET | member | profile + membership + store (via `get_my_context`) |
| `/api/products` | GET | member | list produk (termasuk optionGroups) |
| `/api/products` | POST | owner | buat produk + option groups/options |
| `/api/products/[id]` | PATCH | owner | update produk + replace option groups |
| `/api/products/[id]` | DELETE | owner | soft delete (active=false) |
| `/api/categories` | GET/POST | member/owner | list & buat kategori |
| `/api/categories/[id]` | PATCH | owner | edit kategori |
| `/api/options` | GET | member | list option groups + options |
| `/api/store` | GET/PATCH | member/owner | settings toko (name, info, tax, payment, qris) |
| `/api/banks` | GET/POST | member/owner | list & tambah bank |
| `/api/banks/[id]` | PATCH | owner | edit nama/logo/status bank |
| `/api/transactions` | GET | member | list transaksi (+items) |
| `/api/transactions` | POST | member | buat transaksi (panggil RPC `create_transaction`) |
| `/api/transactions/[id]` | GET | member | detail + items |
| `/api/transactions/[id]` | PATCH | member | ubah status (CANCELLED) |
| `/api/reports` | GET | member | agregat dashboard/laporan per rentang |
| `/api/cashiers` | GET | owner | list kasir (via `get_store_cashiers`) |
| `/api/cashiers` | POST | owner | create auth user + membership (service_role) |
| `/api/upload` | POST | member | upload gambar → return URL |
| `/api/discounts` | GET/POST | member/owner | list & buat promo diskon produk |
| `/api/discounts/[id]` | PATCH | owner | ubah promo (bisa partial, mis. toggle aktif) |
| `/api/discounts/[id]` | DELETE | owner | hapus promo |
| `/api/vouchers` | GET/POST | member/owner | list & buat voucher |
| `/api/vouchers/[id]` | PATCH | owner | ubah voucher (bisa partial, mis. toggle aktif) |
| `/api/vouchers/[id]` | DELETE | owner | hapus voucher |

### Format respons

```jsonc
// sukses
{ "data": { … } }
// error
{ "error": { "message": "…", "code": "…" } }
```

### Validasi input

Semua body divalidasi zod (skema di `lib/schemas`).
- Produk: `productSchema` (+ refine minimal 1 order type).
- Transaksi item: bentuk `TransactionItem` (server menghitung ulang total).
- Kategori: `categoryCreateSchema`. Bank: `bankCreateSchema`. Cashier: `cashierCreateSchema`.

## 4. Business Rules (dipaksa di server)

1. Setiap data bisnis memiliki `store_id` milik tenant user (RLS).
2. User hanya bisa data store tempat ia member (RLS).
3. **Total transaksi dihitung ulang di DB** (`create_transaction`): subtotal, tax_rate (snapshot dari `stores`), tax_amount, total — nilai client tidak dipercaya.
4. **Diskon & voucher divalidasi di DB** (`create_transaction`): diskon produk aktif dihitung per item (diskon terbesar jika tumpang tindih), voucher divalidasi (aktif/periode/min subtotal/kuota), `used_count` dinaikkan atomik dalam transaksi DB yang sama. `discount_amount` + `voucher_code` disimpan sebagai snapshot.
5. Produk inactive **tidak bisa** masuk transaksi baru (route handler memfilter + validasi).
6. Cash: `amountPaid < total` → **ditolak** (route handler cek sebelum RPC).
7. Prodok/option/tax disimpan sebagai **snapshot** di `transactions` / `transaction_items`.
8. `transaction_no` `TRX-XXXX` unik per store (sequence lock di DB).
9. Validasi `active`/format di level DB juga (CHECK constraints, enum).
10. Kode voucher **uppercase & unik per store** (`UNIQUE (store_id, code)`); konflik/pernah dipakai → 409.

## 5. Idempotency & Integritas

- `create_transaction` atomik (single RPC): dapat nomor TRX + insert txn + items dalam satu transaksi DB. Gagal → tidak ada partial write.
- Duplikat pencegahan: tidak ada retry otomatis di sisi client; owner/cashier hanya bisa kirim sekali submit saat checkout sukses (clear cart).

## 6. Storage Rules

- Bucket: `product-images`, `bank-logos`, `qris-images`, `store-logos` (public).
- Path: `{store_id}/{uuid}.{ext}` — tidak ada user-controlled path.
- Type: image (png/jpg/webp), max 2MB (validasi di `POST /api/upload`).
- Upload `storage.objects` RLS: hanya `authenticated`.

## 7. Env & Keamanan

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — aman untuk client.
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**; TIDAK pernah dipakai oleh `createBrowserClient`. Hanya di route `/api/cashiers` (create user) + seed script.
- `requireAuth()` menolak 401 bila token invalid/expired.
- `next.config.ts` tidak mengekspos env apa pun; `.env*` di-gitignore.

## 8. Seed (development)

`npx supabase db push` → migrate. Lalu `npm run seed` (satu kali):
- Owner demo: `owner@pos.local` / `owner123` — role OWNER, store Warung Nusantara.
- Kasir demo: `kasir@pos.local` / `kasir123` — role CASHIER.