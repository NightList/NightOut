-- =====================================================================
-- NightOut · site-content — เอาไอคอนของการ์ดหมวดหน้าแรกออก (home_categories.icon)
--   หน้าแรกไม่แสดงไอคอนมุมซ้ายบนของการ์ด "คืนนี้อยากได้ฟีลไหน" แล้ว และ Backoffice ไม่มีช่องเลือกไอคอน
--   - view public_home_categories / admin_home_categories อ้างคอลัมน์ icon → drop แล้วสร้างใหม่ (สิทธิ์เดิม)
--   - home_category_check / admin_save_home_category ไม่ตรวจ/ไม่เขียน icon (key `icon` ที่ส่งมาถูกเมิน)
-- =====================================================================
set search_path = public, extensions;

drop view public.public_home_categories;
drop view public.admin_home_categories;

alter table public.home_categories drop column icon;

-- ---------------------------------------------------------------------
-- view (เหมือน …20261007000100 แต่ไม่มี icon)
-- ---------------------------------------------------------------------
create view public.public_home_categories with (security_invoker = true) as
select h.slot, h.sort_order, h.title, h.hint, h.link_to, h.image_url, h.badge, h.updated_at
from public.home_categories h
order by h.sort_order;

grant select on public.public_home_categories to anon, authenticated;

create view public.admin_home_categories with (security_invoker = true) as
select h.slot, h.sort_order, h.title, h.hint, h.link_to, h.image_url, h.badge, h.updated_at
from public.home_categories h
where public.is_admin();

revoke all on public.admin_home_categories from anon;
grant select on public.admin_home_categories to authenticated;

-- ---------------------------------------------------------------------
-- ตรวจค่า + บันทึก (ไม่มี icon)
-- ---------------------------------------------------------------------
create or replace function public.home_category_check(r public.home_categories) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if char_length(btrim(coalesce(r.title, ''))) not between 1 and 30
     or char_length(r.hint) > 60
     or r.link_to is null or char_length(r.link_to) > 300 or r.link_to !~ '^/[^/]' and r.link_to <> '/'
     or not public.home_image_ok(r.image_url)
     or char_length(coalesce(r.badge, '')) > 30 then
    raise exception 'INVALID_HOME_CONTENT' using errcode = '22023';
  end if;
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
  if p ? 'image_url' then r.image_url := btrim(p ->> 'image_url'); end if;
  if p ? 'badge'     then r.badge     := nullif(btrim(p ->> 'badge'), ''); end if;

  perform public.home_category_check(r);

  update public.home_categories set
    title = r.title, hint = r.hint, link_to = r.link_to, image_url = r.image_url, badge = r.badge
  where slot = p_slot
  returning * into r;

  perform public.admin_audit(p_actor, 'home_category.update', 'home_categories', null, to_jsonb(before_row), to_jsonb(r));
  return to_jsonb(r);
end $$;

revoke all on function public.admin_save_home_category(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.home_category_check(public.home_categories) from public, anon, authenticated;
grant execute on function public.admin_save_home_category(uuid, text, jsonb) to service_role;
grant execute on function public.home_category_check(public.home_categories) to service_role;
