-- =====================================================================
-- NightOut · site-content — "ร้านยอดนิยม" ในหน้าแรก แอดมินเลือก/เรียงเองได้จาก Backoffice (/home-content)
--   - home_content    : + popular_eyebrow / popular_title (หัวข้อ section ร้านยอดนิยม)
--   - home_popular_bars: ร้านที่แอดมินปักไว้ (สูงสุด 8 · เรียงตาม sort_order) — ช่องที่เหลือหน้าเว็บเติมด้วยร้านคะแนนรีวิวสูงสุด
--   - หน้าบ้านอ่านผ่าน view public_home_popular (เฉพาะร้าน APPROVED) ใน GET /public/home
--   - admin_save_home_popular เรียกจาก NestJS (service_role) เท่านั้น · แทนที่ทั้งรายการ · audit log
--   - admin_save_home_content / home_content_check รับ+ตรวจ 2 คอลัมน์ใหม่ (ตัวล่าสุดของสองฟังก์ชันนี้)
-- =====================================================================
set search_path = public, extensions;

alter table public.home_content
  add column popular_eyebrow text not null default 'คะแนนรีวิวสูงสุด',
  add column popular_title   text not null default 'ร้านยอดนิยม';

create table public.home_popular_bars (
  bar_id      uuid primary key references public.bars(id) on delete cascade,   -- PK = index บน FK แล้ว
  sort_order  smallint not null,
  created_at  timestamptz not null default now()
);
create index home_popular_bars_sort on public.home_popular_bars (sort_order);

-- RLS: อ่านได้ทุกคน · เขียนผ่าน service role เท่านั้น (เหมือน …20261007000100)
alter table public.home_popular_bars enable row level security;
create policy home_popular_bars_read on public.home_popular_bars for select using (true);
create policy admin_read on public.home_popular_bars for select to authenticated using (public.is_admin());
grant select on public.home_popular_bars to anon, authenticated;
revoke insert, update, delete, truncate on public.home_popular_bars from anon, authenticated;

-- ---------------------------------------------------------------------
-- view — เพิ่มคอลัมน์ท้ายสุด (create or replace ได้ สิทธิ์เดิมคงอยู่)
-- ---------------------------------------------------------------------
create or replace view public.public_home_content with (security_invoker = true) as
select c.hero_title_lead, c.hero_title_highlight, c.hero_title_tail, c.hero_subtitle, c.hero_search_placeholder,
       c.hero_image_url, c.categories_eyebrow, c.categories_title, c.updated_at,
       c.popular_eyebrow, c.popular_title
from public.home_content c;

create or replace view public.admin_home_content with (security_invoker = true) as
select c.hero_title_lead, c.hero_title_highlight, c.hero_title_tail, c.hero_subtitle, c.hero_search_placeholder,
       c.hero_image_url, c.categories_eyebrow, c.categories_title, c.updated_at,
       c.popular_eyebrow, c.popular_title
from public.home_content c
where public.is_admin();

-- ร้านที่ถูกระงับ/ไม่อนุมัติหลุดจากหน้าแรกเอง (แถวยังอยู่ แอดมินเห็นใน admin_home_popular)
create view public.public_home_popular with (security_invoker = true) as
select p.bar_id, p.sort_order
from public.home_popular_bars p
join public.bars b on b.id = p.bar_id
where b.status = 'APPROVED'
order by p.sort_order;

grant select on public.public_home_popular to anon, authenticated;

create view public.admin_home_popular with (security_invoker = true) as
select p.bar_id, p.sort_order, b.name, b.slug, b.status
from public.home_popular_bars p
join public.bars b on b.id = p.bar_id
where public.is_admin();

revoke all on public.admin_home_popular from anon;
grant select on public.admin_home_popular to authenticated;

-- ---------------------------------------------------------------------
-- ตรวจค่า (ตัวล่าสุด — เพิ่ม popular_*)
-- ---------------------------------------------------------------------
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
     or char_length(r.popular_eyebrow) > 40
     or char_length(btrim(coalesce(r.popular_title, ''))) not between 1 and 60
     or (r.hero_image_url is not null and not public.home_image_ok(r.hero_image_url)) then
    raise exception 'INVALID_HOME_CONTENT' using errcode = '22023';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- เขียน
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
  if p ? 'popular_eyebrow'         then r.popular_eyebrow         := coalesce(btrim(p ->> 'popular_eyebrow'), ''); end if;
  if p ? 'popular_title'           then r.popular_title           := btrim(p ->> 'popular_title'); end if;

  perform public.home_content_check(r);

  update public.home_content set
    hero_title_lead = r.hero_title_lead, hero_title_highlight = r.hero_title_highlight, hero_title_tail = r.hero_title_tail,
    hero_subtitle = r.hero_subtitle, hero_search_placeholder = r.hero_search_placeholder, hero_image_url = r.hero_image_url,
    categories_eyebrow = r.categories_eyebrow, categories_title = r.categories_title,
    popular_eyebrow = r.popular_eyebrow, popular_title = r.popular_title
  where id
  returning * into r;

  perform public.admin_audit(p_actor, 'home_content.update', 'home_content', null, to_jsonb(before_row), to_jsonb(r));
  return to_jsonb(r) - 'id';
end $$;

-- แทนที่รายการร้านยอดนิยมทั้งชุดตามลำดับใน p_bar_ids (ว่าง = เลิกปัก ใช้คะแนนรีวิวทั้งหมด)
create or replace function public.admin_save_home_popular(p_actor uuid, p_bar_ids uuid[])
returns jsonb language plpgsql set search_path = '' as $$
declare
  ids uuid[] := coalesce(p_bar_ids, '{}');
  before_ids jsonb;
  after_ids jsonb;
begin
  perform public.admin_assert(p_actor);
  if cardinality(ids) > 8
     or array_position(ids, null) is not null
     or cardinality(ids) <> (select count(distinct x) from unnest(ids) x) then
    raise exception 'INVALID_HOME_POPULAR' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(ids) x
             where not exists (select 1 from public.bars b where b.id = x and b.status = 'APPROVED')) then
    raise exception 'HOME_POPULAR_BAR_NOT_FOUND' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(p.bar_id order by p.sort_order), '[]'::jsonb) into before_ids
  from public.home_popular_bars p;

  delete from public.home_popular_bars where true;
  insert into public.home_popular_bars (bar_id, sort_order)
  select x, (o * 10)::smallint from unnest(ids) with ordinality as t(x, o);

  after_ids := to_jsonb(ids);
  perform public.admin_audit(p_actor, 'home_popular.update', 'home_popular_bars', null,
                             jsonb_build_object('bar_ids', before_ids), jsonb_build_object('bar_ids', after_ids));
  return jsonb_build_object('bar_ids', after_ids);
end $$;

revoke all on function public.admin_save_home_content(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_save_home_popular(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.home_content_check(public.home_content) from public, anon, authenticated;
grant execute on function public.admin_save_home_content(uuid, jsonb) to service_role;
grant execute on function public.admin_save_home_popular(uuid, uuid[]) to service_role;
grant execute on function public.home_content_check(public.home_content) to service_role;
