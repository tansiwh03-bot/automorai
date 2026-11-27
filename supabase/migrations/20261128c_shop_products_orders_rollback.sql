-- Rollback for 20261128c_shop_products_orders.sql — removes ONLY the two new tables (Google Sheets are never touched).
begin;
drop table if exists public.shop_orders;
drop table if exists public.shop_products;
commit;
