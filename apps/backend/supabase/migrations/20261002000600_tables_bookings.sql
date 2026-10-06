-- =====================================================================
-- NightOut · เฟส 1 / 6 — โซน/โต๊ะ · การจอง · snapshot · ประวัติสถานะ · QR · เช็กอิน
-- การเขียนทั้งหมดผ่าน NestJS (service role) · หน้าบ้านอ่านผ่าน view my_bookings / booking_detail
-- =====================================================================
set search_path = public, extensions;

create table public.table_zones (
  id                       uuid primary key default gen_random_uuid(),
  bar_id                   uuid not null references public.bars(id) on delete cascade,
  name                     text not null,                -- 'ทั้งร้าน', 'Rooftop', 'หน้าเวที'
  capacity_pax             smallint not null check (capacity_pax > 0),
  default_duration_minutes smallint not null default 180 check (default_duration_minutes between 30 and 720),
  allow_zone_only_booking  boolean not null default true,
  sort_order               integer not null default 0,
  active                   boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (id, bar_id)                                    -- ให้ bookings (zone_id, bar_id) อ้างถึง
);
create trigger table_zones_updated_at before update on public.table_zones for each row execute function public.set_updated_at();

create table public.tables (
  id         uuid primary key default gen_random_uuid(),
  zone_id    uuid not null references public.table_zones(id) on delete cascade,
  name       text not null,
  seats      smallint not null check (seats > 0),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, name),
  unique (id, zone_id)                                   -- ให้ bookings (table_id, zone_id) อ้างถึง
);
create trigger tables_updated_at before update on public.tables for each row execute function public.set_updated_at();

create table public.bookings (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,          -- 'NL-7K3QX2' ใช้ค้นตอน Manual check-in
  user_id                 uuid not null references public.users(id),
  bar_id                  uuid not null references public.bars(id),
  zone_id                 uuid not null,
  table_id                uuid,
  booking_datetime        timestamptz not null,          -- เวลานัดเข้าร้าน
  reserved_from           timestamptz not null,
  reserved_until          timestamptz not null,
  reserved_period         tstzrange generated always as (tstzrange(reserved_from, reserved_until, '[)')) stored,
  pax                     smallint not null check (pax between 1 and 50),
  status                  public.booking_status not null default 'PENDING',
  customer_note           text check (char_length(customer_note) <= 200),
  contact_phone           text check (contact_phone ~ '^\+[1-9][0-9]{7,14}$'),  -- E.164 · ร้านเห็นผ่าน NestJS เฉพาะ CONFIRMED · ลบตาม retention
  request_pr              public.pr_gender,              -- ขอ PR เพศไหน · ไม่ขอ = null
  deposit_required        numeric(10,2) not null default 0,  -- snapshot จาก bar_booking_settings
  deposit_policy_snapshot text,
  grace_minutes           smallint not null,             -- snapshot
  auto_cancel_at          timestamptz not null,          -- booking_datetime + grace_minutes
  expires_at              timestamptz,                   -- เส้นตายของ PENDING / AWAITING_DEPOSIT
  confirmed_at            timestamptz,
  checked_in_at           timestamptz,
  completed_at            timestamptz,
  cancelled_at            timestamptz,
  cancel_reason           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (reserved_until > reserved_from),
  check (auto_cancel_at >= booking_datetime),
  unique (id, bar_id),                                   -- ให้ reviews (booking_id, bar_id) อ้างถึง
  constraint bookings_zone_belongs_to_bar  foreign key (zone_id, bar_id)   references public.table_zones (id, bar_id),
  constraint bookings_table_belongs_to_zone foreign key (table_id, zone_id) references public.tables (id, zone_id),
  -- โต๊ะเดียวกันจองซ้อนเวลาไม่ได้ ขณะยังถือโต๊ะ
  constraint bookings_no_table_overlap exclude using gist (table_id with =, reserved_period with &&)
    where (table_id is not null and status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN'))
);
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create index bookings_user          on public.bookings (user_id, booking_datetime desc);
create index bookings_bar_night     on public.bookings (bar_id, booking_datetime);
create index bookings_zone_active   on public.bookings using gist (zone_id, reserved_period)
  where status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN');
create index bookings_due_noshow    on public.bookings (auto_cancel_at) where status = 'CONFIRMED';
create index bookings_due_expire    on public.bookings (expires_at)     where status in ('PENDING','AWAITING_DEPOSIT');
create index bookings_due_complete  on public.bookings (reserved_until) where status = 'CHECKED_IN';

alter table public.notifications add constraint notifications_booking_fk foreign key (booking_id) references public.bookings(id) on delete set null;

-- ประวัติสถานะ (log)
create table public.booking_status_history (
  id          bigint generated always as identity primary key,
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  from_status public.booking_status,
  to_status   public.booking_status not null,
  changed_by  uuid references public.users(id) on delete set null,   -- null = ระบบ (job)
  reason      text,
  created_at  timestamptz not null default now()
);
create index booking_status_history_booking on public.booking_status_history (booking_id, created_at);

-- ตารางเปลี่ยนสถานะ — ต้องตรงกับ BOOKING_TRANSITIONS ใน packages/types/src/database.ts
create or replace function public.booking_transition_allowed(f public.booking_status, t public.booking_status) returns boolean
language sql immutable set search_path = '' as $$
  select case f
    when 'PENDING'           then t in ('AWAITING_DEPOSIT','CONFIRMED','REJECTED','CANCELLED_BY_CUSTOMER','EXPIRED')
    when 'AWAITING_DEPOSIT'  then t in ('DEPOSIT_SUBMITTED','CANCELLED_BY_CUSTOMER','EXPIRED')
    when 'DEPOSIT_SUBMITTED' then t in ('CONFIRMED','AWAITING_DEPOSIT','REJECTED','CANCELLED_BY_CUSTOMER')
    when 'CONFIRMED'         then t in ('CHECKED_IN','NO_SHOW','CANCELLED_BY_CUSTOMER','CANCELLED_BY_MERCHANT')
    when 'CHECKED_IN'        then t in ('COMPLETED')
    else false end
$$;

-- บังคับ transition + เขียนประวัติ (NestJS ตั้ง `set local app.user_id` / `app.reason` ใน transaction)
create or replace function public.enforce_booking_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, reason)
    values (new.id, null, new.status, nullif(current_setting('app.user_id', true), '')::uuid, 'created');
    return new;
  end if;
  if new.status is distinct from old.status then
    if not public.booking_transition_allowed(old.status, new.status) then
      raise exception 'INVALID_BOOKING_TRANSITION % -> %', old.status, new.status using errcode = 'P0001';
    end if;
    case new.status
      when 'CONFIRMED'  then new.confirmed_at  := coalesce(new.confirmed_at, now());
      when 'CHECKED_IN' then new.checked_in_at := coalesce(new.checked_in_at, now());
      when 'COMPLETED'  then new.completed_at  := coalesce(new.completed_at, now());
      when 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MERCHANT' then new.cancelled_at := coalesce(new.cancelled_at, now());
      else null;
    end case;
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, reason)
    values (new.id, old.status, new.status,
            nullif(current_setting('app.user_id', true), '')::uuid,
            nullif(current_setting('app.reason', true), ''));
  end if;
  return new;
end $$;
create trigger bookings_status_insert after insert on public.bookings for each row execute function public.enforce_booking_status();
create trigger bookings_status_update before update of status on public.bookings for each row execute function public.enforce_booking_status();

-- ความจุโซนที่เหลือ (นับทั้งการจองที่ระบุโต๊ะและไม่ระบุโต๊ะ) — เรียกใน transaction เดียวกับ INSERT booking
-- ล็อกแถวโซนก่อน เพื่อให้ request ที่มาพร้อมกันต่อคิว
create or replace function public.zone_remaining_pax(p_zone uuid, p_from timestamptz, p_until timestamptz, p_exclude uuid default null)
returns integer language plpgsql set search_path = '' as $$
declare
  cap  integer;
  used integer;
begin
  select capacity_pax into cap from public.table_zones where id = p_zone and active for update;
  if cap is null then
    raise exception 'ZONE_NOT_FOUND' using errcode = 'P0002';
  end if;
  -- จุดที่คนหนาแน่นที่สุดในช่วงเวลานั้น (ดูที่เวลาเริ่มของแต่ละการจองที่ทับช่วง)
  select coalesce(max(s.pax_sum), 0) into used from (
    select sum(b2.pax) as pax_sum
    from public.bookings b1
    join public.bookings b2
      on b2.zone_id = p_zone
     and b2.reserved_period @> greatest(lower(b1.reserved_period), p_from)
     and b2.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')
     and b2.id is distinct from p_exclude
    where b1.zone_id = p_zone
      and b1.reserved_period && tstzrange(p_from, p_until, '[)')
      and b1.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')
      and b1.id is distinct from p_exclude
    group by b1.id) s;
  return cap - used;
end $$;

-- snapshot ณ ตอนจอง
create table public.booking_price_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null unique references public.bookings(id) on delete cascade,
  items               jsonb not null default '[]',       -- [{menu_item_id, name, qty, unit_price}]
  subtotal            numeric(12,2) not null,
  service_charge_rate numeric(5,2) not null default 0,
  vat_rate            numeric(5,2) not null default 0,
  other_fees          jsonb not null default '[]',       -- [{label, calc, value, amount}]
  estimated_total     numeric(12,2) not null,
  per_person          numeric(12,2) not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger booking_price_snapshots_updated_at before update on public.booking_price_snapshots for each row execute function public.set_updated_at();

create table public.booking_package_snapshots (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references public.bookings(id) on delete cascade,
  package_id    uuid references public.price_packages(id) on delete set null,
  package_name  text not null,
  items         jsonb not null default '[]',
  package_price numeric(12,2) not null,
  fees          jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger booking_package_snapshots_updated_at before update on public.booking_package_snapshots for each row execute function public.set_updated_at();

create table public.booking_promotions (                 -- โปรที่เลือก 1 อย่างต่อการจอง (snapshot)
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null unique references public.bookings(id) on delete cascade,
  promotion_id   uuid references public.bar_promotions(id) on delete set null,
  title_snapshot text not null,
  perk_snapshot  jsonb not null,
  redeemed_at    timestamptz,                            -- ร้านกดใช้สิทธิ์ตอนเช็กอิน
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger booking_promotions_updated_at before update on public.booking_promotions for each row execute function public.set_updated_at();

create table public.booking_qr_tokens (                  -- id = jti ของ signed JWT ใน QR (ใช้ครั้งเดียว)
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger booking_qr_tokens_updated_at before update on public.booking_qr_tokens for each row execute function public.set_updated_at();

create table public.checkins (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references public.bookings(id),
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid not null references public.users(id),
  method        public.checkin_method not null,
  qr_token_id   uuid references public.booking_qr_tokens(id),
  id_checked    boolean not null default false,          -- Staff ดูบัตรแล้ว
  actual_pax    smallint,
  actual_spend  numeric(12,2) check (actual_spend >= 0),   -- ยอดจริง (ใช้คิดค่าคอมในอนาคต)
  table_id      uuid references public.tables(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (method <> 'QR' or qr_token_id is not null)
);
create trigger checkins_updated_at before update on public.checkins for each row execute function public.set_updated_at();

-- เฟส 2 (deposits) จะแทนที่ฟังก์ชันนี้ — booking_detail เรียกใช้
create or replace function public.booking_deposit_summary(p_booking uuid) returns jsonb
language sql stable set search_path = '' as $$ select null::jsonb $$;
