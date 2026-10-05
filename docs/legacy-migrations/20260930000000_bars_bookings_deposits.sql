-- =====================================================================
-- NightOut · 0002 bars + promotions + bookings + deposits (เงินเข้าแพลตฟอร์ม)
-- ตรงกับ packages/mock/src/models.ts (โหมดเดโม) เพื่อให้ย้ายทีละหน้าได้
-- =====================================================================

-- ---------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;   -- gen_random_bytes() ของ share_token

create type public.bar_category as enum ('PUB_BAR', 'CHILL', 'RESTAURANT');
create type public.bar_status   as enum ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
create type public.crowd_status as enum ('AVAILABLE', 'ALMOST_FULL', 'FULL');
create type public.deposit_unit as enum ('PER_TABLE', 'PER_PERSON');
create type public.booking_status as enum (
  'PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'CONFIRMED', 'CHECKED_IN',
  'REJECTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MERCHANT', 'NO_SHOW', 'EXPIRED', 'COMPLETED'
);
create type public.deposit_status as enum ('SUBMITTED', 'VERIFIED', 'REJECTED');
-- เงินมัดจำอยู่ที่ไหน: แพลตฟอร์มถือไว้ → รอโอนให้ร้าน → โอนแล้ว / เครดิตร้าน / คืนลูกค้า
create type public.deposit_settlement as enum ('HELD', 'PAYOUT_PENDING', 'PAID_OUT', 'CREDIT', 'REFUNDED');

-- ---------------------------------------------------------------------
-- bars
-- ---------------------------------------------------------------------
create table public.bars (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null check (char_length(name) between 1 and 80),
  category              public.bar_category not null,
  district              text not null,
  address               text not null,
  lat                   double precision not null,
  lng                   double precision not null,
  description           text not null default '',
  styles                text[] not null default '{}',
  cover_url             text,
  hours                 jsonb not null default '[]',      -- [{day, open, close, closed}]
  fees                  jsonb not null default '{"serviceChargeRate":10,"vatRate":7,"otherFees":0}',
  links                 jsonb not null default '[]',
  crowd                 public.crowd_status not null default 'AVAILABLE',
  crowd_updated_at      timestamptz not null default now(),
  score                 numeric(5,2) not null default 0,
  rating                numeric(3,2) not null default 0,
  review_count          integer not null default 0,
  avg_per_person        integer not null default 0,
  status                public.bar_status not null default 'DRAFT',
  promoted              boolean not null default false,
  editors_pick          boolean not null default false,
  -- มัดจำ: เก็บทุกการจอง เงินเข้าแพลตฟอร์มก่อน
  deposit_amount        integer not null default 300 check (deposit_amount >= 0),
  deposit_unit          public.deposit_unit not null default 'PER_TABLE',
  deposit_policy        text not null default '',
  -- บัญชีรับเงินของร้าน (แพลตฟอร์มโอนมัดจำให้)
  payout_bank_name      text,
  payout_account_no     text,
  payout_account_name   text,
  -- PR ประจำร้าน (ร้านกรอกเอง)
  pr_male               smallint not null default 0 check (pr_male between 0 and 99),
  pr_female             smallint not null default 0 check (pr_female between 0 and 99),
  grace_period_minutes  smallint not null default 30,
  perks                 text[] not null default '{}',
  owner_id              uuid references public.users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index bars_status_idx on public.bars (status);
create index bars_district_idx on public.bars (district);
create trigger bars_updated_at before update on public.bars
  for each row execute function public.set_updated_at();

-- โปรโมชันที่ลูกค้าเลือกได้ตอนจอง (เช่น โปรเบียร์ก่อน 2 ทุ่ม)
create table public.bar_promotions (
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references public.bars (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 60),
  description   text not null default '',
  cutoff_time   time,                 -- ต้องเช็กอินก่อนเวลานี้ (null = ทั้งคืน)
  days          smallint[],           -- 0 = อาทิตย์ (null = ทุกวัน)
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index bar_promotions_bar_idx on public.bar_promotions (bar_id) where active;

create table public.bar_zones (
  id                        uuid primary key default gen_random_uuid(),
  bar_id                    uuid not null references public.bars (id) on delete cascade,
  name                      text not null,
  capacity_pax              integer not null default 0,
  default_duration_minutes  integer not null default 120,
  sort_order                smallint not null default 0
);
create table public.bar_tables (
  id        uuid primary key default gen_random_uuid(),
  zone_id   uuid not null references public.bar_zones (id) on delete cascade,
  name      text not null,
  seats     smallint not null default 4
);

-- เมนูราคา (แสดงเพื่อประเมินงบ — ไม่มีสั่งล่วงหน้า)
create table public.bar_menu_items (
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references public.bars (id) on delete cascade,
  category    text not null,
  name        text not null,
  price       integer not null check (price >= 0),
  available   boolean not null default true
);

create table public.bar_safety (
  bar_id      uuid not null references public.bars (id) on delete cascade,
  key         text not null,
  value       text not null check (value in ('YES', 'NO', 'UNKNOWN')),
  source      text not null check (source in ('SELF_DECLARED', 'ADMIN_VERIFIED')),
  verified_at timestamptz,
  primary key (bar_id, key)
);

-- พนักงานร้าน (MERCHANT/STAFF ผูกกับร้าน)
create table public.bar_staff (
  bar_id   uuid not null references public.bars (id) on delete cascade,
  user_id  uuid not null references public.users (id) on delete cascade,
  role     public.user_role not null check (role in ('MERCHANT', 'STAFF')),
  primary key (bar_id, user_id)
);

-- ช่วงเวลาที่ถือโต๊ะ — ใช้ใน exclusion constraint (index ต้องเป็น IMMUTABLE)
-- timestamptz + interval ปกติเป็น STABLE เพราะ interval แบบวัน/เดือนขึ้นกับ timezone
-- แต่บวกเป็น "นาที" ไม่ขึ้นกับ timezone จึงประกาศ IMMUTABLE ได้อย่างปลอดภัย
create or replace function public.booking_period(start_at timestamptz, minutes integer)
returns tstzrange language sql immutable parallel safe
as $$ select tstzrange(start_at, start_at + minutes * interval '1 minute', '[)') $$;

-- ---------------------------------------------------------------------
-- bookings — จองเฉพาะโต๊ะ (+ โปรโมชัน) ไม่มีรายการอาหาร/เครื่องดื่ม
-- ---------------------------------------------------------------------
create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  bar_id            uuid not null references public.bars (id),
  user_id           uuid not null references public.users (id),
  zone_id           uuid not null references public.bar_zones (id),
  table_id          uuid references public.bar_tables (id),
  booking_datetime  timestamptz not null,
  duration_minutes  integer not null default 120,
  pax               smallint not null check (pax between 1 and 50),
  status            public.booking_status not null default 'AWAITING_DEPOSIT',
  promotion_id      uuid references public.bar_promotions (id) on delete set null,
  promotion_title   text,                       -- snapshot ตอนจอง
  note              text check (char_length(note) <= 200),
  share_token       text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- โต๊ะเดียวกันซ้อนเวลากันไม่ได้ ขณะยังถือโต๊ะอยู่
  constraint bookings_no_overlap exclude using gist (
    table_id with =,
    public.booking_period(booking_datetime, duration_minutes) with &&
  ) where (table_id is not null and status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN'))
);
create index bookings_bar_dt_idx on public.bookings (bar_id, booking_datetime);
create index bookings_user_idx on public.bookings (user_id, created_at desc);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_status_history (
  id          bigint generated always as identity primary key,
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status   public.booking_status not null,
  changed_by  uuid references public.users (id),
  changed_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- deposits — ลูกค้าโอนเข้า PromptPay ของ NightOut · แอดมินตรวจสลิป · แพลตฟอร์มถือเงิน
-- แล้วโอนให้ร้าน (PAID_OUT) หรือเก็บเป็นเครดิตร้าน (CREDIT) หรือคืนลูกค้า (REFUNDED)
-- ---------------------------------------------------------------------
create table public.deposits (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references public.bookings (id) on delete cascade,
  bar_id        uuid not null references public.bars (id),
  amount        integer not null check (amount > 0),
  slip_path     text,                                    -- Storage bucket "slips"
  status        public.deposit_status not null default 'SUBMITTED',
  submitted_at  timestamptz not null default now(),
  verified_by   uuid references public.users (id),
  verified_at   timestamptz,
  settlement    public.deposit_settlement,
  settled_by    uuid references public.users (id),
  settled_at    timestamptz,
  settle_note   text
);
create index deposits_status_idx on public.deposits (status) where status = 'SUBMITTED';
create index deposits_settlement_idx on public.deposits (bar_id, settlement);

-- ตั้งค่าแพลตฟอร์ม (PromptPay ของ NightOut) — แก้ได้เฉพาะ service role
create table public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into public.platform_settings (key, value) values
  ('deposit_promptpay', '{"name": "NightOut Co., Ltd.", "promptpayId": "0812345678"}');

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.bars                   enable row level security;
alter table public.bar_promotions         enable row level security;
alter table public.bar_zones              enable row level security;
alter table public.bar_tables             enable row level security;
alter table public.bar_menu_items         enable row level security;
alter table public.bar_safety             enable row level security;
alter table public.bar_staff              enable row level security;
alter table public.bookings               enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.deposits               enable row level security;
alter table public.platform_settings      enable row level security;

create or replace function public.is_bar_staff(p_bar uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bar_staff where bar_id = p_bar and user_id = auth.uid())
$$;

-- ร้านที่อนุมัติแล้วใครก็อ่านได้ · เจ้าของร้าน/แอดมินแก้ได้
create policy bars_public_read on public.bars for select
  using (status = 'APPROVED' or public.is_bar_staff(id) or (select public.current_user_role()) = 'ADMIN');
create policy bars_owner_write on public.bars for update
  using (public.is_bar_staff(id) or (select public.current_user_role()) = 'ADMIN');

create policy bar_children_read on public.bar_promotions for select using (true);
create policy bar_children_read on public.bar_zones for select using (true);
create policy bar_children_read on public.bar_tables for select using (true);
create policy bar_children_read on public.bar_menu_items for select using (true);
create policy bar_children_read on public.bar_safety for select using (true);
create policy bar_promotions_owner on public.bar_promotions for all
  using (public.is_bar_staff(bar_id)) with check (public.is_bar_staff(bar_id));
create policy bar_menu_owner on public.bar_menu_items for all
  using (public.is_bar_staff(bar_id)) with check (public.is_bar_staff(bar_id));
create policy bar_staff_self on public.bar_staff for select
  using (user_id = (select auth.uid()) or public.is_bar_staff(bar_id));

-- การจอง: ลูกค้าเห็นของตัวเอง · ร้านเห็นของร้าน · แอดมินเห็นทั้งหมด (เขียนผ่าน NestJS/service role เท่านั้น)
create policy bookings_read on public.bookings for select
  using (user_id = (select auth.uid()) or public.is_bar_staff(bar_id) or (select public.current_user_role()) = 'ADMIN');
create policy booking_history_read on public.booking_status_history for select
  using (exists (select 1 from public.bookings b where b.id = booking_id
                 and (b.user_id = (select auth.uid()) or public.is_bar_staff(b.bar_id) or (select public.current_user_role()) = 'ADMIN')));

-- มัดจำ: ลูกค้าเห็นของตัวเอง · ร้านเห็นยอด/สถานะเงินของร้าน (ไม่เห็นสลิป) · แอดมินเห็นหมด
create policy deposits_read on public.deposits for select
  using (exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid()))
         or public.is_bar_staff(bar_id) or (select public.current_user_role()) = 'ADMIN');

create policy platform_settings_read on public.platform_settings for select using (true);

-- ---------------------------------------------------------------------
-- Storage: สลิปมัดจำ (private) — ลูกค้าอัปโหลดของตัวเอง แอดมินอ่านได้
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('slips', 'slips', false)
  on conflict (id) do nothing;
create policy slips_upload_own on storage.objects for insert
  with check (bucket_id = 'slips' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy slips_read on storage.objects for select
  using (bucket_id = 'slips' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or (select public.current_user_role()) = 'ADMIN'));
