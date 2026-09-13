-- Customer accounts, order ownership, and payment verification support
-- Safe to run once after the existing orders/order_items tables are present.

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_profiles_phone_idx on public.customer_profiles(phone);
create index if not exists customer_profiles_email_idx on public.customer_profiles(lower(email));

grant select, insert, update on public.customer_profiles to authenticated;
grant all on public.customer_profiles to service_role;
alter table public.customer_profiles enable row level security;

drop policy if exists "Customers read own profile" on public.customer_profiles;
create policy "Customers read own profile"
on public.customer_profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Customers create own profile" on public.customer_profiles;
create policy "Customers create own profile"
on public.customer_profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Customers update own profile" on public.customer_profiles;
create policy "Customers update own profile"
on public.customer_profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop trigger if exists customer_profiles_updated on public.customer_profiles;
create trigger customer_profiles_updated
before update on public.customer_profiles
for each row execute function public.set_updated_at();

-- The project already uses an orders table for Razorpay checkout.
alter table if exists public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table if exists public.orders
  add column if not exists razorpay_payment_id text;

alter table if exists public.orders
  add column if not exists razorpay_signature text;

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_razorpay_order_id_idx on public.orders(razorpay_order_id);

-- Customer order access. Admins retain full access.
do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'grant select, insert, update on public.orders to authenticated';

    execute 'drop policy if exists "Customers read own orders" on public.orders';
    execute 'create policy "Customers read own orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin())';

    execute 'drop policy if exists "Customers create own orders" on public.orders';
    execute 'create policy "Customers create own orders" on public.orders for insert to authenticated with check (user_id = auth.uid() or public.is_admin())';

    execute 'drop policy if exists "Customers update own orders" on public.orders';
    execute 'create policy "Customers update own orders" on public.orders for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin())';

    execute 'alter table public.orders enable row level security';
  end if;

  if to_regclass('public.order_items') is not null then
    execute 'grant select, insert on public.order_items to authenticated';
    execute 'drop policy if exists "Customers read own order items" on public.order_items';
    execute 'create policy "Customers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())))';

    execute 'drop policy if exists "Customers create own order items" on public.order_items';
    execute 'create policy "Customers create own order items" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())))';

    execute 'alter table public.order_items enable row level security';
  end if;
end $$;
