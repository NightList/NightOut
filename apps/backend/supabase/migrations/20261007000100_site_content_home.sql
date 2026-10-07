-- =====================================================================
-- NightOut · site-content — เนื้อหาหน้าแรกที่แอดมินแก้ได้จาก Backoffice (/home-content)
--   - home_content    : แถวเดียว — Hero (หัวข้อ 3 ท่อน · คำโปรย · ช่องค้นหา · ภาพพื้น) + ชื่อ section หมวด
--   - home_categories : การ์ด "คืนนี้อยากได้ฟีลไหน" 8 ช่องแบบ bento (slot ตายตัว แก้ได้เฉพาะเนื้อหา)
--   - หน้าบ้านอ่านผ่าน view public_home_content / public_home_categories (GET /public/home)
--   - admin_save_home_content / admin_save_home_category เรียกจาก NestJS (service_role) เท่านั้น · audit log
--   - bucket site-media (public) — แอดมินอัปโหลดภาพ Hero / ภาพการ์ดหมวด
-- ค่าตั้งต้น = เนื้อหาที่เคย hard-code ใน apps/frontend/src/modules/home (hero.tsx, utils/categories.ts)
-- =====================================================================
set search_path = public, extensions;

create table public.home_content (
  id                       boolean primary key default true check (id),   -- บังคับให้มีแถวเดียว
  hero_title_lead          text not null,
  hero_title_highlight     text not null,
  hero_title_tail          text not null default '',
  hero_subtitle            text not null default '',
  hero_search_placeholder  text not null,
  hero_image_url           text,                                          -- null = ภาพดวงจันทร์ตั้งต้น (มีดาว/ไฟระยิบ)
  categories_eyebrow       text not null default '',
  categories_title         text not null,
  updated_at               timestamptz not null default now()
);
create trigger home_content_updated_at before update on public.home_content for each row execute function public.set_updated_at();

create table public.home_categories (
  slot        text primary key check (slot in ('popular', 'pub', 'food', 'live', 'rooftop', 'chill', 'outdoor', 'party')),
  sort_order  smallint not null,                                          -- ลำดับบนกริด (ตายตัวตาม slot)
  title       text not null,
  hint        text not null default '',
  link_to     text not null,                                              -- ลิงก์ในเว็บ เช่น /search?style=Rooftop
  icon        text not null,                                              -- key ใน HOME_CATEGORY_ICON_KEYS (@nightout/contracts)
  image_url   text not null,
  badge       text,
  updated_at  timestamptz not null default now()
);
create trigger home_categories_updated_at before update on public.home_categories for each row execute function public.set_updated_at();

-- RLS: เนื้อหาสาธารณะ อ่านได้ทุกคน · เขียนผ่าน service role เท่านั้น (เหมือน …001500)
alter table public.home_content enable row level security;
alter table public.home_categories enable row level security;
create policy home_content_read on public.home_content for select using (true);
create policy home_categories_read on public.home_categories for select using (true);
-- …001600 สร้าง admin_read ให้ตารางที่มีตอนนั้นเท่านั้น — ตารางใหม่ต้องเพิ่มเอง
create policy admin_read on public.home_content for select to authenticated using (public.is_admin());
create policy admin_read on public.home_categories for select to authenticated using (public.is_admin());
grant select on public.home_content, public.home_categories to anon, authenticated;
revoke insert, update, delete, truncate on public.home_content, public.home_categories from anon, authenticated;

-- ---------------------------------------------------------------------
-- view
-- ---------------------------------------------------------------------
create view public.public_home_content with (security_invoker = true) as
select c.hero_title_lead, c.hero_title_highlight, c.hero_title_tail, c.hero_subtitle, c.hero_search_placeholder,
       c.hero_image_url, c.categories_eyebrow, c.categories_title, c.updated_at
from public.home_content c;

create view public.public_home_categories with (security_invoker = true) as
select h.slot, h.sort_order, h.title, h.hint, h.link_to, h.icon, h.image_url, h.badge, h.updated_at
from public.home_categories h
order by h.sort_order;

grant select on public.public_home_content, public.public_home_categories to anon, authenticated;

create view public.admin_home_content with (security_invoker = true) as
select c.hero_title_lead, c.hero_title_highlight, c.hero_title_tail, c.hero_subtitle, c.hero_search_placeholder,
       c.hero_image_url, c.categories_eyebrow, c.categories_title, c.updated_at
from public.home_content c
where public.is_admin();

create view public.admin_home_categories with (security_invoker = true) as
select h.slot, h.sort_order, h.title, h.hint, h.link_to, h.icon, h.image_url, h.badge, h.updated_at
from public.home_categories h
where public.is_admin();

revoke all on public.admin_home_content, public.admin_home_categories from anon;
grant select on public.admin_home_content, public.admin_home_categories to authenticated;

-- ---------------------------------------------------------------------
-- ตรวจค่าก่อนบันทึก (NestJS ตรวจด้วย zod แล้ว — นี่คือด่านสุดท้ายใน DB)
-- ---------------------------------------------------------------------
create or replace function public.home_image_ok(u text) returns boolean
language sql immutable set search_path = '' as $$
  select u is not null and char_length(u) <= 500 and u ~ '^(https?://|/)';   -- http:// = Supabase ในเครื่อง
$$;

create or replace function public.home_content_check(r public.home_content) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if char_length(btrim(coalesce(r.hero_title_lead, ''))) not between 1 and 20
     or char_length(btrim(coalesce(r.hero_title_highlight, ''))) not between 1 and 20
     or char_length(r.hero_title_tail) > 20
     or char_length(r.hero_subtitle) > 160
     or char_length(btrim(coalesce(r.hero_search_placeholder, ''))) not between 1 and 60
     or char_length(r.categories_eyebrow) > 40
     or char_length(btrim(coalesce(r.categories_title, ''))) not between 1 and 60
     or (r.hero_image_url is not null and not public.home_image_ok(r.hero_image_url)) then
    raise exception 'INVALID_HOME_CONTENT' using errcode = '22023';
  end if;
end $$;

create or replace function public.home_category_check(r public.home_categories) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if char_length(btrim(coalesce(r.title, ''))) not between 1 and 30
     or char_length(r.hint) > 60
     or r.link_to is null or char_length(r.link_to) > 300 or r.link_to !~ '^/[^/]' and r.link_to <> '/'
     or r.icon not in ('crown', 'martini', 'fork-knife', 'music-notes', 'buildings', 'armchair', 'tree', 'disco-ball',
                       'beer-stein', 'wine', 'champagne', 'microphone-stage', 'cocktail', 'moon-stars', 'fire',
                       'heart', 'users-three', 'sparkle')
     or not public.home_image_ok(r.image_url)
     or char_length(coalesce(r.badge, '')) > 30 then
    raise exception 'INVALID_HOME_CONTENT' using errcode = '22023';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- เขียน (ส่งเฉพาะ key ที่ต้องการแก้)
-- ---------------------------------------------------------------------
create or replace function public.admin_save_home_content(p_actor uuid, p jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  before_row public.home_content;
  r public.home_content;
begin
  perform public.admin_assert(p_actor);
  if jsonb_typeof(p) <> 'object' then raise exception 'INVALID_HOME_CONTENT' using errcode = '22023'; end if;
  select * into before_row from public.home_content where id for update;
  r := before_row;

  if p ? 'hero_title_lead'         then r.hero_title_lead         := btrim(p ->> 'hero_title_lead'); end if;
  if p ? 'hero_title_highlight'    then r.hero_title_highlight    := btrim(p ->> 'hero_title_highlight'); end if;
  if p ? 'hero_title_tail'         then r.hero_title_tail         := coalesce(btrim(p ->> 'hero_title_tail'), ''); end if;
  if p ? 'hero_subtitle'           then r.hero_subtitle           := coalesce(btrim(p ->> 'hero_subtitle'), ''); end if;
  if p ? 'hero_search_placeholder' then r.hero_search_placeholder := btrim(p ->> 'hero_search_placeholder'); end if;
  if p ? 'hero_image_url'          then r.hero_image_url          := nullif(btrim(p ->> 'hero_image_url'), ''); end if;
  if p ? 'categories_eyebrow'      then r.categories_eyebrow      := coalesce(btrim(p ->> 'categories_eyebrow'), ''); end if;
  if p ? 'categories_title'        then r.categories_title        := btrim(p ->> 'categories_title'); end if;

  perform public.home_content_check(r);

  update public.home_content set
    hero_title_lead = r.hero_title_lead, hero_title_highlight = r.hero_title_highlight, hero_title_tail = r.hero_title_tail,
    hero_subtitle = r.hero_subtitle, hero_search_placeholder = r.hero_search_placeholder, hero_image_url = r.hero_image_url,
    categories_eyebrow = r.categories_eyebrow, categories_title = r.categories_title
  where id
  returning * into r;

  perform public.admin_audit(p_actor, 'home_content.update', 'home_content', null, to_jsonb(before_row), to_jsonb(r));
  return to_jsonb(r) - 'id';
end $$;

create or replace function public.admin_save_home_category(p_actor uuid, p_slot text, p jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  before_row public.home_categories;
  r public.home_categories;
begin
  perform public.admin_assert(p_actor);
  if jsonb_typeof(p) <> 'object' then raise exception 'INVALID_HOME_CONTENT' using errcode = '22023'; end if;
  select * into before_row from public.home_categories where slot = p_slot for update;
  if not found then raise exception 'HOME_CATEGORY_NOT_FOUND' using errcode = 'P0002'; end if;
  r := before_row;

  if p ? 'title'     then r.title     := btrim(p ->> 'title'); end if;
  if p ? 'hint'      then r.hint      := coalesce(btrim(p ->> 'hint'), ''); end if;
  if p ? 'link_to'   then r.link_to   := btrim(p ->> 'link_to'); end if;
  if p ? 'icon'      then r.icon      := p ->> 'icon'; end if;
  if p ? 'image_url' then r.image_url := btrim(p ->> 'image_url'); end if;
  if p ? 'badge'     then r.badge     := nullif(btrim(p ->> 'badge'), ''); end if;

  perform public.home_category_check(r);

  update public.home_categories set
    title = r.title, hint = r.hint, link_to = r.link_to, icon = r.icon, image_url = r.image_url, badge = r.badge
  where slot = p_slot
  returning * into r;

  perform public.admin_audit(p_actor, 'home_category.update', 'home_categories', null, to_jsonb(before_row), to_jsonb(r));
  return to_jsonb(r);
end $$;

revoke all on function public.admin_save_home_content(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_save_home_category(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.home_content_check(public.home_content) from public, anon, authenticated;
revoke all on function public.home_category_check(public.home_categories) from public, anon, authenticated;
revoke all on function public.home_image_ok(text) from public, anon, authenticated;
grant execute on function public.admin_save_home_content(uuid, jsonb) to service_role;
grant execute on function public.admin_save_home_category(uuid, text, jsonb) to service_role;
grant execute on function public.home_content_check(public.home_content) to service_role;
grant execute on function public.home_category_check(public.home_categories) to service_role;
grant execute on function public.home_image_ok(text) to service_role;

-- ---------------------------------------------------------------------
-- ค่าตั้งต้น (= หน้าแรกก่อนมีระบบนี้)
-- ---------------------------------------------------------------------
insert into public.home_content (hero_title_lead, hero_title_highlight, hero_title_tail, hero_subtitle,
                                 hero_search_placeholder, hero_image_url, categories_eyebrow, categories_title)
values ('คืนนี้ไป', 'ร้านไหน', 'ดี', 'ดูอันดับจากคนที่ไปจริง รู้ราคาต่อหัวก่อนออกจากบ้าน แล้วจองโต๊ะได้เลย',
        'ค้นหาร้านที่โดนใจสำหรับคุณ', null, 'เลือกตามสไตล์', 'คืนนี้อยากได้ฟีลไหน');

insert into public.home_categories (slot, sort_order, title, hint, link_to, icon, image_url, badge) values
  ('popular', 10, 'ร้านยอดนิยม', 'อันดับจากโหวตของคนที่ไปจริง', '/ranking',                          'crown',       '/images/categories/night-out-group-toast.webp', 'อันดับประจำสัปดาห์'),
  ('pub',     20, 'ผับ / บาร์',   'ดื่ม เต้น สังสรรค์',            '/search?category=PUB_BAR',          'martini',     '/images/categories/intimate-cocktail-bar.webp', null),
  ('food',    30, 'ร้านอาหาร',   'มื้อเย็นก่อนออกเที่ยว',          '/search?category=RESTAURANT',       'fork-knife',  '/images/categories/friends-dinner-toast.webp',  null),
  ('live',    40, 'ดนตรีสด',     'ร้านที่มีวงเล่นสด',              '/search?style=Live%20Music',        'music-notes', '/images/categories/live-music-dinner.webp',     null),
  ('rooftop', 50, 'Rooftop',     'นั่งชมวิวเมืองบนดาดฟ้า',         '/search?style=Rooftop',             'buildings',   '/images/categories/rooftop-lounge-skyline.webp', null),
  ('chill',   60, 'นั่งชิล',      'เพลงเบา คุยกันสบาย',            '/search?category=CHILL',            'armchair',    '/images/categories/vinyl-listening-bar.webp',   null),
  ('outdoor', 70, 'Outdoor',     'โต๊ะกลางแจ้ง รับลมเย็น',         '/search?style=Outdoor',             'tree',        '/images/categories/outdoor-garden-dinner.webp', null),
  ('party',   80, 'ปาร์ตี้',      'ดีเจ ฟลอร์เต้นรำ',              '/search?style=Party%20%26%20Dancing', 'disco-ball', '/images/categories/edm-dance-floor.webp',       null);

-- ---------------------------------------------------------------------
-- Storage: ภาพหน้าแรก (public อ่านได้ทุกคน · เขียนได้เฉพาะแอดมินที่ผ่าน MFA)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "site-media: admin write" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_admin());
create policy "site-media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and public.is_admin());
create policy "site-media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and public.is_admin());
