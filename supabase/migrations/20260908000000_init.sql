-- V1: Initial schema for POS Kasir
-- Enums, tables, indexes, triggers. RLS policies live in a later migration.

begin;

-- ============================================================
-- Enums
-- ============================================================
create type public.member_role as enum ('OWNER', 'CASHIER');
create type public.order_type as enum ('DINE_IN', 'TAKEAWAY');
create type public.payment_method as enum ('CASH', 'BANK_TRANSFER', 'QRIS');
create type public.transaction_status as enum ('PENDING', 'COMPLETED', 'CANCELLED');

-- ============================================================
-- Updated-at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- stores (tenant; settings stored as columns)
-- ============================================================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  information text not null default '',
  logo_url text,
  -- payment settings
  cash_enabled boolean not null default true,
  bank_enabled boolean not null default true,
  qris_enabled boolean not null default true,
  -- qris settings
  qris_image_url text,
  qris_name text not null default 'QRIS',
  -- tax settings (rates stored as decimal fraction: 0.10 = 10%)
  tax_enabled boolean not null default true,
  dine_in_tax numeric(5, 4) not null default 0,
  takeaway_tax numeric(5, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- ============================================================
-- store_members (access via membership)
-- ============================================================
create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'CASHIER',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index idx_store_members_user on public.store_members (user_id);
create index idx_store_members_store on public.store_members (store_id);

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);

create index idx_categories_store on public.categories (store_id, active);

-- ============================================================
-- products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text not null default '',
  image_url text,
  emoji text,
  dine_in_available boolean not null default true,
  takeaway_available boolean not null default true,
  dine_in_price int not null default 0 check (dine_in_price >= 0),
  takeaway_price int not null default 0 check (takeaway_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_min_one_availability check (
    dine_in_available or takeaway_available
  )
);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index idx_products_store_active on public.products (store_id, active);

-- ============================================================
-- option_groups (per product)
-- ============================================================
create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  multiple boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_option_groups_product on public.option_groups (product_id);
create index idx_option_groups_store on public.option_groups (store_id);

-- ============================================================
-- options (belongs to option group)
-- ============================================================
create table public.options (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups (id) on delete cascade,
  name text not null,
  additional_price int not null default 0 check (additional_price >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_options_group on public.options (option_group_id);

-- ============================================================
-- banks
-- ============================================================
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  logo_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);

create index idx_banks_store on public.banks (store_id, active);

-- ============================================================
-- transactions (snapshot-based)
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_no text not null,
  store_id uuid not null references public.stores (id) on delete cascade,
  cashier_id uuid references auth.users (id) on delete set null,
  cashier_name text not null,
  order_type public.order_type not null,
  -- monetary fields are integer rupiah
  subtotal int not null check (subtotal >= 0),
  tax_rate numeric(5, 4) not null default 0,
  tax_amount int not null default 0 check (tax_amount >= 0),
  total int not null check (total >= 0),
  payment_method public.payment_method not null,
  payment_info jsonb not null default '{}'::jsonb,
  status public.transaction_status not null default 'COMPLETED',
  created_at timestamptz not null default now(),
  unique (store_id, transaction_no)
);

create index idx_transactions_store_created on public.transactions (store_id, created_at desc);
create index idx_transactions_status on public.transactions (store_id, status);

-- ============================================================
-- transaction_items (snapshot; product_id kept as reference only)
-- ============================================================
create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid,
  product_name text not null,
  unit_price int not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  selected_options jsonb not null default '[]'::jsonb,
  subtotal int not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index idx_transaction_items_transaction on public.transaction_items (transaction_id);
create index idx_transaction_items_store on public.transaction_items (store_id);

-- ============================================================
-- store_sequences (per-store TRX-XXXX counter)
-- ============================================================
create table public.store_sequences (
  store_id uuid primary key references public.stores (id) on delete cascade,
  last_trx_no int not null default 0
);

commit;