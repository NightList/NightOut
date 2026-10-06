-- =====================================================================
-- NightOut · เฟส 1 / 2 — ผู้ใช้ · consent · แจ้งเตือน · audit
-- ตัวตนผู้ใช้ = auth.users.id (ไม่ใช้เบอร์โทรเป็น key)
-- =====================================================================
set search_path = public, extensions;

create table public.users (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    citext not null unique,
  display_name             text not null check (char_length(display_name) between 1 and 60),
  phone_e164               text check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),  -- ยังไม่บังคับ ใช้เมื่อเปิด OTP
  phone_verified_at        timestamptz,
  avatar_url               text,
  birthdate                date not null,
  role                     public.user_role not null default 'CUSTOMER',
  age_verified             boolean not null default false,
  age_verified_at          timestamptz,
  age_verification_method  public.age_verification_method,
  onboarded_at             timestamptz,
  deleted_at               timestamptz,               -- ลบบัญชี (PDPA) → job anonymize เมื่อเลย retention
  anonymized_at            timestamptz,               -- job anonymize แล้ว (ข้อมูลส่วนตัวถูกล้าง)
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create unique index users_phone_e164_unique on public.users (phone_e164) where phone_e164 is not null;
create trigger users_updated_at before update on public.users for each row execute function public.set_updated_at();

-- อายุ 20+ (หน้าบ้านต้องเช็กก่อน signUp เพราะ error จาก trigger ใน auth จะเหลือแค่ "Database error saving new user")
create or replace function public.check_user_age() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.birthdate > (current_date - interval '20 years')::date then
    raise exception 'AGE_UNDER_20' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger users_check_age before insert or update of birthdate on public.users
  for each row execute function public.check_user_age();

create table public.legal_documents (
  id           uuid primary key default gen_random_uuid(),
  doc_type     public.consent_type not null,
  version      text not null,
  content_url  text not null,
  published_at timestamptz not null default now(),
  is_current   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (doc_type, version)
);
create unique index legal_documents_one_current on public.legal_documents (doc_type) where is_current;
create trigger legal_documents_updated_at before update on public.legal_documents for each row execute function public.set_updated_at();

create table public.user_consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  consent_type public.consent_type not null,
  version      text not null,
  granted      boolean not null,
  granted_at   timestamptz not null default now(),
  revoked_at   timestamptz,
  ip_hash      text,                                   -- hash เท่านั้น ไม่เก็บ IP ดิบ
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index user_consents_user on public.user_consents (user_id, consent_type, granted_at desc);
create trigger user_consents_updated_at before update on public.user_consents for each row execute function public.set_updated_at();

-- 1:1 กับ users (PK = user_id)
create table public.user_preferences (
  user_id                uuid primary key references public.users(id) on delete cascade,
  preferred_style_ids    uuid[] not null default '{}',
  preferred_district_ids uuid[] not null default '{}',
  budget_per_person      numeric(10,2),
  usual_pax              smallint check (usual_pax between 1 and 50),
  theme                  public.theme_mode not null default 'SYSTEM',
  reduced_motion         boolean,                      -- null = ตามระบบ
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger user_preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- แจ้งเตือน (outbox)
-- ---------------------------------------------------------------------
create table public.notification_channels (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  channel           public.notification_channel not null,
  line_user_id      text,
  push_subscription jsonb,                             -- {endpoint, keys:{p256dh, auth}} · ไม่มี = null
  device_label      text,
  opted_in_at       timestamptz,
  opted_out_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint notification_channels_line_needs_id  check (channel <> 'LINE'     or line_user_id is not null),
  constraint notification_channels_push_needs_sub check (channel <> 'WEB_PUSH' or push_subscription is not null)
);
create unique index notification_channels_line_unique  on public.notification_channels (user_id) where channel = 'LINE';
create unique index notification_channels_inapp_unique on public.notification_channels (user_id) where channel = 'IN_APP';
create trigger notification_channels_updated_at before update on public.notification_channels for each row execute function public.set_updated_at();

create table public.notifications (                     -- 1 แถวต่อผู้รับต่อเหตุการณ์ (= กระดิ่งในเว็บ)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  event_type  text not null,                            -- BOOKING_CREATED, BOOKING_CONFIRMED, DEPOSIT_VERIFIED, AUTO_CANCEL_WARNING …
  booking_id  uuid,                                     -- FK เพิ่มในไฟล์การจอง
  bar_id      uuid,                                     -- FK เพิ่มในไฟล์ร้าน
  title       text not null,
  body        text not null,
  payload     jsonb not null default '{}',              -- ข้อมูลประกอบของเหตุการณ์ (ไม่ใช่ object ที่ส่งให้หน้าบ้านตรง)
  read_at     timestamptz,
  dedupe_key  text unique,                              -- กันส่งซ้ำ เช่น 'AUTO_CANCEL_WARNING:<booking_id>'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index notifications_inbox  on public.notifications (user_id, created_at desc);
create index notifications_unread on public.notifications (user_id) where read_at is null;
create trigger notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();

create table public.notification_deliveries (           -- 1 แถวต่อช่องทาง
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel         public.notification_channel not null,
  status          public.delivery_status not null default 'QUEUED',
  attempt_count   smallint not null default 0 check (attempt_count between 0 and 5),
  last_error      text,
  next_retry_at   timestamptz not null default now(),
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (notification_id, channel)
);
create index notification_deliveries_due on public.notification_deliveries (next_retry_at) where status in ('QUEUED','RETRYING');
create trigger notification_deliveries_updated_at before update on public.notification_deliveries for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- log (bigint identity — ไม่มี updated_at)
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.users(id) on delete set null,
  actor_role  public.user_role,
  action      text not null,                            -- 'bar.approve', 'deposit.verify', 'booking.status' …
  entity_type text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor  on public.audit_logs (actor_id, created_at desc);

create table public.job_runs (
  id          bigint generated always as identity primary key,
  job         text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  processed   integer not null default 0,
  error       text
);

-- ---------------------------------------------------------------------
-- สมัครสมาชิก: auth.users → public.users + preferences + consents + IN_APP
-- role = CUSTOMER เสมอ (ห้ามอ่าน role จาก raw_user_meta_data)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if (m->>'birthdate') is null then
    raise exception 'AGE_UNDER_20' using errcode = 'check_violation';
  end if;

  insert into public.users (id, email, display_name, birthdate, role, age_verified, age_verified_at, age_verification_method)
  values (new.id, new.email,
          coalesce(nullif(m->>'display_name', ''), split_part(new.email, '@', 1)),
          (m->>'birthdate')::date,
          'CUSTOMER', true, now(), 'SELF_DECLARED');

  insert into public.user_preferences (user_id) values (new.id);

  insert into public.user_consents (user_id, consent_type, version, granted) values
    (new.id, 'TERMS',            coalesce(m->>'terms_version', 'v1'),   true),
    (new.id, 'PRIVACY',          coalesce(m->>'privacy_version', 'v1'), true),
    (new.id, 'AGE_CONFIRMATION', 'v1',                                  true);

  insert into public.notification_channels (user_id, channel, opted_in_at) values (new.id, 'IN_APP', now());
  return new;
end $$;

create or replace function public.handle_auth_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_auth_email_change();

-- role ของผู้ใช้ปัจจุบัน (ใช้ใน RLS — อ่านจากตาราง ไม่ใช่ user_metadata)
create or replace function public.auth_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.users where id = auth.uid()
$$;
