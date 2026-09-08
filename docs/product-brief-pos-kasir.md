# Product Brief — POS Kasir

## 1. Product Overview

**Nama Produk:** POS Kasir

POS Kasir adalah aplikasi Point of Sale berbasis web yang membantu pemilik toko dan kasir mencatat transaksi penjualan dengan cepat, mengelola menu, melakukan checkout, serta melihat riwayat dan laporan penjualan.

Aplikasi dirancang untuk bisnis makanan dan minuman yang membutuhkan proses transaksi sederhana, cepat, dan fleksibel dalam menangani produk dengan berbagai pilihan tambahan.

---

## 2. Product Goal

### Tujuan Utama

Membantu toko:

- Mencatat transaksi penjualan dengan cepat.
- Mengurangi pencatatan transaksi secara manual.
- Mempermudah kasir melakukan checkout.
- Mempermudah pemilik toko mengelola menu.
- Mempermudah pemilik toko melihat performa penjualan.
- Menyediakan riwayat transaksi yang dapat digunakan untuk pengecekan kembali.

---

## 3. Target Users

### Owner / Pemilik Toko

Pemilik toko bertanggung jawab terhadap pengaturan dan pengelolaan toko.

Kebutuhan utama:

- Melihat performa penjualan.
- Mengelola menu.
- Mengatur harga dan opsi produk.
- Mengatur metode pembayaran.
- Mengatur pajak.
- Mengatur QRIS.
- Mengatur bank.
- Melihat seluruh transaksi.
- Melihat laporan penjualan.
- Mengelola akun kasir.

### Cashier / Kasir

Kasir bertanggung jawab terhadap operasional transaksi.

Kebutuhan utama:

- Melihat menu.
- Mencari menu.
- Menambahkan produk ke cart.
- Memilih opsi produk.
- Memilih dine-in atau takeaway.
- Melakukan checkout.
- Mengonfirmasi pembayaran.
- Melihat transaksi yang relevan dengan operasional kasir.

---

## 4. Problems

Aplikasi menyelesaikan masalah:

1. Pencatatan penjualan masih dilakukan secara manual.
2. Proses menghitung total dan kembalian dapat memakan waktu.
3. Pemilik toko sulit mengetahui jumlah dan performa penjualan.
4. Riwayat transaksi sulit dicari kembali.
5. Pengelolaan menu dan harga kurang terstruktur.
6. Produk makanan/minuman sering memiliki berbagai pilihan tambahan yang sulit dicatat secara manual.
7. Transaksi dine-in dan takeaway dapat memiliki harga atau pajak yang berbeda.

---

## 5. MVP Scope

MVP mencakup:

### Authentication

- Login.
- Logout.
- Role-based access.
- Owner.
- Cashier.

### Dashboard

- Ringkasan penjualan.
- Ringkasan transaksi.
- Produk terlaris.
- Grafik penjualan.
- Filter periode.

### POS Cashier

- Search menu.
- Filter kategori.
- Product cards.
- Product customization.
- Cart / checkout panel.
- Dine-in / takeaway.
- Perhitungan subtotal.
- Perhitungan pajak.
- Perhitungan total.
- Payment confirmation.
- Penyelesaian transaksi.

### Product / Menu Management

Owner dapat:

- Menambah produk.
- Mengubah produk.
- Menonaktifkan produk.
- Mengatur gambar.
- Mengatur nama.
- Mengatur deskripsi.
- Mengatur kategori.
- Mengatur harga.
- Mengatur dine-in / takeaway.
- Mengatur harga dine-in.
- Mengatur harga takeaway.
- Mengatur product options.

### Product Options

Produk dapat memiliki option group dan option.

Contoh:

**Nasi Goreng**

Options:

- Ukuran
  - Regular
  - Jumbo + Rp5.000
- Level Pedas
  - Tidak Pedas
  - Sedang
  - Pedas
- Tambahan
  - Telur + Rp3.000
  - Kerupuk + Rp2.000

Semua option bersifat **optional / tidak wajib dipilih**.

Tidak ada option yang mengharuskan customer memilih.

### Transaction

- Membuat transaksi.
- Menyimpan transaction items.
- Menyimpan product customization.
- Menyimpan harga pada saat transaksi.
- Menyimpan pajak pada saat transaksi.
- Menyimpan total transaksi.
- Menyimpan metode pembayaran.
- Menyimpan informasi pembayaran.
- Menyimpan cashier.
- Menyimpan waktu transaksi.
- Menyimpan status transaksi.

### Transaction History

- Melihat transaksi.
- Search transaksi.
- Filter transaksi.
- Melihat detail transaksi.
- Melihat informasi pembayaran.
- Melihat item dan customization.

### Reports

Laporan sederhana:

- Total sales.
- Total transactions.
- Total products sold.
- Average transaction value.
- Sales berdasarkan periode.
- Produk terlaris.
- Sales berdasarkan payment method.

### Store Settings

Owner dapat mengatur:

- Informasi toko.
- Metode pembayaran.
- Bank.
- QRIS.
- Pajak.
- Pengaturan dine-in / takeaway.

---

## 6. Role & Permission

MVP menggunakan dua role:

```text
OWNER
CASHIER
```

### Owner

Owner memiliki akses penuh terhadap toko.

Owner dapat:

- Melihat dashboard.
- Menggunakan POS.
- Melihat transaksi.
- Melihat laporan.
- Membuat produk.
- Mengubah produk.
- Menonaktifkan produk.
- Mengatur kategori.
- Mengatur product options.
- Mengatur payment methods.
- Mengatur bank.
- Mengatur QRIS.
- Mengatur pajak.
- Mengatur toko.
- Membuat dan mengelola cashier.

### Cashier

Cashier hanya memiliki akses terhadap operasional transaksi.

Cashier dapat:

- Melihat dashboard operasional jika diizinkan.
- Menggunakan POS.
- Melakukan checkout.
- Mengonfirmasi pembayaran.
- Melihat transaksi.

Cashier tidak dapat:

- Mengubah produk.
- Menghapus/menonaktifkan produk.
- Mengubah harga.
- Mengubah pajak.
- Mengubah QRIS.
- Mengubah bank.
- Mengubah payment settings.
- Mengelola cashier.
- Mengubah store settings.
- Mengubah laporan atau data historis.

---

## 7. Store Concept

Sistem menggunakan konsep **Store** sebagai tenant utama.

Struktur konseptual:

```text
User
  │
  └── Store Membership
          │
          └── Store
               ├── Products
               ├── Categories
               ├── Product Options
               ├── Transactions
               ├── Payment Methods
               ├── Banks
               ├── QRIS
               ├── Tax Settings
               └── Store Settings
```

Setiap data bisnis harus terhubung dengan sebuah Store.

Contohnya, `store_id` digunakan pada:

- products
- categories
- transactions
- payment settings
- tax settings
- users/memberships
- dan data bisnis lainnya.

### Future Scalability

Struktur Store memungkinkan sistem dikembangkan menjadi multi-store di masa depan tanpa mengubah konsep bisnis utama.

Namun **multi-store management bukan bagian dari MVP**.

---

## 8. Product Structure

Produk menggunakan struktur fleksibel.

Konsep:

```text
Category
    ↓
Product
    ↓
Option Groups
    ↓
Options
```

Contoh:

```text
Makanan
└── Nasi Goreng
     ├── Ukuran
     │    ├── Regular
     │    └── Jumbo +5000
     │
     ├── Level Pedas
     │    ├── Tidak Pedas
     │    ├── Sedang
     │    └── Pedas
     │
     └── Extra
          ├── Telur +3000
          └── Kerupuk +2000
```

### Product Attributes

Minimal product dapat memiliki:

- Name.
- Description.
- Image.
- Category.
- Dine-in availability.
- Takeaway availability.
- Dine-in price.
- Takeaway price.
- Product options.
- Active/inactive status.

---

## 9. Dine-in & Takeaway

Setiap produk dapat dikonfigurasi untuk:

```text
DINE_IN
TAKEAWAY
```

Product dapat:

- Hanya tersedia untuk dine-in.
- Hanya tersedia untuk takeaway.
- Tersedia untuk keduanya.

Contoh:

```text
Produk A
Dine-in: YES
Takeaway: YES

Produk B
Dine-in: YES
Takeaway: NO

Produk C
Dine-in: NO
Takeaway: YES
```

### Harga

Harga dapat berbeda berdasarkan order type.

Contoh:

```text
Nasi Goreng

Dine-in      Rp20.000
Takeaway     Rp22.000
```

Jika produk hanya tersedia pada satu order type, hanya harga/order type tersebut yang digunakan.

### Table Number

MVP **tidak menggunakan nomor meja**.

---

## 10. Tax

Sistem mendukung pengaturan pajak berdasarkan order type.

Contoh:

```text
Dine-in
Tax: 10%

Takeaway
Tax: 0%
```

Atau:

```text
Dine-in
Tax: 10%

Takeaway
Tax: 5%
```

Tax dapat dikonfigurasi oleh Owner.

### Transaction Rule

Tax yang digunakan pada transaksi harus disimpan sebagai **snapshot**.

Jika Owner mengubah tax setelah transaksi dibuat, transaksi lama tidak boleh berubah.

Contoh:

```text
Transaction #001
Tax: 10%

Owner kemudian mengubah tax menjadi 11%

Transaction #001 tetap:
Tax: 10%
```

---

## 11. Product Options

Semua product options bersifat **optional**.

Tidak ada option yang wajib dipilih.

Option dapat memberikan tambahan harga.

Contoh:

```text
Kerupuk
+ Rp2.000

Telur
+ Rp3.000
```

Harga option harus disimpan ketika transaksi dibuat.

Jika harga option berubah di kemudian hari, transaksi lama tidak boleh berubah.

---

## 12. POS Flow

Alur utama kasir:

```text
Login
  ↓
POS
  ↓
Search / Filter Product
  ↓
Select Product
  ↓
Product Customization Modal
  ↓
Select Options
  ↓
Add To Cart
  ↓
Select Dine-in / Takeaway
  ↓
Review Cart
  ↓
Calculate Subtotal
  ↓
Calculate Tax
  ↓
Calculate Total
  ↓
Select Payment Method
  ↓
Payment Confirmation
  ↓
Complete Transaction
```

---

## 13. Product Customization Flow

Ketika kasir menekan product card:

```text
Product Card
     ↓
Customization Modal
```

Contoh:

```text
Nasi Goreng
Rp20.000

Options

Ukuran
○ Regular
○ Jumbo + Rp5.000

Level Pedas
○ Tidak Pedas
○ Sedang
○ Pedas

Extra
☐ Telur + Rp3.000
☐ Kerupuk + Rp2.000

[Add to Cart]
```

Karena seluruh option optional, kasir dapat langsung menambahkan produk tanpa memilih option apa pun.

---

## 14. Checkout

Checkout menampilkan:

- Cart Items.
- Subtotal.
- Tax.
- Total.
- Order Type.
- Payment Method.

Contoh:

```text
Nasi Goreng
Jumbo
Telur
Qty 1

Es Teh
Dingin
Qty 1

----------------

Subtotal     Rp28.000
Tax           Rp2.800
----------------
Total        Rp30.800
```

---

## 15. Payment Methods

MVP memiliki tiga metode pembayaran:

```text
CASH
BANK_TRANSFER
QRIS
```

Payment system bersifat **manual confirmation**.

Aplikasi **bukan payment gateway**.

Tidak ada integrasi automatic payment verification.

---

## 16. Cash Payment

Kasir memasukkan nominal uang yang diberikan customer.

Contoh:

```text
Total
Rp35.000

Customer Payment
Rp50.000

Change
Rp15.000
```

Sistem otomatis menghitung:

```text
change = customer_payment - total
```

### Business Rule

Jika uang customer kurang dari total:

```text
customer_payment < total
```

maka transaksi tidak dapat diselesaikan.

Sistem harus memberikan informasi bahwa nominal pembayaran belum mencukupi.

---

## 17. Bank Transfer

Bank transfer hanya digunakan untuk **payment confirmation**.

Tidak ada:

- Payment gateway.
- API bank.
- Automatic verification.
- Automatic transaction matching.

Flow:

```text
Customer melakukan transfer
        ↓
Cashier memeriksa transfer
        ↓
Cashier memilih bank
        ↓
Cashier mengonfirmasi pembayaran
        ↓
Transaction completed
```

Contoh bank awal:

```text
BCA
BNI
Mandiri
```

Bank dapat dikelola Owner.

Owner dapat:

- Menambahkan bank.
- Mengubah nama bank.
- Mengubah logo bank.
- Mengaktifkan/nonaktifkan bank.

Struktur bank dibuat fleksibel sehingga tidak hardcoded hanya pada BCA, BNI, dan Mandiri.

---

## 18. QRIS

QRIS juga hanya digunakan sebagai **payment confirmation**.

Flow:

```text
Customer scan QRIS
       ↓
Customer melakukan pembayaran
       ↓
Cashier memeriksa pembayaran
       ↓
Cashier mengonfirmasi
       ↓
Transaction completed
```

POS menampilkan QR Code QRIS milik toko.

Owner dapat mengubah:

- QRIS image.
- Status QRIS aktif/nonaktif.

QRIS tidak memiliki automatic payment verification.

Tidak ada payment gateway.

---

## 19. Transaction Status

Transaction memiliki status:

```text
PENDING
COMPLETED
CANCELLED
```

### PENDING

Transaksi telah dibuat tetapi belum selesai dikonfirmasi.

### COMPLETED

Pembayaran telah dikonfirmasi dan transaksi berhasil.

### CANCELLED

Transaksi dibatalkan.

Untuk MVP, pembatalan transaksi memiliki permission terbatas. Aturan final dapat ditentukan pada PRD berdasarkan kebutuhan operasional.

---

## 20. Transaction Snapshot

Transaksi harus menyimpan snapshot data pada saat transaksi dibuat.

Tujuannya agar perubahan data produk di masa depan tidak mengubah transaksi lama.

Contoh:

Hari ini:

```text
Nasi Goreng
Rp20.000
```

Transaksi:

```text
Transaction #001

Nasi Goreng
Price: Rp20.000
```

Kemudian Owner mengubah harga menjadi:

```text
Rp25.000
```

Transaksi #001 tetap:

```text
Rp20.000
```

### Snapshot Minimal

Snapshot minimal harus mencakup:

- Product name.
- Product price.
- Selected options.
- Option prices.
- Quantity.
- Subtotal.
- Order type.
- Tax rate.
- Tax amount.
- Total.
- Payment method.
- Payment details yang relevan.
- Cashier.
- Transaction timestamp.

---

## 21. Transaction History

Riwayat transaksi menampilkan minimal:

- Transaction ID.
- Date/time.
- Cashier.
- Order type.
- Total.
- Payment method.
- Status.

User dapat membuka detail transaksi.

Detail transaksi menampilkan:

```text
Transaction Information
- Transaction ID
- Date
- Cashier
- Order Type
- Payment Method
- Status

Items
- Product
- Options
- Quantity
- Price
- Subtotal

Summary
- Subtotal
- Tax
- Total

Payment
- Amount paid
- Change (untuk cash)
- Bank (untuk bank transfer)
```

---

## 22. Dashboard

Dashboard menyediakan ringkasan performa toko.

### Summary

Minimal:

- Total sales.
- Total transactions.
- Total items sold.
- Average transaction value.

### Charts

#### Sales Trend

Menampilkan penjualan berdasarkan waktu.

Filter periode:

- Today.
- This week.
- This month.
- Custom date range.

#### Top Products

Menampilkan produk yang paling banyak terjual.

#### Payment Methods

Menampilkan distribusi:

- Cash.
- Bank Transfer.
- QRIS.

Dashboard dapat difilter berdasarkan periode.

---

## 23. Reports

MVP menyediakan laporan sederhana.

### Sales Report

Menampilkan:

- Total sales.
- Total transactions.
- Total items sold.
- Average transaction value.

### Product Report

Menampilkan:

- Produk terlaris.
- Quantity terjual.
- Revenue per product.

### Payment Report

Menampilkan:

- Cash sales.
- Bank transfer sales.
- QRIS sales.

### Period

Report dapat difilter berdasarkan:

- Today.
- This week.
- This month.
- Custom date range.

---

## 24. Menu Management

Owner dapat mengelola menu.

### Create Product

Product minimal memiliki:

```text
Name
Description
Image
Category
Dine-in availability
Takeaway availability
Dine-in price
Takeaway price
Options
Active status
```

### Product Status

Produk dapat:

```text
ACTIVE
INACTIVE
```

Produk inactive tidak muncul pada POS untuk transaksi baru.

Namun transaksi lama yang menggunakan produk tersebut tetap tersimpan.

---

## 25. Category Management

Owner dapat:

- Membuat kategori.
- Mengubah kategori.
- Menonaktifkan kategori.

Kategori dapat digunakan untuk filtering pada POS.

Contoh:

```text
All
Makanan
Minuman
Snack
Dessert
```

Kategori dibuat fleksibel dan tidak hardcoded.

---

## 26. Store Settings

Owner dapat mengatur:

### Store Information

- Store name.
- Store logo.
- Store information yang diperlukan aplikasi.

### Payment Settings

- Cash enabled/disabled.
- Bank transfer enabled/disabled.
- QRIS enabled/disabled.

### Bank Settings

- Bank name.
- Bank logo.
- Active/inactive.

### QRIS Settings

- QRIS image.
- Active/inactive.

### Tax Settings

- Dine-in tax.
- Takeaway tax.
- Active/inactive.

---

## 27. Core Business Rules

Aturan bisnis utama MVP:

1. Setiap data bisnis harus dimiliki oleh sebuah Store.
2. User mendapatkan akses melalui Store membership.
3. Owner memiliki akses penuh.
4. Cashier memiliki akses terbatas pada operasional POS.
5. Product dapat tersedia untuk dine-in, takeaway, atau keduanya.
6. Product dapat memiliki harga dine-in dan takeaway yang berbeda.
7. Tax dapat berbeda antara dine-in dan takeaway.
8. Product options bersifat optional.
9. Product options dapat memiliki additional charge.
10. Harga product harus disimpan sebagai snapshot ketika transaksi dibuat.
11. Harga option harus disimpan sebagai snapshot ketika transaksi dibuat.
12. Tax harus disimpan sebagai snapshot ketika transaksi dibuat.
13. Perubahan product tidak boleh mengubah transaksi lama.
14. Produk inactive tidak dapat digunakan untuk transaksi baru.
15. Cash payment harus menghitung change secara otomatis.
16. Cash payment tidak dapat diselesaikan jika nominal customer kurang dari total.
17. Bank transfer hanya merupakan payment confirmation.
18. QRIS hanya merupakan payment confirmation.
19. Tidak ada payment gateway.
20. Tidak ada automatic payment verification.
21. Tidak ada inventory/stock management dalam MVP.
22. Tidak ada table number dalam MVP.

---

## 28. Non-Goals / Out of Scope

Fitur berikut **tidak termasuk MVP**.

### Payment

- Payment gateway.
- Automatic bank verification.
- Automatic QRIS verification.
- Integrasi API bank.
- Integrasi payment processor.

### Inventory

- Stock management.
- Stock adjustment.
- Stock opname.
- Supplier management.
- Purchase order.
- Inventory movement.

### Restaurant Management

- Table management.
- Table number.
- Kitchen display system.
- Kitchen order management.

### Hardware

- Receipt printer integration.
- Barcode scanner.
- Cash drawer integration.

### Business Management

- Accounting.
- Payroll.
- Employee attendance.
- Supplier management.
- Customer loyalty.
- Customer CRM.

### Advanced Sales

- Discount engine.
- Coupon.
- Loyalty points.
- Membership.
- Advanced promotion engine.

### Multi Store

- Multi-store dashboard.
- Store switching.
- Cross-store reporting.

Multi-store architecture dipersiapkan secara konseptual melalui Store entity, tetapi fitur operasional multi-store bukan bagian MVP.

---

## 29. MVP Success Criteria

### Kasir

Kasir dapat:

```text
Login
→ memilih produk
→ memilih customization
→ memilih dine-in/takeaway
→ memasukkan ke cart
→ memilih payment
→ mengonfirmasi pembayaran
→ menyelesaikan transaksi
```

tanpa perlu melakukan pencatatan manual.

### Owner

Owner dapat:

```text
Login
→ membuat/mengelola menu
→ mengatur harga
→ mengatur options
→ mengatur pajak
→ mengatur bank
→ mengatur QRIS
→ melihat transaksi
→ melihat laporan
```

### Data Integrity

Sistem harus memastikan:

```text
Historical transaction
        ↓
tetap sama
```

meskipun:

```text
Product price berubah
Option price berubah
Tax berubah
Product menjadi inactive
```

---

## 30. Example Complete Transaction

Contoh transaksi:

```text
Customer Order

Nasi Goreng
Dine-in
Base price: Rp20.000

Option:
Jumbo: +Rp5.000
Telur: +Rp3.000

Es Teh
Dine-in
Rp5.000

-------------------------
Subtotal       Rp33.000
Tax 10%         Rp3.300
-------------------------
Total          Rp36.300
```

Customer membayar:

```text
Cash
Rp50.000
```

Sistem menghitung:

```text
Change
Rp13.700
```

Setelah kasir mengonfirmasi:

```text
Transaction
    ↓
COMPLETED
```

Sistem menyimpan snapshot:

```text
Nasi Goreng
Base price: Rp20.000
Jumbo: Rp5.000
Telur: Rp3.000

Es Teh
Price: Rp5.000

Tax: 10%
Tax amount: Rp3.300

Total: Rp36.300

Payment:
Cash
Paid: Rp50.000
Change: Rp13.700
```

Jika besok harga Nasi Goreng berubah menjadi Rp25.000, transaksi tersebut **tetap menggunakan Rp20.000**.

---

## 31. High-Level Product Structure

```text
POS KASIR
│
├── Authentication
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
├── Transactions
│   ├── Transaction History
│   └── Transaction Detail
│
├── Menu
│   ├── Products
│   ├── Categories
│   └── Options
│
├── Reports
│   ├── Sales
│   ├── Products
│   └── Payments
│
└── Settings
    ├── Store
    ├── Tax
    ├── Payment Methods
    ├── Banks
    └── QRIS
```

---

## 32. Future Expansion

### V2

```text
Inventory
Barcode
Receipt Printer
Table Management
Discount
Promotion
Customer Management
```

### V3

```text
Multi Store
Supplier
Purchasing
Accounting
Loyalty
Advanced Reporting
```

### V4

```text
Payment Gateway
```

Payment gateway tetap merupakan fitur terpisah dan **bukan bagian dari desain MVP saat ini**.
