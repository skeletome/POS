# Product Requirements Document (PRD)

## POS Kasir

**Version:** 1.0
**Status:** Draft / MVP
**Product Type:** Web-based Point of Sale
**Target Business:** Food & Beverage Store

---

# 1. Product Overview

POS Kasir adalah aplikasi Point of Sale berbasis web yang digunakan oleh pemilik toko dan kasir untuk mengelola proses penjualan makanan dan minuman.

Sistem memungkinkan kasir memilih produk, melakukan customization, memilih tipe order dine-in atau takeaway, menghitung harga dan pajak, mengonfirmasi pembayaran, serta menyelesaikan transaksi.

Pemilik toko dapat mengelola menu, kategori, product options, pajak, bank, QRIS, user kasir, transaksi, dan laporan.

MVP berfokus pada **operasional penjualan**, bukan inventory atau payment processing.

---

# 2. Product Goals

## Primary Goals

1. Mempercepat proses transaksi.
2. Mengurangi pencatatan manual.
3. Mengurangi kesalahan perhitungan total dan kembalian.
4. Mempermudah pengelolaan menu.
5. Mendukung customization produk.
6. Mendukung dine-in dan takeaway.
7. Mendukung cash, bank transfer, dan QRIS.
8. Menyediakan riwayat transaksi yang reliable.
9. Menyediakan laporan penjualan sederhana.
10. Menjaga integritas data transaksi melalui snapshot.

---

# 3. Non-Goals

Fitur berikut tidak termasuk MVP:

- Payment gateway.
- Automatic payment verification.
- Integrasi API bank.
- Automatic QRIS verification.
- Inventory management.
- Stock management.
- Stock opname.
- Supplier management.
- Purchasing.
- Accounting.
- Payroll.
- Customer CRM.
- Loyalty program.
- Table management.
- Nomor meja.
- Kitchen Display System.
- Receipt printer.
- Barcode scanner.
- Cash drawer integration.
- Advanced discount system.
- Multi-store management.

> Arsitektur tetap menggunakan konsep `Store` agar dapat dikembangkan menjadi multi-store di masa depan.

---

# 4. User Roles

MVP memiliki dua role utama:

```
OWNER
CASHIER
```

---

## 4.1 Owner

Owner memiliki akses penuh terhadap Store.

### Owner dapat:

- Mengakses dashboard.
- Mengakses POS.
- Membuat transaksi.
- Melihat seluruh transaksi.
- Melihat laporan.
- Membuat produk.
- Mengubah produk.
- Menonaktifkan produk.
- Mengelola kategori.
- Mengelola product options.
- Mengatur harga.
- Mengatur dine-in/takeaway.
- Mengatur pajak.
- Mengatur metode pembayaran.
- Mengelola bank.
- Mengelola QRIS.
- Mengelola user cashier.
- Mengatur informasi toko.

---

## 4.2 Cashier

Cashier hanya memiliki akses operasional.

### Cashier dapat:

- Login.
- Mengakses POS.
- Melihat produk aktif.
- Mencari produk.
- Memfilter produk.
- Melakukan customization.
- Menambahkan produk ke cart.
- Mengubah quantity.
- Memilih dine-in/takeaway.
- Melakukan checkout.
- Memilih payment method.
- Mengonfirmasi pembayaran.
- Melihat riwayat transaksi sesuai permission yang diberikan.

### Cashier tidak dapat:

- Mengubah harga produk.
- Membuat produk.
- Mengubah produk.
- Menonaktifkan produk.
- Mengubah kategori.
- Mengubah product options.
- Mengubah pajak.
- Mengubah bank.
- Mengubah QRIS.
- Mengubah payment settings.
- Mengelola cashier.
- Mengubah store settings.
- Mengubah data transaksi yang sudah completed.

---

# 5. Store & Multi-Tenancy

Store merupakan entity utama untuk seluruh data bisnis.

```
Store
│
├── Members
├── Products
├── Categories
├── Product Options
├── Transactions
├── Payment Settings
├── Banks
├── QRIS
├── Tax Settings
└── Store Settings
```

User mendapatkan akses ke Store melalui membership. Setiap data bisnis harus memiliki relasi ke Store.

Contoh:

```
products.store_id
transactions.store_id
categories.store_id
banks.store_id
```

**Tujuan:**

- Data antar toko tidak tercampur.
- Authorization dapat dilakukan berdasarkan Store.
- Supabase Row Level Security dapat diterapkan berdasarkan Store membership.
- Arsitektur siap untuk kemungkinan multi-store di masa depan.

---

# 6. Authentication Requirements

## AUTH-001 — Login

User harus dapat login menggunakan credential yang valid.

**Expected behavior:**

```
Valid credentials
→ Login berhasil
→ User diarahkan ke halaman aplikasi

Credential invalid
→ Login gagal
→ Error message ditampilkan
```

---

## AUTH-002 — Logout

User dapat logout.

Setelah logout:
- Session harus dihapus/invalid.
- User tidak dapat mengakses halaman protected.
- User diarahkan ke halaman login.

---

## AUTH-003 — Role Authorization

Setiap request ke resource protected harus divalidasi berdasarkan:

1. Authentication.
2. Store membership.
3. Role.
4. Permission.

> Frontend hiding button saja tidak dianggap sebagai authorization. Authorization harus diterapkan pada server/database layer.

---

# 7. Dashboard Requirements

Dashboard memberikan ringkasan performa toko.

## DASH-001 — Sales Summary

Dashboard harus menampilkan:

- Total sales.
- Total transactions.
- Total products sold.
- Average transaction value.

---

## DASH-002 — Sales Trend

Dashboard menampilkan grafik penjualan berdasarkan periode.

Period minimal:
- Today.
- This week.
- This month.
- Custom date range.

---

## DASH-003 — Top Products

Dashboard menampilkan produk dengan jumlah penjualan tertinggi.

| Field | Keterangan |
|---|---|
| Product | Nama produk |
| Quantity Sold | Jumlah terjual |
| Revenue | Total pendapatan |

---

## DASH-004 — Payment Summary

Dashboard menampilkan distribusi transaksi berdasarkan:
- Cash.
- Bank Transfer.
- QRIS.

---

## DASH-005 — Date Filter

Ketika user mengganti periode, seluruh metric dashboard harus menggunakan periode tersebut.

---

# 8. POS Requirements

POS merupakan fitur utama untuk cashier.

**Layout konseptual:**

```
┌───────────────────────────────────────────────┐
│ Search / Filters                              │
├──────────────────────────┬────────────────────┤
│                          │                    │
│ Product Cards            │ Cart / Checkout    │
│                          │                    │
│                          │                    │
└──────────────────────────┴────────────────────┘
```

---

## POS-001 — Product Search

Cashier dapat mencari produk berdasarkan nama. Search harus melakukan filtering terhadap produk yang aktif. Produk inactive tidak boleh muncul sebagai pilihan transaksi baru.

---

## POS-002 — Category Filter

Cashier dapat memfilter produk berdasarkan kategori.

Contoh:
```
All | Makanan | Minuman | Snack | Dessert
```

Kategori bersifat dynamic dan dikelola Owner.

---

## POS-003 — Product Card

Product card minimal menampilkan:
- Image.
- Product name.
- Price.
- Availability yang relevan dengan order type.

Product card dapat ditekan untuk membuka customization.

---

# 9. Product Requirements

## PRODUCT-001 — Product Creation

Owner dapat membuat product.

**Field minimal:**

| Field | Keterangan |
|---|---|
| Name | Nama produk |
| Description | Deskripsi |
| Image | Gambar produk |
| Category | Kategori |
| Dine-in availability | Tersedia dine-in |
| Takeaway availability | Tersedia takeaway |
| Dine-in price | Harga dine-in |
| Takeaway price | Harga takeaway |
| Active status | Status aktif |

---

## PRODUCT-002 — Product Availability

| Tipe | Dine-in | Takeaway |
|---|---|---|
| Dine-in only | YES | NO |
| Takeaway only | NO | YES |
| Both | YES | YES |

Product harus memiliki minimal satu availability yang aktif.

---

## PRODUCT-003 — Different Prices

Harga dine-in dan takeaway dapat berbeda.

```
Dine-in:   Rp20.000
Takeaway:  Rp22.000
```

```
DINE_IN   → gunakan dine_in_price
TAKEAWAY  → gunakan takeaway_price
```

---

## PRODUCT-004 — Product Update

Owner dapat mengubah: Name, Description, Image, Category, Availability, Price, Product options.

> Perubahan product hanya berlaku untuk transaksi baru.

---

## PRODUCT-005 — Product Deactivation

Product inactive:
- Tidak muncul sebagai product yang dapat dibeli.
- Tidak dapat ditambahkan ke transaksi baru.
- Tetap muncul pada historical transaction.
- Tidak boleh mengubah data transaksi lama.

---

# 10. Category Requirements

| ID | Requirement |
|---|---|
| CATEGORY-001 | Owner dapat membuat kategori. |
| CATEGORY-002 | Owner dapat mengubah kategori. |
| CATEGORY-003 | Owner dapat menonaktifkan kategori. |
| CATEGORY-004 | Category digunakan untuk filtering product pada POS. Kategori tidak hardcoded. |

---

# 11. Product Options Requirements

Product options digunakan untuk customization.

**Struktur:**

```
Product
    ↓
Option Group
    ↓
Option
```

**Contoh:**

```
Nasi Goreng
│
├── Ukuran
│   ├── Regular +0
│   └── Jumbo +5000
│
├── Level Pedas
│   ├── Tidak Pedas +0
│   ├── Sedang +0
│   └── Pedas +0
│
└── Extra
    ├── Telur +3000
    └── Kerupuk +2000
```

---

## OPTION-001 — Optional Options

Semua options bersifat optional. Tidak ada option group yang required pada MVP.

---

## OPTION-002 — Additional Charge

Option dapat memiliki additional price yang ditambahkan ke harga dasar product.

---

## OPTION-003 — Multiple Options

Option group dapat mendukung single atau multiple selection sesuai konfigurasi. `required = false` untuk seluruh option group pada MVP.

---

# 12. Product Customization Modal

Ketika product card ditekan, modal minimal menampilkan:

- Product image.
- Product name.
- Base price.
- Option groups & options.
- Additional prices.
- Quantity.
- Add to Cart button.

**Contoh:**

```
Nasi Goreng

Rp20.000

Ukuran
○ Regular
○ Jumbo +Rp5.000

Level Pedas
○ Tidak Pedas  ○ Sedang  ○ Pedas

Extra
☐ Telur +Rp3.000
☐ Kerupuk +Rp2.000

Quantity: [-] 1 [+]

[Add to Cart]
```

---

# 13. Order Type Requirements

| Tipe | Nilai |
|---|---|
| Dine-in | `DINE_IN` |
| Takeaway | `TAKEAWAY` |

Cashier harus memilih order type ketika checkout. Order type memengaruhi: availability, price, dan tax.

## ORDER-001 — Dine-in

Sistem menggunakan dine-in availability, dine-in price, dan dine-in tax.

## ORDER-002 — Takeaway

Sistem menggunakan takeaway availability, takeaway price, dan takeaway tax.

## ORDER-003 — No Table Number

MVP tidak menggunakan table number, table management, atau table assignment.

---

# 14. Cart Requirements

Cart item minimal memiliki:

```
Product
Selected Options
Order Type
Unit Price
Quantity
Subtotal
```

| ID | Requirement |
|---|---|
| CART-001 | Cashier dapat menambahkan product ke cart. |
| CART-002 | Cashier dapat menambah/mengurangi quantity dan menghapus item. |
| CART-003 | Product sama dengan customization berbeda menjadi cart item berbeda. |
| CART-004 | Subtotal = (base price + option charges) × quantity. |

---

# 15. Tax Requirements

Tax dapat dikonfigurasi Owner dan dapat berbeda berdasarkan order type.

```
Dine-in:   10%
Takeaway:   5%
```

| ID | Requirement |
|---|---|
| TAX-001 | Order dine-in menggunakan tax dine-in. |
| TAX-002 | Order takeaway menggunakan tax takeaway. |
| TAX-003 | `tax_amount = subtotal × tax_rate` |
| TAX-004 | Transaksi menyimpan snapshot `tax_rate` dan `tax_amount`. |

---

# 16. Checkout Requirements

Checkout menampilkan:

```
Order Type
Cart Items
Subtotal
Tax
Total
Payment Method

---

Subtotal     Rp28.000
Tax           Rp2.800
---
Total        Rp30.800
```

---

# 17. Payment Requirements

| Metode | Tipe |
|---|---|
| CASH | Direct |
| BANK_TRANSFER | Manual confirmation |
| QRIS | Manual confirmation |

> Sistem tidak memverifikasi pembayaran secara otomatis.

---

# 18. Cash Payment

| ID | Requirement |
|---|---|
| CASH-001 | Cashier memasukkan nominal uang customer. |
| CASH-002 | `change = customer_payment - total` |
| CASH-003 | Jika `customer_payment < total`, checkout tidak dapat diselesaikan. |
| CASH-004 | Jika `customer_payment = total`, `change = 0`. |

---

# 19. Bank Transfer

**Flow:**

```
Customer transfer
       ↓
Cashier checks transfer
       ↓
Cashier selects bank
       ↓
Cashier confirms
       ↓
Transaction completed
```

| ID | Requirement |
|---|---|
| BANK-001 | Owner dapat mengelola bank (Name, Logo, Active status). |
| BANK-002 | Sistem menyediakan BCA, BNI, Mandiri sebagai initial data. Owner dapat menambah bank lain. |
| BANK-003 | Transaksi menyimpan snapshot informasi bank. |

---

# 20. QRIS

**Flow:**

```
Customer scans QR
       ↓
Customer pays
       ↓
Cashier checks payment
       ↓
Cashier confirms
       ↓
Transaction completed
```

| ID | Requirement |
|---|---|
| QRIS-001 | Checkout dapat menampilkan QR Code QRIS toko. |
| QRIS-002 | Owner dapat upload/change QRIS image dan mengaktifkan/menonaktifkan QRIS. |
| QRIS-003 | Cashier harus melakukan konfirmasi manual. |
| QRIS-004 | Informasi QRIS disimpan pada transaction record. |

---

# 21. Promosi Diskon Produk

Owner dapat membuat kampanye diskon produk ("hari spesial") yang diterapkan secara otomatis saat kasir menambahkan produk ke keranjang.

**Aturan:**

| ID | Requirement |
|---|---|
| PROMO-001 | Promo memiliki nama, jenis diskon (Persen atau Nominal), nilai diskon, periode berlaku (awal & akhir, opsional), dan status aktif. |
| PROMO-002 | Owner memilih satu atau lebih produk yang ikut promo; hanya produk aktif yang dapat dipilih. |
| PROMO-003 | Diskon dihitung per line item: Persen `round(line × nilai/100)`; Nominal `min(nilai, line)`. Diterapkan sebelum voucher dan sebelum pajak. |
| PROMO-004 | Jika beberapa promo aktif tumpang tindih pada produk yang sama, diskon terbesar yang berlaku. |
| PROMO-005 | Promo yang dinonaktifkan atau di luar periode tidak diterapkan pada transaksi baru. |
| PROMO-006 | Harga diskon ditampilkan pada product card POS (harga coret + harga diskon + badge DISKON). |
| PROMO-007 | Hanya Owner yang dapat membuat, mengubah, mengaktifkan/menonaktifkan, dan menghapus promo. |
| PROMO-008 | Penghitungan diskon diverifikasi ulang di server (database) — klien tidak dipercaya dalam penentuan harga final. |

---

# 22. Voucher

Voucher adalah kode diskon manual yang dibuat Owner dan dimasukkan kasir saat checkout untuk memberi diskon ke pelanggan. Voucher dapat digabung (stack) dengan diskon produk.

**Aturan:**

| ID | Requirement |
|---|---|
| VOUCHER-001 | Voucher memiliki kode unik (per store, di-uppercase), jenis diskon (Persen/Nominal), nilai diskon, status aktif, dan periode berlaku opsional. |
| VOUCHER-002 | Opsional: syarat minimum subtotal (sebelum diskon), batas diskon maksimum (untuk Persen), dan kuota pemakaian `usage_limit`. |
| VOUCHER-003 | Voucher tidak valid jika nonaktif, di luar periode, kuota habis (`used_count >= usage_limit`), atau subtotal belum memenuhi minimum. |
| VOUCHER-004 | Persen dihitung dari subtotal (sebelum pajak) lalu di-cap oleh `max_discount`; Nominal = `min(nilai, subtotal)`. |
| VOUCHER-005 | Diskon voucher ditambahkan ke diskon produk; pajak dihitung dari `(subtotal − total diskon)`. |
| VOUCHER-006 | `used_count` dinaikkan secara atomik dalam transaksi DB yang sama saat transaksi disimpan — mencegah pemakaian melebihi kuota walau checkout bersamaan. |
| VOUCHER-007 | Kasir memasukkan kode voucher di panel checkout; validitas ditampilkan live (pesan error jika tidak ditemukan / belum berlaku / kuota habis / belum memenuhi minimum). |
| VOUCHER-008 | Kode voucher (snapshot) dan total diskon disimpan pada transaction record. |
| VOUCHER-009 | Hanya Owner yang dapat membuat, mengubah, mengaktifkan/menonaktifkan, dan menghapus voucher; kasir hanya dapat memakainya. |

---

# 23. Transaction Requirements

Transaction minimal memiliki:

```
Transaction ID
Store
Cashier
Order Type
Items
Subtotal
Tax
Total
Payment Method
Payment Information
Status
Created At
```

## Transaction Status

| Status | Keterangan |
|---|---|
| `PENDING` | Payment confirmation belum selesai. |
| `COMPLETED` | Semua item, total, dan payment valid. |
| `CANCELLED` | Hanya dapat dilakukan Owner pada MVP. |

---

# 24. Transaction Snapshot

| ID | Requirement |
|---|---|
| SNAPSHOT-001 | Transaction item menyimpan: product name, price, quantity, selected options, option names, option prices, item subtotal. |
| SNAPSHOT-002 | Transaction menyimpan: order type, tax rate, tax amount, subtotal, total. |
| SNAPSHOT-003 | Payment menyimpan: payment method, amount paid, change (cash), bank info (bank transfer). |
| SNAPSHOT-004 | Historical transaction tidak berubah ketika product price, option price, product name, tax, atau bank berubah. |

---

# 25. Transaction History

| ID | Requirement |
|---|---|
| HISTORY-001 | List menampilkan: Transaction ID, Date/Time, Cashier, Order Type, Total, Payment Method, Status. |
| HISTORY-002 | User dapat mencari transaksi berdasarkan Transaction ID. |
| HISTORY-003 | Filter: Date, Payment Method, Order Type, Status, Cashier. |
| HISTORY-004 | User dapat membuka transaction detail lengkap. |

---

# 26. Reports

| ID | Requirement |
|---|---|
| REPORT-001 | Sales Report: Total sales, transactions, products sold, average transaction value. |
| REPORT-002 | Product Report: Product, quantity sold, revenue. Dapat diurutkan berdasarkan quantity atau revenue. |
| REPORT-003 | Payment Report: Cash, Bank Transfer, QRIS — transaction count dan total amount. |
| REPORT-004 | Date Range: Today, This week, This month, Custom date range. |

---

# 27. Menu Management

| ID | Requirement |
|---|---|
| MENU-001 | Owner dapat membuat product. |
| MENU-002 | Owner dapat mengubah product. |
| MENU-003 | Owner dapat menonaktifkan product. |
| MENU-004 | Owner dapat membuat dan mengubah Option Group, Option, dan Additional Price. |

---

# 28. Store Settings

Owner dapat mengatur:

| Kategori | Setting |
|---|---|
| Store Information | Store name, logo, information. |
| Payment Settings | Cash, Bank Transfer, QRIS enabled/disabled. |
| Tax Settings | Dine-in tax, Takeaway tax, Tax enabled/disabled. |
| Bank Settings | Bank name, logo, active/inactive. |
| QRIS Settings | QR image, active/inactive. |

---

# 29. Payment Method Configuration

Owner dapat mengaktifkan/menonaktifkan payment method.

```
Cash          [ON]
Bank Transfer [ON]
QRIS          [OFF]
```

> Jika QRIS disabled, QRIS tidak muncul pada checkout. Historical transaction QRIS tetap tersedia.

---

# 30. User / Cashier Management

Owner dapat:
- Create cashier.
- Activate/deactivate cashier.
- Assign cashier ke Store.
- Menentukan role cashier.

> Cashier yang inactive tidak dapat melakukan login/operasional pada Store.

---

# 31. Authorization Rules

```
OWNER
→ products.write
→ settings.write
→ transactions.read
→ reports.read
→ pos.use

CASHIER
→ pos.use
→ transactions.read
```

> UI hanya merupakan lapisan tambahan. Tidak boleh mengandalkan `if (role === "owner")` sebagai satu-satunya security mechanism.

---

# 32. Data Integrity Requirements

| Requirement | Keterangan |
|---|---|
| Historical Integrity | Transaksi lama tidak berubah ketika master data berubah. |
| Store Isolation | User dari Store A tidak dapat mengakses data Store B. |
| Permission Integrity | Cashier tidak dapat melakukan operation Owner melalui direct API request. |
| Calculation Integrity | Total transaksi harus dihitung berdasarkan data server yang valid. |

---

# 33. Transaction Calculation Rules

```
item_unit_price = product_price + selected_option_charges

item_subtotal = item_unit_price × quantity

subtotal = sum(item_subtotal)

tax = subtotal × tax_rate

total = subtotal + tax
```

> Untuk MVP belum terdapat discount.

---

# 34. POS Transaction Flow

```
Login → Open POS → Search/Filter → Select Product
→ Customization Modal → Select Optional Options
→ Set Quantity → Add To Cart → Select Dine-in/Takeaway
→ Review Cart → Calculate Subtotal → Calculate Tax
→ Calculate Total → Select Payment → Payment Confirmation
→ Create Transaction → Transaction Completed
```

---

# 35. Cash Transaction Flow

```
Cart → Checkout → Cash → Enter Amount Paid
→ Calculate Change → Validate Amount
→ Confirm → Create Transaction → COMPLETED
```

---

# 36. Bank Transaction Flow

```
Cart → Checkout → Bank Transfer → Select Bank
→ Cashier verifies transfer externally
→ Cashier confirms → Create Transaction → COMPLETED
```

---

# 37. QRIS Transaction Flow

```
Cart → Checkout → QRIS → Display Store QR
→ Customer pays → Cashier verifies externally
→ Cashier confirms → Create Transaction → COMPLETED
```

---

# 38. Error Handling

| Kategori | Error |
|---|---|
| Authentication | Invalid credentials, Expired session, Unauthorized access. |
| Product | Product inactive, Product unavailable for order type, Product changed during checkout. |
| Cart | Empty cart, Invalid quantity, Invalid product/options. |
| Payment | Cash insufficient, Disabled payment method, Bank tidak aktif, QRIS tidak aktif. |
| Transaction | Failed transaction creation, Database error, Duplicate transaction submission. |

---

# 39. Duplicate Transaction Protection

Sistem harus mencegah pembuatan transaksi duplicate menggunakan:
- Disabled submit state.
- Server-side validation.
- Idempotency mechanism atau equivalent transaction protection.

> Frontend loading state saja tidak dianggap cukup.

---

# 40. Loading & UX Requirements

POS harus memberikan feedback ketika:
- Product sedang dimuat.
- Product customization sedang dibuka.
- Checkout sedang diproses.
- Transaction sedang dibuat.
- Settings sedang disimpan.

---

# 41. Responsive Requirements

| Priority | Platform |
|---|---|
| 1 | Desktop POS |
| 2 | Tablet |
| 3 | Mobile |

**Desktop layout:**
```
Product area + Checkout sidebar
```

**Mobile layout:**
```
Product area ↓ Cart/Checkout
```

---

# 42. Performance Requirements

Operasi berikut harus terasa responsive:
- Search, Category filtering, Add to cart, Quantity update, Open customization, Checkout.

> Perhitungan cart lokal tidak perlu menunggu network request. Namun final transaction calculation harus divalidasi pada server.

---

# 43. Security Requirements

Sistem harus:
- Menggunakan authentication dan authorization.
- Mengisolasi data berdasarkan Store.
- Menerapkan Row Level Security jika menggunakan Supabase.
- Tidak mempercayai role dari client.
- Tidak mempercayai total transaksi dari client.
- Tidak mengekspos data Store lain.
- Tidak memungkinkan Cashier mengakses endpoint Owner.

---

# 44. Auditability

Transaksi harus menyimpan minimal:

```
created_at
created_by / cashier
store_id
status
payment_method
```

---

# 45. Acceptance Criteria — Authentication

| ID | Given | When | Then |
|---|---|---|---|
| AC-AUTH-01 | User memiliki credential valid | User login | User berhasil masuk ke aplikasi. |
| AC-AUTH-02 | User tidak memiliki akses Store | User mencoba mengakses data Store | Request ditolak. |
| AC-AUTH-03 | Cashier | Cashier mencoba mengubah product melalui API | Request ditolak. |

---

# 46. Acceptance Criteria — Product

| ID | Given | When | Then |
|---|---|---|---|
| AC-PRODUCT-01 | Owner | Owner membuat product | Product muncul pada POS jika status active. |
| AC-PRODUCT-02 | Product hanya tersedia dine-in | Order type takeaway dipilih | Product tidak dapat ditambahkan. |
| AC-PRODUCT-03 | Product memiliki harga dine-in Rp20.000 dan takeaway Rp22.000 | Order type takeaway dipilih | Harga yang digunakan adalah Rp22.000. |

---

# 47. Acceptance Criteria — Options

| ID | Given | When | Then |
|---|---|---|---|
| AC-OPTION-01 | Product memiliki options | Cashier tidak memilih option | Product tetap dapat ditambahkan ke cart. |
| AC-OPTION-02 | Option memiliki additional price Rp3.000 | Option dipilih | Harga item bertambah Rp3.000. |
| AC-OPTION-03 | Product sama memiliki customization berbeda | Keduanya dimasukkan ke cart | Masing-masing menjadi cart item terpisah. |

---

# 48. Acceptance Criteria — Checkout

| ID | Given | When | Then |
|---|---|---|---|
| AC-CHECKOUT-01 | Cart memiliki item | Checkout dibuka | Subtotal, diskon, tax, dan total ditampilkan. |
| AC-CHECKOUT-02 | Customer membayar lebih dari total | Cashier memasukkan nominal | Change dihitung otomatis. |
| AC-CHECKOUT-03 | Customer membayar kurang dari total | Cashier mencoba menyelesaikan transaksi | Transaksi ditolak. |
| AC-CHECKOUT-04 | Item di cart termasuk produk promo aktif | Checkout dibuka | Diskon produk terbesar tampil per item dan dikurangkan dari subtotal. |
| AC-CHECKOUT-05 | Ada voucher aktif yang memenuhi syarat | Cashier memasukkan kode voucher | Validasi berhasil, diskon voucher tampil, dan total menyesuaikan. |
| AC-CHECKOUT-06 | Kode voucher tidak dikenal / nonaktif / kuota habis / belum memenuhi minimum | Cashier memasukkan kode | Pesan error validasi ditampilkan dan diskon tidak diterapkan. |
| AC-CHECKOUT-07 | Pajak aktif dan ada diskon | Checkout diselesaikan | Pajak dihitung dari subtotal setelah diskon. |

---

# 49. Acceptance Criteria — Payment

| ID | Requirement |
|---|---|
| AC-PAYMENT-01 | Cash payment menyimpan `amount_paid` dan `change`. |
| AC-PAYMENT-02 | Bank transfer menyimpan `payment_method = BANK_TRANSFER` dan bank information. |
| AC-PAYMENT-03 | QRIS menyimpan `payment_method = QRIS` dengan manual confirmation. |
| AC-PAYMENT-04 | Sistem tidak melakukan automatic bank/payment verification. |

---

# 50. Acceptance Criteria — Snapshot

| ID | Given | When | Then |
|---|---|---|---|
| AC-SNAPSHOT-01 | Product price Rp20.000 | Transaksi dibuat | Transaction item menyimpan Rp20.000. |
| AC-SNAPSHOT-02 | Product berubah menjadi Rp25.000 | Historical transaction dibuka | Transaction tetap menampilkan Rp20.000. |
| AC-SNAPSHOT-03 | — | — | Tax pada historical transaction tetap menggunakan tax ketika transaksi dibuat. |
| AC-SNAPSHOT-04 | — | — | Option price pada historical transaction tetap menggunakan price ketika transaksi dibuat. |

---

# 51. Acceptance Criteria — Transaction History

| ID | Requirement |
|---|---|
| AC-HISTORY-01 | Transaction completed harus muncul pada transaction history. |
| AC-HISTORY-02 | User dapat membuka transaction detail. |
| AC-HISTORY-03 | Historical transaction tetap dapat dibaca meskipun product sudah inactive. |

---

# 52. Acceptance Criteria — Reports

| ID | Requirement |
|---|---|
| AC-REPORT-01 | Sales report menghitung transaksi sesuai date range. |
| AC-REPORT-02 | Product report menghitung quantity sold berdasarkan completed transaction. |
| AC-REPORT-03 | Cancelled transaction tidak dihitung sebagai completed sales. |
| AC-REPORT-04 | Payment report dapat membedakan Cash, Bank Transfer, dan QRIS. |

---

# 53. Definition of Done — MVP

### Authentication
- [ ] Login bekerja.
- [ ] Logout bekerja.
- [ ] Role authorization bekerja.
- [ ] Store isolation bekerja.

### Product
- [ ] Product CRUD bekerja.
- [ ] Category bekerja.
- [ ] Product options bekerja.
- [ ] Dine-in/takeaway bekerja.
- [ ] Different pricing bekerja.

### POS
- [ ] Search bekerja.
- [ ] Filter bekerja.
- [ ] Customization bekerja.
- [ ] Cart bekerja.
- [ ] Quantity bekerja.
- [ ] Checkout bekerja.
- [ ] Harga diskon + badge tampil di product card.
- [ ] Kode voucher diverifikasi di checkout.

### Promo & Voucher
- [ ] Owner dapat CRUD promo diskon produk.
- [ ] Owner dapat CRUD voucher (termasuk syarat & kuota).
- [ ] Diskon produk & voucher diterapkan di checkout dan disimpan transaksi.
- [ ] Kuota voucher ditegakkan server-side secara atomik.

### Payment
- [ ] Cash bekerja.
- [ ] Change calculation bekerja.
- [ ] Bank confirmation bekerja.
- [ ] QRIS confirmation bekerja.

### Transaction
- [ ] Transaction creation bekerja.
- [ ] Transaction status bekerja.
- [ ] Transaction history bekerja.
- [ ] Transaction detail bekerja.
- [ ] Snapshot bekerja.

### Dashboard
- [ ] Summary bekerja.
- [ ] Sales chart bekerja.
- [ ] Top products bekerja.
- [ ] Payment summary bekerja.

### Reports
- [ ] Sales report bekerja.
- [ ] Product report bekerja.
- [ ] Payment report bekerja.
- [ ] Date filtering bekerja.

### Settings
- [ ] Store settings bekerja.
- [ ] Tax settings bekerja.
- [ ] Bank settings bekerja.
- [ ] QRIS settings bekerja.
- [ ] Payment method settings bekerja.

### Security
- [ ] RLS/authorization diterapkan.
- [ ] Cashier tidak dapat melakukan Owner operation.
- [ ] Store A tidak dapat mengakses Store B.
- [ ] Final transaction calculation divalidasi server-side.

---

# 54. MVP User Journey

## Owner Journey

```
Register/Login → Create/Access Store → Configure Store
→ Configure Tax → Configure Payment Methods
→ Configure Bank → Configure QRIS
→ Create Categories → Create Products
→ Configure Product Options → Create Cashier
→ Create Promotions/Vouchers
→ Cashier Starts Selling
→ Owner Monitors Dashboard → Owner Reviews Reports
```

## Cashier Journey

```
Login → Open POS → Search Product → Select Product
→ Customize → Add to Cart → Select Dine-in/Takeaway
→ Review Cart → Apply Voucher → Checkout → Select Payment
→ Confirm Payment → Transaction Completed
```

---

# 55. Future Roadmap

## V2
- Inventory, Barcode, Receipt printer.
- ~~Table management~~ (belum), ~~Discount, Promotion~~ **✓ Implemented** (lihat #21–#22), Customer management.

## V3
- Multi-store, Supplier management, Purchasing.
- Accounting, Loyalty, Advanced reporting.

## V4
- Payment gateway.
- Automatic payment integration.

---

# 56. Product Principles

### 1. Transaction First
Historical transaction adalah data yang harus dipertahankan secara akurat.

### 2. Server Is Source of Truth
Frontend tidak boleh menjadi sumber kebenaran final untuk: Authorization, Price, Tax, Total, Transaction status.

### 3. Configuration Over Hardcoding
Data seperti Category, Bank, Product options, Tax, Payment method harus dibuat configurable.

### 4. Simple MVP
Jangan memasukkan fitur yang belum dibutuhkan MVP.

```
NO PAYMENT GATEWAY
NO INVENTORY
NO STOCK MANAGEMENT
```

### 5. Future-Friendly Architecture
Arsitektur Store dan Membership harus memungkinkan pengembangan di masa depan tanpa membuat MVP terlalu kompleks.

---

# 57. MVP Scope Summary

```
POS KASIR MVP
│
├── Authentication
│
├── Role & Permission
│   ├── Owner
│   └── Cashier
│
├── Store
│
├── Dashboard
│
├── POS
│   ├── Search
│   ├── Category Filter
│   ├── Product Cards
│   ├── Customization
│   ├── Cart
│   └── Checkout
│
├── Products
│   ├── Product
│   ├── Category
│   └── Options
│
├── Order Type
│   ├── Dine-in
│   └── Takeaway
│
├── Payment
│   ├── Cash
│   ├── Bank Transfer
│   └── QRIS
│
├── Transactions
│   ├── Create
│   ├── Snapshot
│   ├── History
│   └── Detail
│
├── Dashboard
│
├── Reports
│
└── Settings
    ├── Store
    ├── Tax
    ├── Payment
    ├── Bank
    └── QRIS
```

---

# 58. Final MVP Boundary

MVP POS Kasir bertujuan menyelesaikan satu core workflow:

```
Manage Menu → Select Product → Customize Product
→ Select Dine-in/Takeaway → Calculate Price + Tax
→ Confirm Payment → Create Transaction Snapshot
→ View Transaction → Analyze Sales
```

> MVP **tidak bertujuan menjadi sistem accounting, inventory, supplier management, atau payment processor**.

**Fokus utama:**
> Membuat proses penjualan makanan/minuman menjadi **cepat, terstruktur, dan dapat dilacak**.
