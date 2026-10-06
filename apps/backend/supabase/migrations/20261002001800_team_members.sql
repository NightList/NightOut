-- =====================================================================
-- NightOut · ทีมงานหน้า /about — ตาราง team_members + view public_team
-- หน้าบ้านอ่านผ่าน view public_team เท่านั้น (เฉพาะคนที่ active) · แก้ข้อมูลผ่าน service role (NestJS / Studio)
-- contacts (jsonb object) key ที่หน้าเว็บรู้จัก:
--   facebook, instagram, tiktok, github, linkedin = URL เต็ม (https://…)
--   line  = LINE ID หรือ URL · email = อีเมล · phone = เบอร์โทร
--   key ที่ไม่มี / ค่าว่าง = ไม่แสดงไอคอนนั้น
-- =====================================================================
set search_path = public, extensions;

create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  nickname    text not null,                              -- ชื่อที่แสดงบนการ์ด เช่น 'แสน'
  full_name   text,                                       -- ชื่อจริง (แสดงในแผงโปรไฟล์)
  roles       text[] not null default '{}',               -- ตำแหน่ง · ตัวแรก = ตำแหน่งหลัก (สีทอง)
  bio         text,                                       -- แนะนำตัว (ขึ้นบรรทัดใหม่ได้)
  skills      text[] not null default '{}',
  photo_url   text,                                       -- path ใน public/ เช่น '/images/teams/san.webp' หรือ URL เต็ม
  contacts    jsonb not null default '{}'::jsonb check (jsonb_typeof(contacts) = 'object'),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();

create index team_members_sort_order_idx on public.team_members (sort_order) where active;

-- RLS: อ่านได้เฉพาะคนที่ active · เขียนผ่าน service role เท่านั้น (เหมือน …001500)
alter table public.team_members enable row level security;
create policy team_members_read on public.team_members for select using (active);
grant select on public.team_members to anon, authenticated;   -- view แบบ security_invoker ต้องอ่านตารางจริงได้ (RLS กรองให้)
revoke insert, update, delete, truncate on public.team_members from anon, authenticated;

-- view สำหรับหน้าบ้าน
create view public.public_team with (security_invoker = true) as
select
  t.id,
  t.nickname,
  t.full_name,
  t.roles,
  t.bio,
  t.skills,
  t.photo_url,
  t.contacts,
  t.sort_order
from public.team_members t
where t.active
order by t.sort_order, t.created_at;

grant select on public.public_team to anon, authenticated;

-- ทีมตั้งต้น (เดิมอยู่ใน apps/frontend/src/modules/about/utils/content.ts) · bio / skills / contacts เติมทีหลังได้
insert into public.team_members (nickname, roles, photo_url, sort_order) values
  ('แสน',   array['Founder', 'Fullstack Developer'],        '/images/teams/san.webp',   10),
  ('วิน',    array['DevOps', 'Consultant'],                  '/images/teams/wind.webp',  20),
  ('เนวิน',  array['Business Analyst'],                      '/images/teams/newin.webp', 30),
  ('พี',     array['UI/UX Designer', 'Frontend Developer'],   '/images/teams/pee.webp',   40),
  ('บิว',    array['UI/UX Designer', 'Frontend Developer'],   '/images/teams/biw.webp',   50),
  ('ก็อต',   array['Co-Founder', 'Fullstack Developer'],     '/images/teams/got.webp',   60),
  ('เติร์ด',  array['Co-Founder', 'Fullstack Developer'],     '/images/teams/third.webp', 70);
