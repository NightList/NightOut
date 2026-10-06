-- =====================================================================
-- NightOut · 0001 init
-- extensions + public.users (sync กับ auth.users) + user_consents
-- ตารางอื่น (bars, bookings, ...) เพิ่มใน migration ถัดไปตาม docs/PROMPT.md
-- =====================================================================

create extension if not exists citext with schema extensions;
create extension if not exists btree_gist with schema extensions;   -- exclusion constraint ของการจอง
create extension if not exists pg_cron;                             -- งานตั้งเวลา → /jobs/*
create extension if not exists pg_net with schema extensions;       -- เรียก HTTP จาก pg_cron

-- ---------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------
create type public.user_role as enum ('CUSTOMER', 'MERCHANT', 'STAFF', 'ADMIN');
create type public.theme_mode as enum ('LIGHT', 'DARK', 'SYSTEM');

-- ---------------------------------------------------------------------
-- users (profile ของ auth.users)
-- ---------------------------------------------------------------------
create table public.users (
  id                       uuid primary key references auth.users (id) on delete cascade,
  display_name             text not null check (char_length(display_name) between 1 and 60),
  email                    extensions.citext not null unique,
  phone                    text,
  birthdate                date not null,
  role                     public.user_role not null default 'CUSTOMER',
  age_verified             boolean not null default false,
  age_verified_at          timestamptz,
  age_verification_method  text check (age_verification_method in ('SELF_DECLARED', 'ID_CHECK_AT_VENUE', 'EKYC')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table public.user_preferences (
  user_id               uuid primary key references public.users (id) on delete cascade,
  preferred_styles      text[] not null default '{}',
  budget_per_person     integer check (budget_per_person >= 0),
  usual_pax             smallint check (usual_pax between 1 and 50),
  preferred_districts   text[] not null default '{}',
  theme                 public.theme_mode not null default 'SYSTEM',
  reduced_motion        boolean,
  updated_at            timestamptz not null default now()
);

create table public.user_consents (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.users (id) on delete cascade,
  consent_type  text not null check (consent_type in
                  ('TERMS', 'PRIVACY', 'AGE_CONFIRMATION', 'LOCATION', 'MARKETING', 'LINE_NOTIFICATION')),
  version       text not null,
  granted       boolean not null,
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz
);
create index user_consents_user_idx on public.user_consents (user_id, consent_type);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- สมัครสมาชิก: auth.users insert → public.users + preferences + consents
-- frontend ส่ง options.data = { display_name, birthdate, terms_version, privacy_version }
-- ---------------------------------------------------------------------
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  -- Age Gate: ต้องอายุ 20 ปีขึ้นไป
  if (meta ->> 'birthdate') is null
     or (meta ->> 'birthdate')::date > (current_date - interval '20 years')::date then
    raise exception 'AGE_UNDER_20' using errcode = 'check_violation';
  end if;

  insert into public.users (id, display_name, email, birthdate, age_verified, age_verified_at, age_verification_method)
  values (
    new.id,
    coalesce(nullif(meta ->> 'display_name', ''), split_part(new.email, '@', 1)),
    new.email,
    (meta ->> 'birthdate')::date,
    true, now(), 'SELF_DECLARED'
  );

  insert into public.user_preferences (user_id) values (new.id);

  insert into public.user_consents (user_id, consent_type, version, granted)
  values
    (new.id, 'TERMS',            coalesce(meta ->> 'terms_version', 'v1'),   true),
    (new.id, 'PRIVACY',          coalesce(meta ->> 'privacy_version', 'v1'), true),
    (new.id, 'AGE_CONFIRMATION', 'v1',                                        true);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- sync email เมื่อผู้ใช้เปลี่ยนอีเมล
create or replace function public.handle_auth_user_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_auth_user_email_change();

-- ---------------------------------------------------------------------
-- helper สำหรับ RLS
-- ---------------------------------------------------------------------
create or replace function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.users where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- RLS: ผู้ใช้เห็น/แก้ได้เฉพาะของตัวเอง, admin อ่านได้ทั้งหมด
-- (role เปลี่ยนได้เฉพาะผ่าน service role / NestJS)
-- ---------------------------------------------------------------------
alter table public.users            enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_consents    enable row level security;

create policy users_select_self on public.users for select
  using (id = (select auth.uid()) or (select public.current_user_role()) = 'ADMIN');
create policy users_update_self on public.users for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select public.current_user_role()));

create policy prefs_all_self on public.user_preferences for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy consents_select_self on public.user_consents for select
  using (user_id = (select auth.uid()));
create policy consents_insert_self on public.user_consents for insert
  with check (user_id = (select auth.uid()));
