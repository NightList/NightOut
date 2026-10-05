-- =====================================================================
-- NightOut · เฟส 2 / 12 — โปรโมทแบบจ่ายเงิน (ป้าย "แนะนำ · โฆษณา")
-- ร้านจ่ายเงินเพิ่มดาวไม่ได้ — ไม่มีคอลัมน์ไหนผูกโปรโมทกับคะแนน
-- =====================================================================
set search_path = public, extensions;

create table public.promotion_packages (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  placement          public.promo_placement not null,
  duration_days      smallint not null check (duration_days in (7, 14, 30)),
  price              numeric(10,2) not null check (price >= 0),
  max_slots_per_area smallint not null default 3,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger promotion_packages_updated_at before update on public.promotion_packages for each row execute function public.set_updated_at();

create table public.promoted_listings (
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references public.bars(id),
  package_id    uuid not null references public.promotion_packages(id),
  placement     public.promo_placement not null,
  district_id   uuid references public.districts(id) on delete set null,   -- null = ทั้งเมือง
  category      public.bar_category,
  price_paid    numeric(10,2) not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        public.promoted_status not null default 'PENDING_PAYMENT',
  creative      jsonb,                                   -- {headline, image_path} · ไม่มี = null
  approved_by   uuid references public.users(id) on delete set null,
  approved_at   timestamptz,
  reject_reason text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index promoted_listings_live on public.promoted_listings (placement, district_id, category, starts_at, ends_at) where status = 'ACTIVE';
create trigger promoted_listings_updated_at before update on public.promoted_listings for each row execute function public.set_updated_at();

create table public.promoted_listing_payments (
  id                  uuid primary key default gen_random_uuid(),
  promoted_listing_id uuid not null references public.promoted_listings(id) on delete cascade,
  amount              numeric(10,2) not null,
  slip_path           text not null,                     -- bucket promo-slips: <bar_id>/<file>
  slip_ref            text,
  status              public.slip_status not null default 'SUBMITTED',
  verified_by         uuid references public.users(id) on delete set null,
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger promoted_listing_payments_updated_at before update on public.promoted_listing_payments for each row execute function public.set_updated_at();

create table public.promoted_listing_stats (
  promoted_listing_id uuid not null references public.promoted_listings(id) on delete cascade,
  date                date not null,
  impressions         integer not null default 0,
  clicks              integer not null default 0,
  bookings            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (promoted_listing_id, date)
);
create trigger promoted_listing_stats_updated_at before update on public.promoted_listing_stats for each row execute function public.set_updated_at();

-- แทน stub ในเฟส 1 — ใช้ใน bar_cards.is_promoted
create or replace function public.bar_is_promoted(p_bar uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.promoted_listings p
                 where p.bar_id = p_bar and p.status = 'ACTIVE' and now() >= p.starts_at and now() < p.ends_at)
$$;

create policy promotion_packages_read on public.promotion_packages for select using (active);
create policy promoted_listings_read  on public.promoted_listings  for select using (status = 'ACTIVE' or public.is_bar_member(bar_id));
create policy promoted_listing_payments_read_team on public.promoted_listing_payments for select using (
  exists (select 1 from public.promoted_listings p where p.id = promoted_listing_id and public.is_bar_member(p.bar_id)));
create policy promoted_listing_stats_read_team on public.promoted_listing_stats for select using (
  exists (select 1 from public.promoted_listings p where p.id = promoted_listing_id and public.is_bar_member(p.bar_id)));
