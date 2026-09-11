-- V7: Diskon Produk & Voucher
--
-- Menambahkan:
--   1. Tabel `product_discounts` + `product_discount_items` (promo "hari spesial").
--   2. Tabel `vouchers` (kode diskon yang bisa dipakai kasir saat checkout).
--   3. Kolom `discount_amount`, `voucher_id`, `voucher_code` di `transactions`.
--   4. `create_transaction` menghitung ulang diskon/voucher SERVER-SIDE (nilai client tak dipercaya),
--      memvalidasi voucher (aktif, tanggal, min subtotal, kuota), dan menaikkan used_count atomic.
--
-- Aturan diskon (dipakai juga di client helper `lib/pricing.ts`, harus identik):
--   - Diskon produk: per item, promo aktif + dalam rentang tanggal; jika overlap, ambil diskon terbesar.
--   - Voucher (stackable): PERCENT dihitung dari base subtotal (di-cap max_discount), FIXED = min(nilai, subtotal).
--   - total_discount = diskon produk + diskon voucher; pajak dihitung dari (subtotal - total_discount).

begin;

-- ----------------------------------------------------------------
-- product_discounts
-- ----------------------------------------------------------------
create table if not exists public.product_discounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  discount_type text not null check (discount_type in ('PERCENT', 'FIXED')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.product_discounts enable row level security;

drop policy if exists "product_discounts_read_member" on public.product_discounts;
create policy "product_discounts_read_member" on public.product_discounts
  for select using (public.is_store_member(store_id));

drop policy if exists "product_discounts_write_owner" on public.product_discounts;
create policy "product_discounts_write_owner" on public.product_discounts
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

-- ----------------------------------------------------------------
-- product_discount_items
-- ----------------------------------------------------------------
create table if not exists public.product_discount_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  discount_id uuid not null references public.product_discounts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  unique (discount_id, product_id)
);

create index if not exists product_discount_items_discount_idx on public.product_discount_items(discount_id);
create index if not exists product_discount_items_product_idx on public.product_discount_items(product_id);

alter table public.product_discount_items enable row level security;

drop policy if exists "product_discount_items_read_member" on public.product_discount_items;
create policy "product_discount_items_read_member" on public.product_discount_items
  for select using (public.is_store_member(store_id));

drop policy if exists "product_discount_items_write_owner" on public.product_discount_items;
create policy "product_discount_items_write_owner" on public.product_discount_items
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

-- ----------------------------------------------------------------
-- vouchers
-- ----------------------------------------------------------------
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('PERCENT', 'FIXED')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_subtotal numeric(10, 2),
  max_discount numeric(10, 2),
  usage_limit int check (usage_limit is null or usage_limit > 0),
  used_count int not null default 0,
  valid_from date,
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, code)
);

alter table public.vouchers enable row level security;

drop policy if exists "vouchers_read_member" on public.vouchers;
create policy "vouchers_read_member" on public.vouchers
  for select using (public.is_store_member(store_id));

drop policy if exists "vouchers_write_owner" on public.vouchers;
create policy "vouchers_write_owner" on public.vouchers
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

-- ----------------------------------------------------------------
-- transactions: snapshot diskon
-- ----------------------------------------------------------------
alter table public.transactions
  add column if not exists discount_amount int not null default 0,
  add column if not exists voucher_id uuid references public.vouchers(id) on delete set null,
  add column if not exists voucher_code text;

-- ----------------------------------------------------------------
-- create_transaction: hargai diskon & voucher dari DB, bukan client
-- ----------------------------------------------------------------
create or replace function public.create_transaction(
  p_store_id uuid,
  p_cashier_id uuid,
  p_cashier_name text,
  p_order_type public.order_type,
  p_payment_method public.payment_method,
  p_payment_info jsonb,
  p_items jsonb,
  p_voucher_code text default null
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
  _v record;
  _product_price int := 0;
  _opt_price int := 0;
  _opt_cur int := 0;
  _opt_name text := '';
  _item_name text := '';
  _unit_total int := 0;
  _line_subtotal int := 0;
  _discount_item int := 0;
  _discount_total int := 0;
  _voucher_discount numeric := 0;
  _subtotal int := 0;
  _taxable int := 0;
  _tax_rate numeric(5, 4) := 0;
  _tax_amount numeric := 0;
  _total int := 0;
  _txn_id uuid;
  _txn_store_found uuid;
  _cashier_name text := coalesce(nullif(p_cashier_name, ''), 'Kasir');
  _prices jsonb := '[]'::jsonb;
  _voucher_code text := nullif(btrim(coalesce(p_voucher_code, '')), '');
  _voucher_id uuid := null;
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

  -- SECURITY: subtotal dari harga kanonik DB (produk + opsi), klien tidak dipercaya.
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

    _line_subtotal := (_product_price + _opt_price) * (_item.payload->>'quantity')::int;
    _subtotal := _subtotal + _line_subtotal;

    -- diskon produk aktif untuk item ini (overlap -> ambil diskon terbesar per item)
    select coalesce(max(
      case d.discount_type
        when 'PERCENT' then round(_line_subtotal::numeric * d.discount_value / 100.0)::int
        else least(d.discount_value::int, _line_subtotal)
      end
    ), 0) into _discount_item
    from public.product_discounts d
    join public.product_discount_items di on di.discount_id = d.id
      and di.product_id = nullif(_item.payload->>'product_id', '')::uuid
    where d.store_id = p_store_id
      and d.active
      and (d.start_date is null or d.start_date <= current_date)
      and (d.end_date is null or d.end_date >= current_date);

    _discount_total := _discount_total + _discount_item;
  end loop;

  -- voucher: validasi SERVER-SIDE + hitung diskon (stackable dengan diskon produk)
  if _voucher_code is not null then
    select * into _v
    from public.vouchers v
    where v.store_id = p_store_id
      and upper(btrim(v.code)) = upper(_voucher_code)
    for update;

    if not found then
      raise exception 'Voucher tidak ditemukan';
    end if;
    if not _v.active then
      raise exception 'Voucher tidak aktif';
    end if;
    if (_v.valid_from is not null and current_date < _v.valid_from) or
       (_v.valid_until is not null and current_date > _v.valid_until) then
      raise exception 'Voucher sudah tidak berlaku';
    end if;
    if _v.usage_limit is not null and _v.used_count >= _v.usage_limit then
      raise exception 'Voucher sudah habis dipakai';
    end if;
    if _v.min_subtotal is not null and _subtotal < _v.min_subtotal then
      raise exception 'Pembelian belum mencapai minimum untuk voucher ini';
    end if;

    if _v.discount_type = 'PERCENT' then
      _voucher_discount := round(_subtotal::numeric * _v.discount_value / 100.0);
      if _v.max_discount is not null then
        _voucher_discount := least(_voucher_discount, _v.max_discount);
      end if;
    else
      _voucher_discount := least(_v.discount_value, _subtotal::numeric);
    end if;

    _discount_total := _discount_total + _voucher_discount::int;
    _voucher_id := _v.id;
  end if;

  -- pajak dihitung dari subtotal setelah diskon
  if p_order_type = 'DINE_IN' then
    select dine_in_tax into _tax_rate from public.stores where id = p_store_id;
  else
    select takeaway_tax into _tax_rate from public.stores where id = p_store_id;
  end if;

  _taxable := greatest(_subtotal - _discount_total, 0);
  _tax_amount := round(_taxable::numeric * _tax_rate);
  _total := _taxable + _tax_amount::int;
  _txn_no := public.next_transaction_no(p_store_id);

  insert into public.transactions (
    transaction_no,
    store_id,
    cashier_id,
    cashier_name,
    order_type,
    subtotal,
    discount_amount,
    voucher_id,
    voucher_code,
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
    _discount_total,
    _voucher_id,
    case when _voucher_id is not null then upper(_voucher_code) else null end,
    _tax_rate,
    _tax_amount,
    _total,
    p_payment_method,
    coalesce(p_payment_info, '{}'::jsonb),
    'COMPLETED'
  )
  returning id into _txn_id;

  -- naikkan pemakaian voucher secara atomic (satu transaksi DB dengan insert)
  if _voucher_id is not null then
    update public.vouchers set used_count = used_count + 1 where id = _voucher_id;
  end if;

  -- Insert items with DB-canonical prices and options (ignore client prices)
  for _item in
    select el as payload
    from jsonb_array_elements(p_items) el
  loop
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
    'discountAmount', _discount_total,
    'voucherCode', case when _voucher_id is not null then upper(_voucher_code) else null end,
    'taxRate', _tax_rate,
    'taxAmount', _tax_amount,
    'total', _total
  );
end;
$$;

commit;