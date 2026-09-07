alter table public.products add column discount_pct int generated always as (
  case when original_price is not null and original_price > price and original_price > 0
       then round(((original_price - price) / original_price) * 100)::int else 0 end) stored;
create index products_discount_idx on public.products(discount_pct desc);