-- V3: Row Level Security policies
-- Membership-gated access. Owner manages data; members read/operate.

begin;

-- helper to reseed policies after drops
do $$
begin
  -- ----------------------------------------------------------------
  -- profiles
  -- ----------------------------------------------------------------
  alter table public.profiles enable row level security;

  drop policy if exists "profiles_read_own" on public.profiles;
  create policy "profiles_read_own" on public.profiles
    for select using (id = auth.uid());

  drop policy if exists "profiles_update_own" on public.profiles;
  create policy "profiles_update_own" on public.profiles
    for update using (id = auth.uid()) with check (id = auth.uid());

  drop policy if exists "profiles_read_by_owner" on public.profiles;
  create policy "profiles_read_by_owner" on public.profiles
    for select using (
      exists (
        select 1
        from public.store_members owner_sm
        join public.store_members member_sm on member_sm.store_id = owner_sm.store_id
        where owner_sm.user_id = auth.uid()
          and owner_sm.role = 'OWNER'
          and owner_sm.active
          and member_sm.user_id = public.profiles.id
      )
    );

  -- ----------------------------------------------------------------
  -- stores
  -- ----------------------------------------------------------------
  alter table public.stores enable row level security;

  drop policy if exists "stores_read_member" on public.stores;
  create policy "stores_read_member" on public.stores
    for select using (public.is_store_member(id));

  drop policy if exists "stores_update_owner" on public.stores;
  create policy "stores_update_owner" on public.stores
    for update using (public.is_store_owner(id)) with check (public.is_store_owner(id));

  -- ----------------------------------------------------------------
  -- store_members
  -- ----------------------------------------------------------------
  alter table public.store_members enable row level security;

  drop policy if exists "members_read_own" on public.store_members;
  create policy "members_read_own" on public.store_members
    for select using (user_id = auth.uid());

  drop policy if exists "members_read_owner" on public.store_members;
  create policy "members_read_owner" on public.store_members
    for select using (public.is_store_owner(store_id));

  drop policy if exists "members_manage_owner" on public.store_members;
  create policy "members_manage_owner" on public.store_members
    for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

  -- ----------------------------------------------------------------
  -- categories
  -- ----------------------------------------------------------------
  alter table public.categories enable row level security;

  drop policy if exists "categories_read_member" on public.categories;
  create policy "categories_read_member" on public.categories
    for select using (public.is_store_member(store_id));

  drop policy if exists "categories_write_owner" on public.categories;
  create policy "categories_write_owner" on public.categories
    for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

  -- ----------------------------------------------------------------
  -- products
  -- ----------------------------------------------------------------
  alter table public.products enable row level security;

  drop policy if exists "products_read_member" on public.products;
  create policy "products_read_member" on public.products
    for select using (public.is_store_member(store_id));

  drop policy if exists "products_write_owner" on public.products;
  create policy "products_write_owner" on public.products
    for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

  -- ----------------------------------------------------------------
  -- option_groups
  -- ----------------------------------------------------------------
  alter table public.option_groups enable row level security;

  drop policy if exists "option_groups_read_member" on public.option_groups;
  create policy "option_groups_read_member" on public.option_groups
    for select using (public.is_store_member(store_id));

  drop policy if exists "option_groups_write_owner" on public.option_groups;
  create policy "option_groups_write_owner" on public.option_groups
    for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

  -- ----------------------------------------------------------------
  -- options
  -- ----------------------------------------------------------------
  alter table public.options enable row level security;

  drop policy if exists "options_read_member" on public.options;
  create policy "options_read_member" on public.options
    for select using (
      exists (
        select 1
        from public.option_groups og
        where og.id = public.options.option_group_id
          and public.is_store_member(og.store_id)
      )
    );

  drop policy if exists "options_write_owner" on public.options;
  create policy "options_write_owner" on public.options
    for all using (
      exists (
        select 1
        from public.option_groups og
        where og.id = public.options.option_group_id
          and public.is_store_owner(og.store_id)
      )
    ) with check (
      exists (
        select 1
        from public.option_groups og
        where og.id = public.options.option_group_id
          and public.is_store_owner(og.store_id)
      )
    );

  -- ----------------------------------------------------------------
  -- banks
  -- ----------------------------------------------------------------
  alter table public.banks enable row level security;

  drop policy if exists "banks_read_member" on public.banks;
  create policy "banks_read_member" on public.banks
    for select using (public.is_store_member(store_id));

  drop policy if exists "banks_write_owner" on public.banks;
  create policy "banks_write_owner" on public.banks
    for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

  -- ----------------------------------------------------------------
  -- transactions
  -- ----------------------------------------------------------------
  alter table public.transactions enable row level security;
  alter table public.transaction_items enable row level security;

  drop policy if exists "transactions_read_member" on public.transactions;
  create policy "transactions_read_member" on public.transactions
    for select using (public.is_store_member(store_id));

  drop policy if exists "transactions_write_member" on public.transactions;
  create policy "transactions_write_member" on public.transactions
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

  drop policy if exists "transaction_items_read_member" on public.transaction_items;
  create policy "transaction_items_read_member" on public.transaction_items
    for select using (public.is_store_member(store_id));

  drop policy if exists "transaction_items_write_member" on public.transaction_items;
  create policy "transaction_items_write_member" on public.transaction_items
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

  -- ----------------------------------------------------------------
  -- store_sequences: deny direct access (RPC only)
  -- ----------------------------------------------------------------
  alter table public.store_sequences enable row level security;
end $$;

commit;