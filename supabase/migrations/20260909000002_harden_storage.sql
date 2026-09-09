-- V7: Storage hardening â€” scope write/delete to the caller's own store
--
-- Previously any authenticated user could upload/update/delete objects in the
-- public buckets, letting one user tamper with another store's images.
--
-- Fix: write/update/delete policies now verify the object is inside the caller's
-- own store folder. Object paths are stored as `name` in the form
-- `<store_id>/<file>`. We derive the store id from the caller's active membership.

begin;

-- helper: returns the store_id (uuid) for the current authorized store-scoped write
-- The path convention is `<store_id>/<rest>`; we only allow the caller's own store folder.
drop policy if exists "storage_upload_authenticated" on storage.objects;
create policy "storage_upload_authenticated" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
    and exists (
      select 1
      from public.store_members sm
      where sm.user_id = auth.uid()
        and sm.active
        and sm.store_id::text = storage.foldername(name)[1], 1)
    )
  );

drop policy if exists "storage_update_authenticated" on storage.objects;
create policy "storage_update_authenticated" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
    and exists (
      select 1
      from public.store_members sm
      where sm.user_id = auth.uid()
        and sm.active
        and sm.store_id::text = storage.foldername(name)[1], 1)
    )
  )
  with check (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
    and exists (
      select 1
      from public.store_members sm
      where sm.user_id = auth.uid()
        and sm.active
        and sm.store_id::text = storage.foldername(name)[1], 1)
    )
  );

drop policy if exists "storage_delete_authenticated" on storage.objects;
create policy "storage_delete_authenticated" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'bank-logos', 'qris-images', 'store-logos')
    and exists (
      select 1
      from public.store_members sm
      where sm.user_id = auth.uid()
        and sm.active
        and sm.store_id::text = storage.foldername(name)[1], 1)
    )
  );

commit;
