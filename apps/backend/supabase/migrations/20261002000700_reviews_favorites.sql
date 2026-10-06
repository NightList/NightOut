-- =====================================================================
-- NightOut · เฟส 1 / 7 — รีวิว (4 ตาราง) · ร้านโปรด
-- รีวิวได้เฉพาะการจองที่เช็กอินแล้ว · 1 การจอง = 1 รีวิว
-- =====================================================================
set search_path = public, extensions;

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique,
  user_id    uuid not null references public.users(id),
  bar_id     uuid not null references public.bars(id),
  rating     smallint not null check (rating between 1 and 5),
  comment    text check (comment is null or char_length(comment) between 10 and 500),
  status     public.review_status not null default 'PUBLISHED',
  has_media  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- bar_id ต้องตรงกับร้านของการจองที่รีวิว
  constraint reviews_booking_same_bar foreign key (booking_id, bar_id) references public.bookings (id, bar_id)
);
create index reviews_bar on public.reviews (bar_id, created_at desc) where status = 'PUBLISHED';
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();

create or replace function public.check_review_booking() returns trigger
language plpgsql set search_path = '' as $$
declare
  b record;
begin
  select status, user_id into b from public.bookings where id = new.booking_id;
  if b.status is null or b.status not in ('CHECKED_IN','COMPLETED') then
    raise exception 'REVIEW_REQUIRES_CHECKIN' using errcode = 'check_violation';
  end if;
  if b.user_id <> new.user_id then
    raise exception 'REVIEW_NOT_OWNER' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger reviews_check_booking before insert on public.reviews for each row execute function public.check_review_booking();

create table public.review_media (                       -- สูงสุด 6 ไฟล์ · วิดีโอ ≤ 60 วิ / 60MB
  id           uuid primary key default gen_random_uuid(),
  review_id    uuid not null references public.reviews(id) on delete cascade,
  kind         public.media_kind not null,
  storage_path text not null,                            -- bucket review-media: <user_id>/<review_id>/<file>
  thumb_path   text,
  width        integer,
  height       integer,
  duration_sec smallint check (duration_sec is null or duration_sec <= 60),
  size_bytes   integer check (size_bytes <= 62914560),
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger review_media_updated_at before update on public.review_media for each row execute function public.set_updated_at();

create or replace function public.limit_review_media() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.review_media where review_id = new.review_id) >= 6 then
    raise exception 'REVIEW_MEDIA_LIMIT' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger review_media_limit before insert on public.review_media for each row execute function public.limit_review_media();

create table public.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reason      text not null check (reason in ('SPAM','OFFENSIVE','FAKE','PRIVACY','OTHER')),
  detail      text,
  status      public.report_status not null default 'OPEN',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (review_id, reporter_id)
);
create trigger review_reports_updated_at before update on public.review_reports for each row execute function public.set_updated_at();

create table public.review_moderation_logs (             -- log
  id          bigint generated always as identity primary key,
  review_id   uuid not null references public.reviews(id) on delete cascade,
  admin_id    uuid not null references public.users(id),
  action      text not null check (action in ('HIDE','RESTORE','REMOVE','DISMISS_REPORTS')),
  from_status public.review_status,
  to_status   public.review_status,
  reason      text,
  created_at  timestamptz not null default now()
);

create table public.favorites (
  user_id    uuid not null references public.users(id) on delete cascade,
  bar_id     uuid not null references public.bars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bar_id)
);

-- ชื่อที่แสดงของผู้รีวิว — public_reviews ใช้ (ตาราง users อ่านได้เฉพาะแถวตัวเอง)
-- คืนชื่อเฉพาะผู้ใช้ที่มีรีวิว PUBLISHED เท่านั้น
create or replace function public.review_author_name(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select u.display_name from public.users u
  where u.id = p_user and u.deleted_at is null
    and exists (select 1 from public.reviews r where r.user_id = u.id and r.status = 'PUBLISHED')
$$;
