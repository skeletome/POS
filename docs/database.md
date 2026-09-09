# Database Design — POS Kasir

Stack: **Supabase (PostgreSQL 15)**. RLS aktif di semua tabel. Harga & pajak dalam snapshot saat transaksi dibuat.

Prinsip dari PRD yang memengaruhi skema:

1. Setiap data bisnis dimiliki sebuah `store` (`store_id`).
2. Akses user via `store_members` (role `OWNER`/`CASHIER`).
3. Transaksi menyimpan **snapshot** harga, option, dan pajak — perubahan produk/tax tidak mengubah transaksi lama.
4. `TRX-XXXX` unik **per store** (sequence terpisah).

---

## Relation Diagram

```text
auth.users
   │ 1:1
profiles ────────────────┐
   │  (user_id)          │ n:1
store_members ──────────►│
   │                     │
   ▼                     ▼
auth.uid() ──► is_store_member(store_id) ──► RLS gate ──► stores (tenant)
                                                          │
        ┌───────────┬───────────────┬───────────┬─────────┴──────────┐
        ▼           ▼               ▼           ▼                    ▼
    categories   products ─────────► banks   tax settings         (kolom di stores)
                   │               
                   ▼               
             option_groups ──► options
                   
transactions ──► transaction_items (snapshot)
store_sequences (TRX counter per store)
```

---

## Tables

### `profiles`
Semua field untuk snapshot juga disimpan terpisah agar aman dari perubahan.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → `auth.users.id` (cascade) |
| `email` | text | disalin dari auth.users pada saat user dibuat |
| `name` | text | nama tampilan |
| `created_at` / `updated_at` | timestamptz | trigger update |

### `stores` — tenant + semua settings sebagai kolom

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | = `storeSettings.storeName` |
| `information` | text | = `storeSettings.information` |
| `logo_url` | text | logo toko |
| `cash_enabled` | boolean | = `paymentSettings.cashEnabled` |
| `bank_enabled` | boolean | = `paymentSettings.bankEnabled` |
| `qris_enabled` | boolean | = `paymentSettings.qrisEnabled` |
| `qris_image_url` | text | gambar QRIS |
| `qris_name` | text | nama tampilan QRIS |
| `tax_enabled` | boolean | = `taxSettings.enabled` |
| `dine_in_tax` | numeric(5,4) | = `taxSettings.dineInRate` (0.10 = 10%) |
| `takeaway_tax` | numeric(5,4) | = `taxSettings.takeawayRate` |

### `store_members`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `store_id` | uuid FK → stores (cascade) | |
| `user_id` | uuid FK → auth.users (cascade) | |
| `role` | enum `member_role` | `OWNER` / `CASHIER` |
| `active` | boolean | nonaktif = cabut akses |
| `created_at` | timestamptz | |
| **UNIQUE** | `(store_id, user_id)` | |

### `categories`

| Column | Type |
|---|---|
| `id` uuid PK | |
| `store_id` uuid FK | |
| `name` text | |
| `active` boolean | |
| `sort_order` int | |
| `created_at` | |
| **UNIQUE** `(store_id, name)` | |

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `store_id` | uuid FK | |
| `category_id` | uuid FK → categories (SET NULL) | |
| `name` | text | |
| `description` | text | |
| `image_url` | text | path di bucket `product-images` |
| `emoji` | text | |
| `dine_in_available` | boolean | |
| `takeaway_available` | boolean | |
| `dine_in_price` | int | rupiah integer |
| `takeaway_price` | int | rupiah integer |
| `active` | boolean | |
| `created_at` / `updated_at` | | |
| **CHECK** | | `dine_in_available OR takeaway_available` — minimal satu order type |

### `option_groups` & `options`

| option_groups | options |
|---|---|
| `id` uuid PK | `id` uuid PK |
| `store_id` uuid FK | `option_group_id` uuid FK (cascade) |
| `product_id` uuid FK (cascade) | `name` text |
| `name` text | `additional_price` int (≥0) |
| `multiple` boolean | `sort_order` int |
| `sort_order` int | `created_at` |

### `banks`

| Column | Type |
|---|---|
| `id` uuid PK | |
| `store_id` uuid FK | |
| `name` text | |
| `logo_url` text (bucket `bank-logos`) | |
| `active` boolean | |
| `sort_order` int | |
| **UNIQUE** `(store_id, name)` | |

### `transactions` — snapshot utama

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `transaction_no` | text | `TRX-0001` (per store sequence) |
| `store_id` | uuid FK | |
| `cashier_id` | uuid FK → auth.users (SET NULL) | |
| `cashier_name` | text | snapshot nama kasir |
| `order_type` | enum `order_type` | `DINE_IN` / `TAKEAWAY` |
| `subtotal` | int | |
| `tax_rate` | numeric(5,4) | snapshot rate saat bayar |
| `tax_amount` | int | |
| `total` | int | |
| `payment_method` | enum `payment_method` | `CASH` / `BANK_TRANSFER` / `QRIS` |
| `payment_info` | jsonb | snapshot pembayaran |
| `status` | enum `transaction_status` | `PENDING` / `COMPLETED` / `CANCELLED` |
| `created_at` | timestamptz | |
| **UNIQUE** | `(store_id, transaction_no)` | |

**`payment_info` shape:**
```jsonc
// CASH
{ "amountPaid": 50000, "change": 13700 }
// BANK_TRANSFER
{ "bankId": "…", "bankName": "BCA" }
// QRIS
{ "qrisName": "QRIS Warung Nusantara" }
```

### `transaction_items` — snapshot item

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `transaction_id` | uuid FK → transactions (cascade) | |
| `store_id` | uuid FK | |
| `product_id` | uuid **tanpa FK** | hanya referensi, produk bisa dihapus |
| `product_name` | text | snapshot |
| `unit_price` | int | snapshot |
| `quantity` | int (>0) | |
| `selected_options` | jsonb | snapshot options |
| `subtotal` | int | |

`selected_options` shape:
```jsonc
[{ "optionId": "…", "optionName": "Jumbo", "additionalPrice": 5000 }]
```

### `store_sequences` — counter TRX per store

| Column | Type |
|---|---|
| `store_id` | uuid PK FK |
| `last_trx_no` | int |

Dipakai oleh RPC `next_transaction_no()` dengan `INSERT … ON CONFLICT DO UPDATE` (atomic, `SELECT FOR UPDATE` via row lock).

---

## Enums (Postgres `create type`)

```sql
public.member_role        ('OWNER', 'CASHIER')
public.order_type         ('DINE_IN', 'TAKEAWAY')
public.payment_method     ('CASH', 'BANK_TRANSFER', 'QRIS')
public.transaction_status ('PENDING', 'COMPLETED', 'CANCELLED')
```

---

## Functions & RPC

| Function | Security | Purpose |
|---|---|---|
| `is_store_member(store_id)` | SECURITY DEFINER | RLS: cek membership aktif |
| `is_store_owner(store_id)` | SECURITY DEFINER | RLS: cek role OWNER |
| `get_my_context()` | SECURITY DEFINER | `/api/me`: profile + membership + store |
| `get_store_cashiers(store_id)` | SECURITY DEFINER | daftar member store (owner) |
| `next_transaction_no(store_id)` | SECURITY DEFINER | increment TRX per store |
| `create_transaction(…)` | SECURITY DEFINER | insert txn + items secara atomik, hitung ulang total di DB |

`create_transaction` **selalu menghitung ulang** subtotal/tax/total dari snapshot item + rate di `stores` — nilai dari client tidak dipercaya.

---

## Indexes

```sql
idx_store_members_user          (user_id)
idx_store_members_store         (store_id)
idx_categories_store            (store_id, active)
idx_products_store_active       (store_id, active)
idx_option_groups_product       (product_id)
idx_option_groups_store         (store_id)
idx_options_group               (option_group_id)
idx_banks_store                 (store_id, active)
idx_transactions_store_created  (store_id, created_at desc)
idx_transactions_status         (store_id, status)
idx_transaction_items_transaction (transaction_id)
idx_transaction_items_store     (store_id)
```

---

## Storage Buckets (semua public)

| Bucket | Isi |
|---|---|
| `product-images` | gambar produk |
| `bank-logos` | logo bank |
| `qris-images` | gambar QRIS |
| `store-logos` | logo toko |

Path pattern: `{store_id}/{uuid}.ext`. Upload hanya untuk user terautentikasi (policies di migration V4).