-- Products + orders move from Google Sheets to Supabase — step 1: two NEW empty tables. Not run yet.
-- New names (shop_products / shop_orders) so the old unused products / orders tables are not touched.
-- Only the server (n8n, service role) reads and writes them; nobody else can, from anywhere.
-- Rollback: 20261128c_shop_products_orders_rollback.sql
begin;

create table public.shop_products (
  product_id     text primary key check (char_length(product_id) between 1 and 80),
  business_slug  text not null check (business_slug ~ '^[a-z0-9-]{1,80}$'),
  title          text not null default '',
  description    text not null default '',
  category       text not null default '',
  price          numeric(12,2) not null default 0,
  original_price numeric(12,2) not null default 0,
  images         text[] not null default '{}',
  sizes          text[] not null default '{}',
  colors         text[] not null default '{}',
  stock          integer not null default 0,
  is_active      boolean not null default true,
  extra          jsonb not null default '{}'::jsonb,      -- any other sheet column, kept as-is
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index shop_products_slug_idx on public.shop_products (business_slug);

create table public.shop_orders (
  order_id          text primary key check (char_length(order_id) between 1 and 80),
  business_slug     text not null default '',
  business_name     text not null default '',
  customer_name     text not null default '',
  customer_phone    text not null default '',            -- text, so the leading 0 is never lost
  customer_email    text not null default '',
  customer_address  text not null default '',
  product_name      text not null default '',
  product_price     numeric(12,2) not null default 0,
  selected_size     text not null default '',
  selected_color    text not null default '',
  quantity          integer not null default 1,
  total_price       numeric(12,2) not null default 0,
  payment_method    text not null default 'cod',
  transaction_id    text not null default '',
  delivery_location text not null default '',
  delivery_charge   numeric(12,2) not null default 0,
  status            text not null default 'pending',
  source            text not null default 'website',
  woo_order_id      text not null default '',
  ordered_at        timestamptz,
  extra             jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index shop_orders_slug_idx on public.shop_orders (business_slug, ordered_at desc);

create trigger shop_products_touch before update on public.shop_products for each row execute function public.builder_touch_updated_at();
create trigger shop_orders_touch   before update on public.shop_orders   for each row execute function public.builder_touch_updated_at();

alter table public.shop_products enable row level security;
alter table public.shop_orders   enable row level security;
revoke all on public.shop_products, public.shop_orders from anon, authenticated;
grant all on public.shop_products, public.shop_orders to service_role;   -- this project does not grant it automatically

commit;
