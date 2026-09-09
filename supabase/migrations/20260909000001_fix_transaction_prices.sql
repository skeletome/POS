-- V6: Security fix — enforce server-side canonical prices in create_transaction
--
-- The original RPC accepted unit_price and selected_options prices from the client,
-- allowing price manipulation. This migration replaces the function to:
--   1. Look up canonical product prices from the products table based on order_type.
--   2. Look up canonical option add-on prices from the options table.
--   3. Reject products/options that don't belong to the store.
-- Client-supplied prices are ignored entirely.

begin;

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
  _item record;
  _opt record;
  _product_price int := 0;
  _opt_price int := 0;
  _opt_cur int := 0;
  _opt_name text := '';
  _item_name text := '';
  _unit_total int := 0;
  _subtotal int := 0;
  _tax_rate numeric(5, 4) := 0;
  _tax_amount int := 0;
  _total int := 0;
  _txn_id uuid;
  _txn_store_found uuid;
  _cashier_name text := coalesce(nullif(p_cashier_name, ''), 'Kasir');
  _prices jsonb := '[]'::jsonb;
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
  for _item in
    select distinct (el->>'product_id')::text as pid
    from jsonb_array_elements(p_items) el
  loop
    if _item.pid is not null and _item.pid <> '' and not exists (
      select 1
      from public.products p
      where p.id = _item.pid::uuid
        and p.store_id = p_store_id
        and p.active
    ) then
      raise exception 'Product tidak ditemukan atau tidak aktif';
    end if;
  end loop;

  -- SECURITY FIX: compute subtotal from DB-canonical product prices (ignore client price).
  -- Also validate and price option add-ons from the catalog.
  for _item in
    select
      el as payload
    from jsonb_array_elements(p_items) el
  loop
    -- canonical product price + name (name also from DB, not client)
    select
      case p_order_type
        when 'DINE_IN' then p.dine_in_price
        else p.takeaway_price
      end,
      p.name
    into _product_price, _item_name
    from public.products p
    where p.id = nullif(_item.payload->>'product_id', '')::uuid
      and p.store_id = p_store_id
      and p.active;

    if not found then
      raise exception 'Product tidak ditemukan atau tidak aktif';
    end if;

    -- canonical option prices
    _opt_price := 0;
    for _opt in
      select oo.value as opt_payload
      from jsonb_array_elements(coalesce(_item.payload->'selected_options', '[]'::jsonb)) oo
    loop
      select o.additional_price, o.name
      into _opt_cur, _opt_name
      from public.options o
      join public.option_groups og on og.id = o.option_group_id
      where o.id = (_opt.opt_payload->>'optionId')::uuid
        and og.store_id = p_store_id;

      if not found then
        raise exception 'Opsi tidak ditemukan atau tidak berlaku untuk store ini';
      end if;

      _opt_price := _opt_price + _opt_cur;
    end loop;

    _subtotal := _subtotal + (_product_price + _opt_price) * (_item.payload->>'quantity')::int;
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

  -- Insert items with DB-canonical prices and options (ignore client prices)
  for _item in
    select el as payload
    from jsonb_array_elements(p_items) el
  loop
    -- canonical product price + name
    select
      case p_order_type
        when 'DINE_IN' then p.dine_in_price
        else p.takeaway_price
      end,
      p.name
    into _product_price, _item_name
    from public.products p
    where p.id = nullif(_item.payload->>'product_id', '')::uuid
      and p.store_id = p_store_id
      and p.active;

    -- rebuild canonical options
    _prices := '[]'::jsonb;
    _opt_price := 0;
    for _opt in
      select oo.value as opt_payload
      from jsonb_array_elements(coalesce(_item.payload->'selected_options', '[]'::jsonb)) oo
    loop
      select o.additional_price, o.name
      into _opt_cur, _opt_name
      from public.options o
      join public.option_groups og on og.id = o.option_group_id
      where o.id = (_opt.opt_payload->>'optionId')::uuid
        and og.store_id = p_store_id;

      _opt_price := _opt_price + _opt_cur;

      _prices := _prices || jsonb_build_object(
        'optionId', _opt.opt_payload->>'optionId',
        'optionName', _opt_name,
        'additionalPrice', _opt_cur
      );
    end loop;

    _unit_total := _product_price + _opt_price;

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
    values (
      _txn_id,
      p_store_id,
      nullif(_item.payload->>'product_id', '')::uuid,
      _item_name,
      _unit_total,
      (_item.payload->>'quantity')::int,
      coalesce(_prices, '[]'::jsonb),
      _unit_total * (_item.payload->>'quantity')::int
    );
  end loop;

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