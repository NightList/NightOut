-- =====================================================================
-- NightOut · 0003 รีวิวแนบรูป/วิดีโอ
-- ไฟล์อยู่ Storage bucket `review-media/<user_id>/<review_id>/<file>` (public read — รีวิวเป็นข้อมูลสาธารณะ)
-- จำกัด: สูงสุด 6 ไฟล์/รีวิว · รูป ≤ 15MB · วิดีโอ ≤ 60MB และ ≤ 60 วินาที (ตรวจซ้ำใน NestJS)
-- =====================================================================

create type public.review_media_type as enum ('image', 'video');

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references public.bars (id) on delete cascade,
  booking_id  uuid not null unique references public.bookings (id) on delete cascade, -- 1 booking = 1 รีวิว
  user_id     uuid not null references public.users (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null check (char_length(comment) between 10 and 500),
  reported    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists reviews_bar_idx on public.reviews (bar_id, created_at desc);

create table public.review_media (
  id            uuid primary key default gen_random_uuid(),
  review_id     uuid not null references public.reviews (id) on delete cascade,
  type          public.review_media_type not null,
  path          text not null,               -- path ใน bucket review-media
  poster_path   text,                        -- ภาพหน้าปกวิดีโอ
  duration_sec  numeric(5,1) check (duration_sec is null or duration_sec <= 60),
  size_bytes    bigint not null check (size_bytes > 0),
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now()
);
create index review_media_review_idx on public.review_media (review_id, sort_order);

-- ไม่เกิน 6 ไฟล์ต่อรีวิว
create or replace function public.review_media_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.review_media where review_id = new.review_id) >= 6 then
    raise exception 'REVIEW_MEDIA_LIMIT' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger review_media_limit before insert on public.review_media
  for each row execute function public.review_media_limit();

alter table public.reviews      enable row level security;
alter table public.review_media enable row level security;

create policy reviews_public_read on public.reviews for select using (not reported or user_id = (select auth.uid()));
create policy review_media_public_read on public.review_media for select using (true);
create policy review_media_owner_insert on public.review_media for insert
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid())));
create policy review_media_owner_delete on public.review_media for delete
  using (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid())));

-- Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-media', 'review-media', true, 62914560,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy review_media_upload_own on storage.objects for insert
  with check (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy review_media_delete_own on storage.objects for delete
  using (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
