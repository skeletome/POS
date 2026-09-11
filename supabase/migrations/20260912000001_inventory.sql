-- V8: Manajemen Stok Produk (Model 1 — stok per produk jadi)
--
-- Menambahkan:
--   1. Kolom stok di `products`: track_stock, stock, low_stock_threshold.
--   2. Tabel `stock_movements` (ledger immutable) + RLS (select member, insert owner,
--      TANPA policy update/delete alias immutable).
--   3. `create_transaction` menurunkan stok ATOMIK per item (tolak oversell) + log SALE.
--   4. `cancel_transaction`: batal + restock RETURN idempotent (satu transaksi DB).
--   5. `stock_mutation`: PURCHASE / ADJUST / OPNAME (hanya Owner, wajib catatan utk selain PURCHASE).
--
-- Aturan (dipakai juga di PRD #23, `docs/database.md`):
--   - quantity bertanda: SALE = -qty, PURCHASE/RETURN = +qty, ADJUSTMENT/OPNAME = selisih (+/-).
--   - balance_after disimpan per baris → riwayat konsisten meskipun ada koreksi manual.

begin;

-- ----------------------------------------------------------------
-- products: kolom stok
-- ----------------------------------------------------------------
alter table public.products
  add column if not exists track_stock boolean not null default false,
  add column if not exists stock int not null default 0,
  add column if not exists low_stock_threshold int not null default 5;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_stock_non_negative check (stock >= 0);
  end if;
end $$;

-- ----------------------------------------------------------------
-- stock_movements: ledger immutable
-- ----------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  movement_type text not null check (movement_type in ('SALE', 'RETURN', 'PURCHASE', 'ADJUSTMENT', 'OPNAME')),
  quantity int not null check (quantity <> 0),
  balance_after int not null check (balance_after >= 0),
  transaction_id uuid references public.transactions (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_store_product_created
  on public.stock_movements (store_id, product_id, created_at desc);
create index if not exists idx_stock_movements_transaction
  on public.stock_movements (transaction_id);

alter table public.stock_movements enable row level security;

-- select: member bisa melihat riwayat stok store.
drop policy if exists "stock_movements_read_member" on public.stock_movements;
create policy "stock_movements_read_member" on public.stock_movements
  for select using (public.is_store_member(store_id));

-- insert: hanya Owner. SENGJA TIDAK ada policy update/delete -> ledger immutable.
drop policy if exists "stock_movements_write_owner" on public.stock_movements;
create policy "stock_movements_write_owner" on public.stock_movements
  for insert with check (public.is_store_owner(store_id));

-- ----------------------------------------------------------------
-- create_transaction: decrement stok atomik + log SALE
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
  _track_stock boolean := false;
  _stock_cur int := 0;
  _qty int := 0;
  _product_id uuid;
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
    _product_id := nullif(_item.payload->>'product_id', '')::uuid;
    _qty := (_item.payload->>'quantity')::int;

    select
      case p_order_type
        when 'DINE_IN' then p.dine_in_price
        else p.takeaway_price
      end,
      p.name,
      p.track_stock,
      p.stock
    into _product_price, _item_name, _track_stock, _stock_cur
    from public.products p
    where p.id = _product_id
      and p.store_id = p_store_id
      and p.active;

    -- kurangi stok ATOMIK (lock baris) untuk produk bertrack; tolak oversell
    if _track_stock then
      update public.products
        set stock = stock - _qty
        where id = _product_id
          and store_id = p_store_id
          and stock >= _qty;

      if not found or _stock_cur < _qty then
        raise exception 'Stok % tidak mencukupi (sisa %)', _item_name, _stock_cur;
      end if;

      insert into public.stock_movements (
        store_id,
        product_id,
        movement_type,
        quantity,
        balance_after,
        transaction_id,
        created_by,
        note
      )
      values (
        p_store_id,
        _product_id,
        'SALE',
        -_qty,
        _stock_cur - _qty,
        _txn_id,
        auth.uid(),
        null
      );
    end if;

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
      _product_id,
      _item_name,
      _unit_total,
      _qty,
      coalesce(_prices, '[]'::jsonb),
      _unit_total * _qty
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

-- ----------------------------------------------------------------
-- cancel_transaction: batal (CANCELLED) + restock RETURN idempotent
-- ----------------------------------------------------------------
create or replace function public.cancel_transaction(
  p_transaction_no text,
  p_store_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _txn_id uuid;
  _status public.transaction_status;
  _sm record;
  _balance int := 0;
begin
  -- hanya Owner (pembatalan transaksi + restock)
  if not public.is_store_owner(p_store_id) then
    raise exception 'Hanya Owner yang dapat membatalkan transaksi';
  end if;

  select id, status
  into _txn_id, _status
  from public.transactions
  where transaction_no = p_transaction_no
    and store_id = p_store_id
  for update;

  if _txn_id is null then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  -- idempotent: transaksi sudah CANCELLED -> tidak ada yang diubah
  if _status = 'CANCELLED' then
    return jsonb_build_object('id', _txn_id, 'status', 'CANCELLED', 'restocked', false);
  end if;

  update public.transactions set status = 'CANCELLED' where id = _txn_id;

  -- hanya transaksi COMPLETED yang pernah menurunkan stok (SALE) -> restock
  if _status = 'COMPLETED' then
    for _sm in
      select product_id, quantity
      from public.stock_movements
      where transaction_id = _txn_id
        and movement_type = 'SALE'
    loop
      if _sm.product_id is not null then
        update public.products
          set stock = stock - _sm.quantity
          where id = _sm.product_id
            and store_id = p_store_id;

        select stock into _balance
        from public.products
        where id = _sm.product_id;

        insert into public.stock_movements (
          store_id,
          product_id,
          movement_type,
          quantity,
          balance_after,
          transaction_id,
          created_by,
          note
        )
        values (
          p_store_id,
          _sm.product_id,
          'RETURN',
          -_sm.quantity,
          coalesce(_balance, 0),
          _txn_id,
          auth.uid(),
          'Pembatalan transaksi'
        );
      end if;
    end loop;
  end if;

  return jsonb_build_object('id', _txn_id, 'status', 'CANCELLED', 'restocked', _status = 'COMPLETED');
end;
$$;

-- ----------------------------------------------------------------
-- stock_mutation: PURCHASE / ADJUST / OPNAME (hanya Owner)
-- ----------------------------------------------------------------
create or replace function public.stock_mutation(
  p_product_id uuid,
  p_store_id uuid,
  p_type text,
  p_quantity int default 0,
  p_new_stock int default null,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _cur int := 0;
  _next int := 0;
  _delta int := 0;
  _mv_type text;
  _note text := btrim(coalesce(p_note, ''));
  _track boolean := false;
  _active boolean := false;
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'Hanya Owner yang dapat mengubah stok';
  end if;

  if p_type not in ('PURCHASE', 'ADJUST', 'OPNAME') then
    raise exception 'Tipe mutasi tidak valid';
  end if;

  select track_stock, active, stock
  into _track, _active, _cur
  from public.products
  where id = p_product_id and store_id = p_store_id
  for update;

  if not found then
    raise exception 'Produk tidak ditemukan';
  end if;
  if not _track then
    raise exception 'Produk tidak melacak stok — aktifkan "Lacak stok" terlebih dahulu';
  end if;
  if not _active then
    raise exception 'Produk nonaktif tidak dapat disesuaikan stoknya';
  end if;

  if p_type = 'PURCHASE' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception 'Jumlah tambahan stok harus lebih dari 0';
    end if;
    _next := _cur + p_quantity;
    _delta := p_quantity;
    _mv_type := 'PURCHASE';
    _note := coalesce(nullif(_note, ''), 'Penambahan stok / pembelian barang');
  else
    if p_new_stock is null or p_new_stock < 0 then
      raise exception 'Stok akhir tidak boleh negatif';
    end if;
    _next := p_new_stock;
    _delta := p_new_stock - _cur;
    if p_type = 'ADJUST' then
      _mv_type := 'ADJUSTMENT';
      _note := coalesce(nullif(_note, ''), 'Penyesuaian stok');
    else
      _mv_type := 'OPNAME';
      _note := coalesce(nullif(_note, ''), 'Opname stok (hitung fisik)');
    end if;
  end if;

  if _delta <> 0 then
    update public.products set stock = _next where id = p_product_id and store_id = p_store_id;

    insert into public.stock_movements (
      store_id,
      product_id,
      movement_type,
      quantity,
      balance_after,
      transaction_id,
      created_by,
      note
    )
    values (
      p_store_id,
      p_product_id,
      _mv_type,
      _delta,
      _next,
      null,
      auth.uid(),
      _note
    );
  end if;

  return jsonb_build_object('productId', p_product_id, 'type', _mv_type, 'stock', _next, 'delta', _delta, 'note', _note);
end;
$$;

commit;