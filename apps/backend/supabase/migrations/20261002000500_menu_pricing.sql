-- =====================================================================
-- NightOut · เฟส 1 / 5 — เมนู · ค่าธรรมเนียม · เซ็ตโต๊ะ · โปรโมชันของร้าน
-- เมนู/เซ็ตโต๊ะแสดงเพื่อประเมินงบเท่านั้น (ไม่มีสั่งล่วงหน้า)
-- =====================================================================
set search_path = public, extensions;

create table public.menu_categories (
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid not null references public.bars(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger menu_categories_updated_at before update on public.menu_categories for each row execute function public.set_updated_at();

create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  bar_id       uuid not null references public.bars(id) on delete cascade,
  category_id  uuid references public.menu_categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  unit_label   text,                                     -- 'ขวด', 'จาน', 'แก้ว'
  image_path   text,                                     -- bucket bar-media
  is_available boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index menu_items_bar on public.menu_items (bar_id, category_id, sort_order);
create trigger menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();

create table public.bar_fees (
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references public.bars(id) on delete cascade,
  fee_type    public.fee_type not null,
  label       text not null,
  calc        public.fee_calc not null,
  value       numeric(10,2) not null check (value >= 0),  -- PERCENTAGE: 10 = 10% · FIXED_*: บาท
  apply_order smallint not null default 0,              -- SC ก่อน VAT
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger bar_fees_updated_at before update on public.bar_fees for each row execute function public.set_updated_at();

create table public.price_packages (                     -- เซ็ตโต๊ะ เช่น "เซ็ตโต๊ะ 3–4 คน"
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references public.bars(id) on delete cascade,
  name          text not null,
  description   text,
  pax_min       smallint not null check (pax_min >= 1),
  pax_max       smallint not null,
  total_price   numeric(10,2) not null check (total_price >= 0),
  fees_included boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (pax_max >= pax_min)
);
create trigger price_packages_updated_at before update on public.price_packages for each row execute function public.set_updated_at();

create table public.price_package_items (
  id                  uuid primary key default gen_random_uuid(),
  package_id          uuid not null references public.price_packages(id) on delete cascade,
  menu_item_id        uuid references public.menu_items(id) on delete set null,
  name_snapshot       text not null,
  quantity            smallint not null check (quantity > 0),
  unit_price_snapshot numeric(10,2) not null,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger price_package_items_updated_at before update on public.price_package_items for each row execute function public.set_updated_at();

create table public.bar_promotions (                     -- โปรที่ลูกค้าเลือกได้ 1 อย่างตอนจอง · แอดมินตรวจถ้อยคำก่อนแสดง
  id                uuid primary key default gen_random_uuid(),
  bar_id            uuid not null references public.bars(id) on delete cascade,
  title             text not null,
  description       text,
  perk_type         public.perk_type not null,
  discount_percent  numeric(5,2) check (discount_percent between 0 and 100),
  days_of_week      smallint[] not null default '{0,1,2,3,4,5,6}',
  valid_from        date,
  valid_to          date,
  cutoff_time       time,                                -- ต้องเช็กอินก่อนเวลานี้
  min_pax           smallint,
  max_per_night     smallint,                            -- โควตาต่อคืน (null = ไม่จำกัด)
  moderation_status public.moderation_status not null default 'PENDING',
  moderated_by      uuid references public.users(id) on delete set null,
  active            boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
create index bar_promotions_live on public.bar_promotions (bar_id) where active and moderation_status = 'APPROVED';
create trigger bar_promotions_updated_at before update on public.bar_promotions for each row execute function public.set_updated_at();
