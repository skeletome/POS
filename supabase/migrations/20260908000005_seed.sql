-- V5: Seed data — demo store + default banks.
-- Demo users (owner + kasir) are created by scripts/seed.mjs
-- because they require auth.users with hashed passwords.

begin;

-- demo store
insert into public.stores (
  id, name, information, cash_enabled, bank_enabled, qris_enabled,
  qris_image_url, qris_name, tax_enabled, dine_in_tax, takeaway_tax
)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Warung Nusantara',
  'Toko contoh untuk demo POS Kasir.',
  true, true, true,
  null, 'QRIS Warung Nusantara',
  true, 0.1000, 0.0500
)
on conflict (id) do nothing;

-- default banks
insert into public.banks (store_id, name, active, sort_order, logo_url)
values
  ('a0000000-0000-0000-0000-000000000001', 'BCA', true, 0, null),
  ('a0000000-0000-0000-0000-000000000001', 'BNI', true, 1, null),
  ('a0000000-0000-0000-0000-000000000001', 'Mandiri', true, 2, null),
  ('a0000000-0000-0000-0000-000000000001', 'BRI', true, 3, null)
on conflict (store_id, name) do nothing;

commit;