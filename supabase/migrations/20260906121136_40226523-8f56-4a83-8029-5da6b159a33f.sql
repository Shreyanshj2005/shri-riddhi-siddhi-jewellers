-- ========== ROLES ==========
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.admin_invites (
  email text primary key,
  invited_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.admin_invites to authenticated;
grant all on public.admin_invites to service_role;
alter table public.admin_invites enable row level security;
create policy "Admins manage invites" on public.admin_invites for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- First signed-in user becomes admin; later users need an invite by email.
create or replace function public.claim_admin()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text;
begin
  if _uid is null then return false; end if;
  if exists (select 1 from public.user_roles where user_id = _uid and role = 'admin') then return true; end if;
  select email into _email from auth.users where id = _uid;
  if not exists (select 1 from public.user_roles where role = 'admin')
     or exists (select 1 from public.admin_invites where lower(email) = lower(_email)) then
    insert into public.user_roles (user_id, role) values (_uid, 'admin') on conflict do nothing;
    delete from public.admin_invites where lower(email) = lower(_email);
    return true;
  end if;
  return false;
end $$;
grant execute on function public.claim_admin() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

-- ========== COMMON ==========
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ========== CATEGORIES ==========
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  "group" text not null default 'type', -- 'material' | 'type'
  parent_id uuid references public.categories(id) on delete set null,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public reads active categories" on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();

-- ========== COLLECTIONS ==========
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'collection', -- 'collection' | 'gift' | 'occasion'
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.collections to anon;
grant select, insert, update, delete on public.collections to authenticated;
grant all on public.collections to service_role;
alter table public.collections enable row level security;
create policy "Public reads active collections" on public.collections for select to anon, authenticated using (is_active or public.is_admin());
create policy "Admins manage collections" on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger collections_updated before update on public.collections for each row execute function public.set_updated_at();

-- ========== PRODUCTS ==========
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  price numeric(12,2) not null default 0,
  original_price numeric(12,2),
  offer_label text,
  metal text,
  purity text,
  gender text,
  stone text,
  occasions text[] not null default '{}',
  style text,
  diamond_type text,
  diamond_shape text,
  diamond_carat numeric(8,3),
  diamond_colour text,
  diamond_clarity text,
  cut text,
  certification text,
  num_stones text,
  total_diamond_weight numeric(8,3),
  product_weight numeric(8,3),
  description text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  best_seller boolean not null default false,
  is_new boolean not null default false,
  status text not null default 'draft', -- draft | published | hidden
  stock_status text not null default 'in_stock', -- in_stock | out_of_stock | made_to_order
  popularity int not null default 0,
  sales_count int not null default 0,
  rating numeric(2,1) not null default 5.0,
  seo_title text,
  seo_description text,
  search_text text,
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products(status) where deleted_at is null;
create index products_category_idx on public.products(category_id);
create index products_search_idx on public.products using gin (to_tsvector('simple', coalesce(search_text,'')));
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public reads published products" on public.products for select to anon, authenticated
  using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.products_before_write()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  if tg_op = 'INSERT' then new.created_by = coalesce(new.created_by, auth.uid()); end if;
  new.search_text = lower(concat_ws(' ', new.name, new.sku, new.metal, new.purity, new.gender, new.stone,
    new.diamond_type, new.diamond_shape, new.style, new.description,
    array_to_string(new.tags, ' '), array_to_string(new.occasions, ' '),
    (select c.name from public.categories c where c.id = new.category_id),
    (select c.name from public.categories c where c.id = new.subcategory_id)));
  return new;
end $$;
create trigger products_before_write before insert or update on public.products for each row execute function public.products_before_write();

-- ========== PRODUCT IMAGES ==========
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, sort_order);
grant select on public.product_images to anon;
grant select, insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "Public reads images of published products" on public.product_images for select to anon, authenticated
  using (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.status = 'published' and p.deleted_at is null));
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== PRODUCT <-> COLLECTIONS ==========
create table public.product_collections (
  product_id uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, collection_id)
);
grant select on public.product_collections to anon;
grant select, insert, update, delete on public.product_collections to authenticated;
grant all on public.product_collections to service_role;
alter table public.product_collections enable row level security;
create policy "Public reads product collections" on public.product_collections for select to anon, authenticated using (true);
create policy "Admins manage product collections" on public.product_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== RATES ==========
create table public.rates (
  key text primary key,
  label text not null,
  unit text not null default 'per gram',
  current_rate numeric(12,2),
  previous_rate numeric(12,2),
  notes text,
  sort_order int not null default 0,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select on public.rates to anon;
grant select, insert, update, delete on public.rates to authenticated;
grant all on public.rates to service_role;
alter table public.rates enable row level security;
create policy "Public reads rates" on public.rates for select to anon, authenticated using (true);
create policy "Admins manage rates" on public.rates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.rates_before_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.current_rate is distinct from old.current_rate then new.previous_rate = old.current_rate; end if;
  new.updated_at = now(); new.updated_by = auth.uid(); return new;
end $$;
create trigger rates_before_update before update on public.rates for each row execute function public.rates_before_update();

-- ========== OFFERS ==========
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  badge text,
  image_url text,
  link text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.offers to anon;
grant select, insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "Public reads active offers" on public.offers for select to anon, authenticated using (is_active or public.is_admin());
create policy "Admins manage offers" on public.offers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger offers_updated before update on public.offers for each row execute function public.set_updated_at();

-- ========== REVIEWS ==========
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int not null default 5,
  review_text text not null,
  source text default 'Google',
  review_date date,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public reads visible reviews" on public.reviews for select to anon, authenticated using (is_visible or public.is_admin());
create policy "Admins manage reviews" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();

-- ========== HOMEPAGE SECTIONS ==========
create table public.homepage_sections (
  key text primary key,
  title text not null,
  subtitle text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.homepage_sections to anon;
grant select, insert, update, delete on public.homepage_sections to authenticated;
grant all on public.homepage_sections to service_role;
alter table public.homepage_sections enable row level security;
create policy "Public reads sections" on public.homepage_sections for select to anon, authenticated using (true);
create policy "Admins manage sections" on public.homepage_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger sections_updated before update on public.homepage_sections for each row execute function public.set_updated_at();

-- ========== MEDIA ==========
create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  url text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  kind text not null default 'other', -- product | hero | banner | video | other
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.media to authenticated;
grant all on public.media to service_role;
alter table public.media enable row level security;
create policy "Admins manage media" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== SETTINGS ==========
create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select on public.settings to anon;
grant select, insert, update, delete on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "Public reads public settings" on public.settings for select to anon, authenticated using (is_public or public.is_admin());
create policy "Admins manage settings" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger settings_updated before update on public.settings for each row execute function public.set_updated_at();

-- ========== ENQUIRIES ==========
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  customer_name text not null,
  phone text not null,
  message text,
  channel text not null default 'website',
  status text not null default 'new', -- new | contacted | closed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.enquiries to anon;
grant select, insert, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "Anyone can submit enquiry" on public.enquiries for insert to anon, authenticated with check (true);
create policy "Admins manage enquiries" on public.enquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger enquiries_updated before update on public.enquiries for each row execute function public.set_updated_at();

-- ========== AUDIT LOG ==========
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Admins read audit" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "Admins write audit" on public.audit_logs for insert to authenticated with check (public.is_admin());

-- ========== SEED DATA ==========
insert into public.categories (name, slug, "group", sort_order, description) values
 ('Gold Jewellery','gold-jewellery','material',1,'Timeless 22K & 18K gold designs'),
 ('Diamond Jewellery','diamond-jewellery','material',2,'Certified natural & lab-grown diamonds'),
 ('Solitaire Jewellery','solitaire-jewellery','material',3,'Single-stone statements'),
 ('Gemstone Jewellery','gemstone-jewellery','material',4,'Ruby, emerald, sapphire & pearl'),
 ('Bridal Jewellery','bridal-jewellery','material',5,'Heirloom sets for the big day'),
 ('Silver Jewellery','silver-jewellery','material',6,'Everyday sterling silver'),
 ('Rings','rings','type',10,null),
 ('Necklaces','necklaces','type',11,null),
 ('Earrings','earrings','type',12,null),
 ('Pendants','pendants','type',13,null),
 ('Bracelets','bracelets','type',14,null),
 ('Bangles','bangles','type',15,null),
 ('Mangalsutra','mangalsutra','type',16,null),
 ('Nose Pins','nose-pins','type',17,null),
 ('Chains','chains','type',18,null),
 ('Men''s Jewellery','mens-jewellery','type',19,null),
 ('Kids Jewellery','kids-jewellery','type',20,null);

insert into public.collections (name, slug, kind, sort_order, description) values
 ('New Arrivals','new-arrivals','collection',1,'Fresh from the atelier'),
 ('Best Sellers','best-sellers','collection',2,'Loved by Sultanpur'),
 ('Diamond Favourites','diamond-favourites','collection',3,'Our most admired diamond pieces'),
 ('Solitaire Collection','solitaire-collection','collection',4,'One stone. Infinite meaning.'),
 ('Bridal Collection','bridal-collection','collection',5,'For the most precious day'),
 ('Gift Collection','gift-collection','collection',6,'Thoughtfully chosen'),
 ('Premium Collection','premium-collection','collection',7,'The finest we make'),
 ('Wedding','wedding','occasion',1,null),
 ('Engagement','engagement','occasion',2,null),
 ('Anniversary','anniversary','occasion',3,null),
 ('Birthday','birthday','occasion',4,null),
 ('Festival','festival','occasion',5,null),
 ('Daily Wear','daily-wear','occasion',6,null),
 ('Party','party','occasion',7,null),
 ('Special Occasion','special-occasion','occasion',8,null),
 ('Birthday Gifts','birthday-gifts','gift',1,null),
 ('Anniversary Gifts','anniversary-gifts','gift',2,null),
 ('Wedding Gifts','wedding-gifts','gift',3,null),
 ('Engagement Gifts','engagement-gifts','gift',4,null),
 ('Festival Gifts','festival-gifts','gift',5,null),
 ('Valentine Gifts','valentine-gifts','gift',6,null),
 ('Gifts For Her','gifts-for-her','gift',7,null),
 ('Gifts For Him','gifts-for-him','gift',8,null),
 ('Premium Gifts','premium-gifts','gift',11,null);

insert into public.rates (key, label, unit, current_rate, previous_rate, sort_order) values
 ('gold_24k','24K Gold','per gram',7850,7810,1),
 ('gold_22k','22K Gold','per gram',7200,7160,2),
 ('gold_18k','18K Gold','per gram',5900,5870,3),
 ('silver','Silver','per gram',98,96,4),
 ('diamond_start','Diamond Jewellery Starting Price','starting from',12500,null,5),
 ('diamond_per_carat','Diamond Price Per Carat','per carat (indicative)',85000,null,6);
update public.rates set notes = 'Diamond jewellery is priced per piece. Final value depends on carat, cut, colour, clarity, certification and setting.' where key like 'diamond%';

insert into public.homepage_sections (key, title, subtitle, sort_order) values
 ('hero','Hero',null,0),
 ('diamond_intro','Diamond Jewellery','Brilliance, certified. Discover diamonds chosen for fire, cut and character.',1),
 ('shop_diamond_jewellery','Shop Diamond Jewellery','Rings, necklaces, earrings, pendants, bracelets and bangles',2),
 ('diamond_favourites','Diamond Favourites','Our most admired diamond pieces',3),
 ('shop_by_price','Shop By Price','Find the perfect piece within your budget',4),
 ('shop_by_diamond_type','Shop By Diamond Type','Natural, lab-grown, solitaire and diamond with gemstones',5),
 ('shop_by_occasion','Shop By Occasion','Jewellery for every celebration',6),
 ('best_sellers','Best Selling Diamonds','Loved by our customers',7),
 ('solitaire','Solitaire Collection','One stone. Infinite meaning.',8),
 ('gold','Gold Jewellery','Timeless 22K and 18K designs',9),
 ('gemstones','Certified Gemstones','Ruby, emerald, sapphire and pearl',10),
 ('gifts','Gifts','Thoughtful jewellery for every occasion',11),
 ('why_us','Why Choose Us','Trusted by Sultanpur for generations',12),
 ('about','About The Showroom',null,13),
 ('reviews','What Our Customers Say','Rated 5.0 on Google',14),
 ('location','Visit Our Showroom',null,15),
 ('contact','Get In Touch',null,16);

insert into public.settings (key, value) values
 ('promo_bar', '{"text":"Exclusive Jewellery Offers | Certified Diamonds | Visit Our Sultanpur Showroom","visible":true}'),
 ('hero', '{"heading":"Elegance That Lasts Forever","subtitle":"Discover exquisite jewellery, diamonds and certified gemstones crafted for life''s most precious moments.","primary_cta":"Explore Collection","primary_link":"/jewellery","secondary_cta":"Visit Our Showroom","secondary_link":"/contact","video_url":"","poster_url":""}'),
 ('contact', '{"business_name":"Shri Riddhi Siddhi Jewellers","phone":"096530 69612","whatsapp":"919653069612","address_line1":"Badi Durga Maa Sthal, Chowk, Thatheri Bazaar","address_line2":"Khairabad, Sultanpur, Uttar Pradesh 228001","hours":"Mon – Sun: 10:30 AM – 8:30 PM","email":"","rating":"5.0","review_count":"177+"}'),
 ('map', '{"query":"Shri Riddhi Siddhi Jewellers, Thatheri Bazaar, Khairabad, Sultanpur, Uttar Pradesh 228001","embed_url":""}'),
 ('about', '{"heading":"A Legacy Of Trust In Sultanpur","body":"Located at Badi Durga Maa Sthal in the heart of Thatheri Bazaar, Shri Riddhi Siddhi Jewellers has served families across Sultanpur with certified diamonds, hallmarked gold and genuine gemstones. Every piece is selected for purity, craftsmanship and lasting value.","image_url":""}'),
 ('why_us', '{"items":[{"title":"Certified Diamonds","text":"Every diamond comes with an authentic certificate."},{"title":"BIS Hallmarked Gold","text":"Guaranteed purity in every gram."},{"title":"Genuine Gemstones","text":"Lab-tested ruby, emerald, sapphire and pearl."},{"title":"Transparent Pricing","text":"Daily updated rates, no hidden charges."}]}'),
 ('seo', '{"title":"Shri Riddhi Siddhi Jewellers | Jewellery Showroom in Sultanpur","description":"Discover premium gold, diamond jewellery and certified gemstones at Shri Riddhi Siddhi Jewellers in Sultanpur, Uttar Pradesh."}');