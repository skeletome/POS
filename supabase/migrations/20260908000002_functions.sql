-- V2: Security helper functions + transaction logic
-- Membership checks, per-store TRX sequence, atomic transaction creation.

begin;

-- ============================================================
-- Membership helpers (SECURITY DEFINER, safe against RLS recursion)
-- ============================================================
create or replace function public.is_store_member(_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.store_members
    where user_id = auth.uid()
      and store_id = _store_id
      and active
  );
$$;

create or replace function public.is_store_owner(_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.store_members
    where user_id = auth.uid()
      and store_id = _store_id
      and role = 'OWNER'
      and active
  );
$$;

-- ============================================================
-- get_my_context: session + active membership + store payload
-- ============================================================
create or replace function public.get_my_context()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  _result jsonb;
begin
  select
    jsonb_build_object(
      'profile', (
        select to_jsonb(p) from public.profiles p where p.id = auth.uid()
      ),
      'membership', (
        select to_jsonb(sm)
        from public.store_members sm
        where sm.user_id = auth.uid() and sm.active
        order by (sm.role = 'OWNER') desc, sm.created_at asc
        limit 1
      ),
      'store', (
        select to_jsonb(s)
        from public.store_members sm
        join public.stores s on s.id = sm.store_id
        where sm.user_id = auth.uid() and sm.active
        order by (sm.role = 'OWNER') desc, sm.created_at asc
        limit 1
      )
    )
  into _result;

  if _result is null then
    return null;
  end if;

  return _result;
end;
$$;

-- ============================================================
-- get_store_cashiers: member list for a store (owner)
-- ============================================================
create or replace function public.get_store_cashiers(_store_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sm.id,
        'user_id', sm.user_id,
        'name', p.name,
        'email', p.email,
        'role', sm.role,
        'active', sm.active,
        'createdAt', sm.created_at
      ) order by sm.created_at
    ),
    '[]'::jsonb
  )
  from public.store_members sm
  join public.profiles p on p.id = sm.user_id
  where sm.store_id = _store_id;
$$;

-- ============================================================
-- next_transaction_no: atomic per-store TRX-XXXX increment
-- ============================================================
create or replace function public.next_transaction_no(_store_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _seq int;
begin
  if not public.is_store_member(_store_id) then
    raise exception 'Not a store member';
  end if;

  insert into public.store_sequences (store_id, last_trx_no)
  values (_store_id, 1)
  on conflict (store_id)
  do update set last_trx_no = public.store_sequences.last_trx_no + 1
  returning last_trx_no into _seq;

  return 'TRX-' || lpad(_seq::text, 4, '0');
end;
$$;

-- ============================================================
-- create_transaction: atomic creation of transaction + items
-- prices/taxes are always computed server-side from the store row
-- ============================================================
create or replace function public.create_transaction(
  p_store_id uuid,
  p_cashier_id uuid,
  p_cashier_name text,
  p_order_type public.order_type,
  p_payment_method public.payment_method,
  p_payment_info jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _txn_no text;
  _ref record;
  _subtotal int := 0;
  _tax_rate numeric(5, 4) := 0;
  _tax_amount int := 0;
  _total int := 0;
  _txn_id uuid;
  _txn_store_found uuid;
  _cashier_name text := coalesce(nullif(p_cashier_name, ''), 'Kasir');
begin
  -- authorization: caller must be an active member of the store
  if not public.is_store_member(p_store_id) then
    raise exception 'Not a store member';
  end if;

  -- the issuing store must exist
  select id into _txn_store_found from public.stores where id = p_store_id;
  if _txn_store_found is null then
    raise exception 'Store not found';
  end if;

  -- every product must exist, belong to the store, and be active
  for _ref in
    select distinct (item->>'product_id')::text as pid
    from jsonb_array_elements(p_items) item
  loop
    if _ref.pid is not null and _ref.pid <> '' and not exists (
      select 1
      from public.products p
      where p.id = _ref.pid::uuid
        and p.store_id = p_store_id
        and p.active
    ) then
      raise exception 'Product tidak ditemukan atau tidak aktif';
    end if;
  end loop;

  -- compute totals the canonical way: unit_price * quantity per item
  for _ref in
    select
      (item->>'unit_price')::int as unit_price,
      (item->>'quantity')::int as quantity
    from jsonb_array_elements(p_items) item
  loop
    _subtotal := _subtotal + (_ref.unit_price * _ref.quantity);
  end loop;

  -- tax snapshot uses the current store config
  if p_order_type = 'DINE_IN' then
    select dine_in_tax into _tax_rate from public.stores where id = p_store_id;
  else
    select takeaway_tax into _tax_rate from public.stores where id = p_store_id;
  end if;

  _tax_amount := round(_subtotal * _tax_rate);
  _total := _subtotal + _tax_amount;
  _txn_no := public.next_transaction_no(p_store_id);

  insert into public.transactions (
    transaction_no,
    store_id,
    cashier_id,
    cashier_name,
    order_type,
    subtotal,
    tax_rate,
    tax_amount,
    total,
    payment_method,
    payment_info,
    status
  )
  values (
    _txn_no,
    p_store_id,
    p_cashier_id,
    _cashier_name,
    p_order_type,
    _subtotal,
    _tax_rate,
    _tax_amount,
    _total,
    p_payment_method,
    coalesce(p_payment_info, '{}'::jsonb),
    'COMPLETED'
  )
  returning id into _txn_id;

  insert into public.transaction_items (
    transaction_id,
    store_id,
    product_id,
    product_name,
    unit_price,
    quantity,
    selected_options,
    subtotal
  )
  select
    _txn_id,
    p_store_id,
    nullif(item->>'product_id', '')::uuid,
    item->>'product_name',
    (item->>'unit_price')::int,
    (item->>'quantity')::int,
    coalesce(item->'selected_options', '[]'::jsonb),
    (item->>'unit_price')::int * (item->>'quantity')::int
  from jsonb_array_elements(p_items) item;

  return jsonb_build_object(
    'id', _txn_id,
    'transactionNo', _txn_no,
    'subtotal', _subtotal,
    'taxRate', _tax_rate,
    'taxAmount', _tax_amount,
    'total', _total
  );
end;
$$;

commit;