-- =====================================================================
-- NightOut · เฟส 1 / 4 — ร้าน + ตาราง 1:1 (ตั้งค่าการจอง / สถิติ / สถานะสด) + PR + ตารางลูก
-- หน้าบ้านไม่ต้องรู้ว่าตารางถูกแยก — อ่านผ่าน view bar_cards / bar_detail
-- =====================================================================
set search_path = public, extensions;

create table public.bars (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references public.users(id) on delete set null,  -- null = ร้านที่ทีมสร้างให้ ยังไม่มีเจ้าของมารับ
  slug            citext not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name            text not null check (char_length(name) between 1 and 80),
  category        public.bar_category not null,
  description     text,
  address         text not null,
  district_id     uuid references public.districts(id) on delete set null,
  lat             numeric(9,6) not null check (lat between -90 and 90),
  lng             numeric(9,6) not null check (lng between -180 and 180),
  location        extensions.geography(Point, 4326)
                    generated always as (extensions.st_setsrid(extensions.st_makepoint(lng::float8, lat::float8), 4326)::extensions.geography) stored,
  phone           text,
  cover_image_url text,
  cover_style     text,                                  -- CSS gradient สำรองเมื่อไม่มีรูปปก
  perks           text[] not null default '{}',          -- สิทธิ์เมื่อจองผ่าน NightOut
  status          public.bar_status not null default 'DRAFT',
  status_reason   text,
  approved_at     timestamptz,
  trial_ends_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger bars_updated_at before update on public.bars for each row execute function public.set_updated_at();
create index bars_public    on public.bars (status, category, district_id) where status = 'APPROVED';
create index bars_location  on public.bars using gist (location);
create index bars_name_trgm on public.bars using gin (name extensions.gin_trgm_ops);

-- ตั้งค่าการจอง (1:1)
create table public.bar_booking_settings (
  bar_id                   uuid primary key references public.bars(id) on delete cascade,
  deposit_amount           numeric(10,2) not null default 0 check (deposit_amount >= 0),
  deposit_unit             public.deposit_unit not null default 'PER_TABLE',
  deposit_policy           text,
  refund_before_hours      smallint not null default 24 check (refund_before_hours between 0 and 168),
  grace_minutes            smallint not null default 30 check (grace_minutes in (15,30,45,60,90)),
  pending_timeout_minutes  smallint not null default 30 check (pending_timeout_minutes > 0),
  deposit_timeout_minutes  smallint not null default 30 check (deposit_timeout_minutes > 0),
  max_pax_per_booking      smallint not null default 20 check (max_pax_per_booking between 1 and 50),
  min_advance_minutes      smallint not null default 60 check (min_advance_minutes >= 0),
  max_advance_days         smallint not null default 30 check (max_advance_days between 1 and 365),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger bar_booking_settings_updated_at before update on public.bar_booking_settings for each row execute function public.set_updated_at();

-- สถิติ / ค่าที่ job คำนวณ (1:1) — ตัวนับเริ่ม 0 · ค่าเฉลี่ย/ดาว เริ่ม null
create table public.bar_stats (
  bar_id               uuid primary key references public.bars(id) on delete cascade,
  avg_price_per_person numeric(10,2),
  safety_score         smallint check (safety_score between 0 and 100),
  score                numeric(5,2) check (score between 0 and 100),   -- คะแนนรวมล่าสุด (จาก tier_scores)
  current_stars        smallint check (current_stars between 1 and 5),
  current_tier         public.tier_letter,
  is_new               boolean not null default true,                 -- รีวิวจากเช็กอินจริง < 5
  rating_avg           numeric(3,2) check (rating_avg between 1 and 5),
  rating_count         integer not null default 0 check (rating_count >= 0),
  checkin_count        integer not null default 0 check (checkin_count >= 0),
  is_editor_pick       boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (is_new = (current_stars is null)),
  check (current_tier is null or current_tier = case when current_stars = 5 then 'S'::public.tier_letter
                                                   when current_stars = 4 then 'A'::public.tier_letter
                                                   when current_stars = 3 then 'B'::public.tier_letter
                                                   else 'C'::public.tier_letter end)
);
create index bar_stats_score on public.bar_stats (score desc nulls last);
create trigger bar_stats_updated_at before update on public.bar_stats for each row execute function public.set_updated_at();

-- สถานะสด (1:1) — ตารางเดียวที่เปิด Realtime · ยังไม่เคยอัปเดต = null
create table public.bar_live_status (
  bar_id           uuid primary key references public.bars(id) on delete cascade,
  current_crowd    public.crowd_status,
  crowd_updated_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger bar_live_status_updated_at before update on public.bar_live_status for each row execute function public.set_updated_at();

-- PR ประจำร้าน · ไม่มีแถว = ไม่มี PR
create table public.bar_pr_counts (
  bar_id     uuid not null references public.bars(id) on delete cascade,
  gender     public.pr_gender not null,
  pr_count   integer not null check (pr_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bar_id, gender)
);
create index bar_pr_counts_gender on public.bar_pr_counts (gender, bar_id);
create trigger bar_pr_counts_updated_at before update on public.bar_pr_counts for each row execute function public.set_updated_at();

-- ทีมร้าน — สิทธิ์ระดับร้านอิงตารางนี้เท่านั้น (ไม่ใช้ users.role)
create table public.bar_staff (
  bar_id      uuid not null references public.bars(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        public.bar_staff_role not null default 'STAFF',
  invited_by  uuid references public.users(id) on delete set null,
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (bar_id, user_id)
);
create index bar_staff_user on public.bar_staff (user_id) where revoked_at is null;
create trigger bar_staff_updated_at before update on public.bar_staff for each row execute function public.set_updated_at();

-- สร้างร้าน → สร้างแถว 1:1 ทั้ง 3 ตาราง + เจ้าของเข้า bar_staff (OWNER)
create or replace function public.handle_new_bar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.bar_booking_settings (bar_id) values (new.id) on conflict do nothing;
  insert into public.bar_stats (bar_id)            values (new.id) on conflict do nothing;
  insert into public.bar_live_status (bar_id)      values (new.id) on conflict do nothing;
  if new.owner_id is not null then
    insert into public.bar_staff (bar_id, user_id, role, accepted_at)
    values (new.id, new.owner_id, 'OWNER', now())
    on conflict (bar_id, user_id) do update set role = 'OWNER', revoked_at = null, accepted_at = coalesce(public.bar_staff.accepted_at, now());
  end if;
  return new;
end $$;
create trigger bars_after_insert after insert on public.bars for each row execute function public.handle_new_bar();

create or replace function public.handle_bar_owner_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null then
    insert into public.bar_staff (bar_id, user_id, role, accepted_at)
    values (new.id, new.owner_id, 'OWNER', now())
    on conflict (bar_id, user_id) do update set role = 'OWNER', revoked_at = null, accepted_at = coalesce(public.bar_staff.accepted_at, now());
  end if;
  return new;
end $$;
create trigger bars_owner_changed after update of owner_id on public.bars
  for each row when (new.owner_id is distinct from old.owner_id) execute function public.handle_bar_owner_change();

create table public.bar_hours (                          -- ตารางเวลาประจำสัปดาห์
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references public.bars(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),   -- 0 = อาทิตย์
  open_time   time,
  close_time  time,                                      -- <= open_time = ปิดข้ามเที่ยงคืน
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (bar_id, day_of_week),
  check (is_closed or (open_time is not null and close_time is not null))
);
create trigger bar_hours_updated_at before update on public.bar_hours for each row execute function public.set_updated_at();

create table public.bar_special_hours (                  -- วันหยุด/วันพิเศษ ทับตารางปกติ
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references public.bars(id) on delete cascade,
  date        date not null,
  open_time   time,
  close_time  time,
  is_closed   boolean not null default false,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (bar_id, date)
);
create trigger bar_special_hours_updated_at before update on public.bar_special_hours for each row execute function public.set_updated_at();

create table public.bar_styles (
  bar_id     uuid not null references public.bars(id) on delete cascade,
  style_id   uuid not null references public.styles(id),
  created_at timestamptz not null default now(),
  primary key (bar_id, style_id)
);

create table public.bar_media (
  id           uuid primary key default gen_random_uuid(),
  bar_id       uuid not null references public.bars(id) on delete cascade,
  kind         public.media_kind not null default 'IMAGE',
  storage_path text not null,                            -- bucket bar-media: <bar_id>/<file>
  width        integer,
  height       integer,
  duration_sec integer,
  caption      text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger bar_media_updated_at before update on public.bar_media for each row execute function public.set_updated_at();

create table public.bar_links (
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid not null references public.bars(id) on delete cascade,
  type       public.link_type not null,
  url        text not null check (url ~ '^https://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bar_links_domain check (
    (type = 'INSTAGRAM' and url ~* '^https://(www\.)?instagram\.com/') or
    (type = 'TIKTOK'    and url ~* '^https://(www\.|vt\.)?tiktok\.com/') or
    (type = 'FACEBOOK'  and url ~* '^https://(www\.|m\.)?(facebook\.com|fb\.me)/') or
    (type = 'LINE_OA'   and url ~* '^https://(lin\.ee|line\.me|page\.line\.me)/') or
    (type in ('WEBSITE','REVIEW_CLIP')))
);
create trigger bar_links_updated_at before update on public.bar_links for each row execute function public.set_updated_at();

create table public.bar_verifications (                  -- เอกสารยืนยันร้าน (bucket private bar-verifications)
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references public.bars(id) on delete cascade,
  document_type text not null,                           -- BUSINESS_LICENSE, ID_CARD_OWNER, VENUE_PHOTO …
  storage_path  text not null,
  status        public.moderation_status not null default 'PENDING',
  reviewed_by   uuid references public.users(id) on delete set null,
  reviewed_at   timestamptz,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger bar_verifications_updated_at before update on public.bar_verifications for each row execute function public.set_updated_at();

-- บัญชีรับเงินจาก NightOut · เลขบัญชีเข้ารหัสฝั่ง NestJS (AES-256-GCM, key จาก env/KMS) ก่อนบันทึก
-- (ข้อ 6.6 — ถ้าเปลี่ยนไปใช้ Supabase Vault ให้แก้ตรงนี้) · หน้าบ้านเห็นแค่ 4 ตัวท้าย
create table public.bar_payout_accounts (
  id               uuid primary key default gen_random_uuid(),
  bar_id           uuid not null references public.bars(id) on delete cascade,
  bank_code        text not null,                        -- KBANK, SCB, BBL … หรือ PROMPTPAY
  account_name     text not null,
  account_no_enc   bytea not null,
  account_no_last4 char(4) not null,
  is_default       boolean not null default true,
  verified_by      uuid references public.users(id) on delete set null,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index bar_payout_accounts_default on public.bar_payout_accounts (bar_id) where is_default;
create trigger bar_payout_accounts_updated_at before update on public.bar_payout_accounts for each row execute function public.set_updated_at();

create table public.bar_safety_features (
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references public.bars(id) on delete cascade,
  feature_key   text not null references public.safety_features(key) on update cascade,
  value         public.safety_value not null default 'UNKNOWN',
  source        public.safety_source not null default 'SELF_DECLARED',
  evidence_path text,
  note          text,
  verified_by   uuid references public.users(id) on delete set null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (bar_id, feature_key),
  check (source <> 'ADMIN_VERIFIED' or verified_at is not null)
);
create trigger bar_safety_features_updated_at before update on public.bar_safety_features for each row execute function public.set_updated_at();

alter table public.notifications add constraint notifications_bar_fk foreign key (bar_id) references public.bars(id) on delete set null;

-- ---------------------------------------------------------------------
-- helper ของ RLS / storage (search_path ว่าง → อ้าง schema เต็มทุกตัว)
-- ---------------------------------------------------------------------
create or replace function public.is_bar_member(p_bar uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bar_staff
    where bar_id = p_bar and user_id = auth.uid() and accepted_at is not null and revoked_at is null)
$$;

-- path ใน storage เป็น text — แปลงเป็น uuid อย่างปลอดภัย
create or replace function public.is_bar_member_path(p_folder text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return public.is_bar_member(p_folder::uuid);
exception when invalid_text_representation then
  return false;
end $$;

create or replace function public.bar_is_public(p_bar uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bars where id = p_bar and status = 'APPROVED')
$$;

-- เฟส 2 (promoted_listings) จะแทนที่ฟังก์ชันนี้
create or replace function public.bar_is_promoted(p_bar uuid) returns boolean
language sql stable set search_path = '' as $$ select false $$;
