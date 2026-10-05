-- =====================================================================
-- NightOut · Backoffice "เพิ่มผู้ใช้" (หน้า /users)
-- NestJS สร้างบัญชีใน Supabase Auth (service_role) → trigger handle_new_auth_user สร้าง public.users (CUSTOMER)
-- แล้วเรียก admin_finish_new_user ตั้งสิทธิ์ + ผูกร้าน + audit ในธุรกรรมเดียว (แบบเดียวกับ scripts/create-user.ts)
-- =====================================================================
set search_path = public, extensions;

create or replace function public.admin_finish_new_user(
  p_actor uuid,
  p_user uuid,
  p_role public.user_role,
  p_bar uuid default null,
  p_bar_role public.bar_staff_role default null
) returns jsonb language plpgsql set search_path = '' as $$
declare
  u public.users;
  b record;
begin
  perform public.admin_assert(p_actor);
  select * into u from public.users where id = p_user for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;

  -- สิทธิ์ที่ต้องมีร้าน: MERCHANT = เจ้าของ/ผู้จัดการ · STAFF = พนักงาน
  if (p_bar is null) <> (p_bar_role is null)
     or (p_role = 'MERCHANT' and p_bar_role is distinct from 'OWNER' and p_bar_role is distinct from 'MANAGER')
     or (p_role = 'STAFF' and p_bar_role is distinct from 'STAFF')
     or (p_role in ('CUSTOMER', 'ADMIN') and p_bar is not null) then
    raise exception 'INVALID_ACCOUNT_TYPE' using errcode = '22023';
  end if;

  update public.users set role = p_role where id = p_user;

  if p_bar is not null then
    select id, name, owner_id into b from public.bars where id = p_bar for update;
    if not found then raise exception 'BAR_NOT_FOUND' using errcode = 'P0002'; end if;
    if p_bar_role = 'OWNER' then
      -- ร้านมีเจ้าของได้คนเดียว — เจ้าของเดิมยังอยู่ในทีมในฐานะผู้จัดการ (trigger bars_owner_changed เพิ่มเจ้าของใหม่เข้า bar_staff)
      if b.owner_id is not null and b.owner_id <> p_user then
        update public.bar_staff set role = 'MANAGER' where bar_id = p_bar and user_id = b.owner_id;
      end if;
      update public.bars set owner_id = p_user where id = p_bar;
    else
      insert into public.bar_staff (bar_id, user_id, role, invited_by, accepted_at)
      values (p_bar, p_user, p_bar_role, p_actor, now())
      on conflict (bar_id, user_id) do update set role = excluded.role, revoked_at = null, accepted_at = now();
    end if;
  end if;

  perform public.admin_audit(p_actor, 'user.create', 'users', p_user, null,
    jsonb_build_object('email', u.email, 'role', p_role, 'bar_id', p_bar, 'bar_role', p_bar_role, 'via', 'backoffice'));
  return jsonb_build_object('id', p_user, 'email', u.email, 'role', p_role, 'bar_id', p_bar, 'bar_role', p_bar_role);
end $$;

revoke execute on function public.admin_finish_new_user(uuid, uuid, public.user_role, uuid, public.bar_staff_role) from public, anon, authenticated;
grant execute on function public.admin_finish_new_user(uuid, uuid, public.user_role, uuid, public.bar_staff_role) to service_role;
