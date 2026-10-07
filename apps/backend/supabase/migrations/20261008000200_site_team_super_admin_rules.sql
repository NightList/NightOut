-- =====================================================================
-- NightOut · site-team — สิทธิ์จัดการทีมงาน (หน้า /about · Backoffice /team)
--   · เพิ่ม / ลบ / สลับลำดับ → เฉพาะ Super Admin (super_admin_assert)
--   · แก้ / ซ่อน-แสดง → Super Admin ได้ทุกแถว · Admin ได้เฉพาะแถวที่ contacts.email ตรงกับอีเมลบัญชีตัวเอง
--     (TEAM_MEMBER_NOT_OWN) และเปลี่ยน/ลบอีเมลในแถวนั้นไม่ได้ (TEAM_MEMBER_EMAIL_LOCKED)
--   เดิม (…20261003000100) แอดมินทุกคนทำได้ทุกอย่าง
-- =====================================================================
set search_path = public, extensions;

-- อีเมลเทียบแบบไม่สนตัวพิมพ์/ช่องว่าง (contacts.email พิมพ์มือ · users.email sync จาก auth.users)
create or replace function public.team_member_is_own(p_actor uuid, p_contacts jsonb)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.users u
    where u.id = p_actor and u.deleted_at is null and u.email is not null
      and lower(btrim(u.email)) = lower(btrim(coalesce(p_contacts ->> 'email', '')))
  );
$$;

create or replace function public.admin_save_team_member(p_actor uuid, p_id uuid, p jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  before_row public.team_members;
  r public.team_members;
  v_super boolean;
begin
  perform public.admin_assert(p_actor);
  v_super := exists (select 1 from public.users where id = p_actor and role = 'SUPER_ADMIN' and deleted_at is null);
  if jsonb_typeof(p) <> 'object' then raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023'; end if;

  if p_id is null then
    perform public.super_admin_assert(p_actor);
    r.id := gen_random_uuid();
    r.nickname := '';
    r.roles := '{}';
    r.skills := '{}';
    r.contacts := '{}'::jsonb;
    r.active := true;
    r.sort_order := coalesce((select max(sort_order) from public.team_members), 0) + 10;
  else
    select * into before_row from public.team_members where id = p_id for update;
    if not found then raise exception 'TEAM_MEMBER_NOT_FOUND' using errcode = 'P0002'; end if;
    if not v_super and not public.team_member_is_own(p_actor, before_row.contacts) then
      raise exception 'TEAM_MEMBER_NOT_OWN' using errcode = '42501';
    end if;
    -- ลำดับเปลี่ยนได้เฉพาะ Super Admin (ผ่าน admin_reorder_team_members)
    if not v_super and p ? 'sort_order' then raise exception 'SUPER_ADMIN_REQUIRED' using errcode = '42501'; end if;
    r := before_row;
  end if;

  if p ? 'nickname'   then r.nickname  := btrim(p ->> 'nickname'); end if;
  if p ? 'full_name'  then r.full_name := nullif(btrim(p ->> 'full_name'), ''); end if;
  if p ? 'bio'        then r.bio       := nullif(btrim(p ->> 'bio'), ''); end if;
  if p ? 'photo_url'  then r.photo_url := nullif(btrim(p ->> 'photo_url'), ''); end if;
  if p ? 'roles'      then r.roles     := coalesce(array(select btrim(x) from jsonb_array_elements_text(p -> 'roles') x where btrim(x) <> ''), '{}'); end if;
  if p ? 'skills'     then r.skills    := coalesce(array(select btrim(x) from jsonb_array_elements_text(p -> 'skills') x where btrim(x) <> ''), '{}'); end if;
  if p ? 'contacts'   then
    -- เก็บเฉพาะ key ที่หน้าเว็บรู้จักและมีค่า
    r.contacts := coalesce((select jsonb_object_agg(k, btrim(v))
                            from jsonb_each_text(p -> 'contacts') e(k, v)
                            where k in ('facebook', 'instagram', 'tiktok', 'github', 'linkedin', 'line', 'email', 'phone')
                              and btrim(coalesce(v, '')) <> ''), '{}'::jsonb);
  end if;
  if p ? 'active'     then r.active     := (p ->> 'active')::boolean; end if;
  if p ? 'sort_order' then r.sort_order := (p ->> 'sort_order')::integer; end if;

  -- อีเมลคือตัวผูกแถวกับบัญชี — Admin เปลี่ยน/ลบออกเองไม่ได้
  if not v_super and not public.team_member_is_own(p_actor, r.contacts) then
    raise exception 'TEAM_MEMBER_EMAIL_LOCKED' using errcode = '42501';
  end if;

  perform public.team_member_check(r);

  if p_id is null then
    insert into public.team_members (id, nickname, full_name, roles, bio, skills, photo_url, contacts, sort_order, active)
    values (r.id, r.nickname, r.full_name, r.roles, r.bio, r.skills, r.photo_url, r.contacts, r.sort_order, r.active);
  else
    update public.team_members set
      nickname = r.nickname, full_name = r.full_name, roles = r.roles, bio = r.bio, skills = r.skills,
      photo_url = r.photo_url, contacts = r.contacts, sort_order = r.sort_order, active = r.active
    where id = p_id;
  end if;

  perform public.admin_audit(p_actor, case when p_id is null then 'team_member.create' else 'team_member.update' end,
                             'team_members', r.id, case when p_id is null then null else to_jsonb(before_row) end, to_jsonb(r));
  return jsonb_build_object('id', r.id, 'nickname', r.nickname, 'active', r.active, 'sort_order', r.sort_order);
end $$;

create or replace function public.admin_delete_team_member(p_actor uuid, p_id uuid)
returns jsonb language plpgsql set search_path = '' as $$
declare before_row public.team_members;
begin
  perform public.admin_assert(p_actor);
  perform public.super_admin_assert(p_actor);
  delete from public.team_members where id = p_id returning * into before_row;
  if not found then raise exception 'TEAM_MEMBER_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.admin_audit(p_actor, 'team_member.delete', 'team_members', p_id, to_jsonb(before_row), null);
  return jsonb_build_object('id', p_id, 'deleted', true);
end $$;

create or replace function public.admin_reorder_team_members(p_actor uuid, p_ids uuid[])
returns jsonb language plpgsql set search_path = '' as $$
declare n integer;
begin
  perform public.admin_assert(p_actor);
  perform public.super_admin_assert(p_actor);
  if p_ids is null or cardinality(p_ids) = 0 then raise exception 'INVALID_TEAM_ORDER' using errcode = '22023'; end if;
  if (select count(*) from public.team_members where id = any(p_ids)) <> cardinality(p_ids)
     or cardinality(p_ids) <> (select count(distinct x) from unnest(p_ids) x) then
    raise exception 'INVALID_TEAM_ORDER' using errcode = '22023';
  end if;
  with ordered as (
    select id, row_number() over (order by coalesce(array_position(p_ids, id), cardinality(p_ids) + 1), sort_order, created_at) as pos
    from public.team_members
  )
  update public.team_members t set sort_order = o.pos * 10 from ordered o where o.id = t.id and t.sort_order is distinct from o.pos * 10;
  get diagnostics n = row_count;
  perform public.admin_audit(p_actor, 'team_member.reorder', 'team_members', null, null, jsonb_build_object('ids', to_jsonb(p_ids)));
  return jsonb_build_object('updated', n);
end $$;

revoke all on function public.team_member_is_own(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_save_team_member(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_delete_team_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_reorder_team_members(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.team_member_is_own(uuid, jsonb) to service_role;
grant execute on function public.admin_save_team_member(uuid, uuid, jsonb) to service_role;
grant execute on function public.admin_delete_team_member(uuid, uuid) to service_role;
grant execute on function public.admin_reorder_team_members(uuid, uuid[]) to service_role;
