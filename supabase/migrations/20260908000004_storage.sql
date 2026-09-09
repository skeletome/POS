-- V4: Storage buckets + access policies
-- Public buckets for menu images, bank logos, QRIS images, store logos.

begin;

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('bank-logos', 'bank-logos', true),
  ('qris-images', 'qris-images', true),
  ('store-logos', 'store-logos', true)
on conflict (id) do nothing;

-- Uploads restricted to authenticated users (any member of the app).
-- Reads are public because buckets are public.
drop policy if exists "storage_upload_authenticated" on storage.objects;
create policy "storage_upload_authenticated" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
  );

drop policy if exists "storage_update_authenticated" on storage.objects;
create policy "storage_update_authenticated" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
  );

drop policy if exists "storage_delete_authenticated" on storage.objects;
create policy "storage_delete_authenticated" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
  );

commit;