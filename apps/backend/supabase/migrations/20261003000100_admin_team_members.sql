-- =====================================================================
-- NightOut · Backoffice "จัดการทีมงาน" (ทีมงานหน้า /about — ตาราง team_members จาก …001800)
--   - view admin_team_members: แอดมินเห็นทุกคน (รวมที่ซ่อนอยู่)
--   - admin_save_team_member / admin_delete_team_member / admin_reorder_team_members
--     เรียกจาก NestJS (service_role) เท่านั้น · ตรวจ ADMIN + บันทึก audit_logs ในธุรกรรมเดียว (แบบ …001600)
--   - bucket team-photos (public) — แอดมินอัปโหลดรูปโปรไฟล์ทีมงานได้
-- =====================================================================
set search_path = public, extensions;

-- …001600 สร้าง policy admin_read ให้ทุกตารางที่มีตอนนั้น — team_members มาทีหลัง จึงต้องเพิ่มเอง
drop policy if exists admin_read on public.team_members;
create policy admin_read on public.team_members for select to authenticated using (public.is_admin());

create view public.admin_team_members with (security_invoker = true) as
select
  t.id, t.nickname, t.full_name, t.roles, t.bio, t.skills, t.photo_url, t.contacts,
  t.sort_order, t.active, t.created_at, t.updated_at
from public.team_members t
where public.is_admin();

revoke all on public.admin_team_members from anon;
grant select on public.admin_team_members to authenticated;

-- ---------------------------------------------------------------------
-- ตรวจค่าก่อนบันทึก (NestJS ตรวจด้วย zod แล้ว — นี่คือด่านสุดท้ายใน DB)
-- ---------------------------------------------------------------------
create or replace function public.team_member_check(r public.team_members) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if r.nickname is null or char_length(btrim(r.nickname)) not between 1 and 40 then
    raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023', detail = 'nickname';
  end if;
  if cardinality(r.roles) > 6 or cardinality(r.skills) > 20 then
    raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023', detail = 'roles/skills';
  end if;
  if r.photo_url is not null and r.photo_url !~ '^(https?://|/)' then   -- http:// = Supabase ในเครื่อง
    raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023', detail = 'photo_url';
  end if;
end $$;

-- เพิ่ม (p_id = null) หรือแก้ (ส่งเฉพาะ key ที่ต้องการแก้) · คนใหม่ต่อท้ายลำดับ
create or replace function public.admin_save_team_member(p_actor uuid, p_id uuid, p jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  before_row public.team_members;
  r public.team_members;
begin
  perform public.admin_assert(p_actor);
  if jsonb_typeof(p) <> 'object' then raise exception 'INVALID_TEAM_MEMBER' using errcode = '22023'; end if;

  if p_id is null then
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
  delete from public.team_members where id = p_id returning * into before_row;
  if not found then raise exception 'TEAM_MEMBER_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.admin_audit(p_actor, 'team_member.delete', 'team_members', p_id, to_jsonb(before_row), null);
  return jsonb_build_object('id', p_id, 'deleted', true);
end $$;

-- เรียงใหม่ทั้งชุด: ตามลำดับใน p_ids → sort_order 10, 20, 30, … (คนที่ไม่อยู่ใน p_ids ต่อท้ายตามลำดับเดิม)
create or replace function public.admin_reorder_team_members(p_actor uuid, p_ids uuid[])
returns jsonb language plpgsql set search_path = '' as $$
declare n integer;
begin
  perform public.admin_assert(p_actor);
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

-- ฟังก์ชันเขียน: service_role (NestJS) เท่านั้น — เหมือน …001600
revoke execute on function public.admin_save_team_member(uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_delete_team_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.admin_reorder_team_members(uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.team_member_check(public.team_members) from public, anon, authenticated;
grant execute on function public.admin_save_team_member(uuid, uuid, jsonb) to service_role;
grant execute on function public.admin_delete_team_member(uuid, uuid) to service_role;
grant execute on function public.admin_reorder_team_members(uuid, uuid[]) to service_role;
grant execute on function public.team_member_check(public.team_members) to service_role;

-- ---------------------------------------------------------------------
-- Storage: รูปโปรไฟล์ทีมงาน (public อ่านได้ทุกคน · เขียนได้เฉพาะแอดมินที่ผ่าน MFA)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('team-photos', 'team-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "team-photos: admin write" on storage.objects for insert to authenticated
  with check (bucket_id = 'team-photos' and public.is_admin());
create policy "team-photos: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());
create policy "team-photos: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());
