-- =====================================================================
-- NightOut · เฟส 1 / 3 — master data (ตาราง) · ข้อมูลตั้งต้นอยู่ใน supabase/seed.sql
-- =====================================================================
set search_path = public, extensions;

create table public.districts (                          -- ย่าน/อำเภอ รองรับขยายทั่วประเทศ
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,                    -- 'thonglor', 'ari'
  name_th     text not null,
  province_th text not null default 'กรุงเทพมหานคร',
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger districts_updated_at before update on public.districts for each row execute function public.set_updated_at();

create table public.styles (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,                       -- LIVE_MUSIC, CHILL, PUB_DANCE …
  name_th    text not null,                              -- ชื่อที่แสดง
  icon       text not null,                              -- ชื่อไอคอน Phosphor
  sort_order integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger styles_updated_at before update on public.styles for each row execute function public.set_updated_at();

create table public.safety_features (                    -- checklist ความปลอดภัย · weight รวม = 100
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,                      -- SECURITY, CCTV, FIRE_EXIT …
  name_th     text not null,
  icon        text not null,
  weight      smallint not null default 10 check (weight between 0 and 100),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger safety_features_updated_at before update on public.safety_features for each row execute function public.set_updated_at();

create table public.platform_settings (                  -- ค่าระดับระบบ
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,                       -- deposit_promptpay, promotion_promptpay, slip_retention_days, account_retention_days, min_safety_score_for_promo
  value      jsonb not null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger platform_settings_updated_at before update on public.platform_settings for each row execute function public.set_updated_at();
