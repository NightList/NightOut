-- =====================================================================
-- NightOut · ชั้นบัญชี SUPER_ADMIN (ADR 0005) — ส่วนที่ 2: กติกา
-- · Super Admin เข้าหลังบ้านได้เหมือน Admin (can_enter_backoffice) และเป็นชั้นเดียวที่แก้ชั้นของบัญชีที่มีอยู่แล้วได้
-- · สร้างบัญชีแอดมิน / ซูเปอร์แอดมิน ได้เฉพาะ Super Admin · Admin สร้างได้แค่ลูกค้า / ร้านค้า / พนักงาน
-- · แก้ชั้นเป็นลูกค้า / แอดมิน / ซูเปอร์แอดมิน → หลุดจากทุกร้าน (เลิกเป็นเจ้าของ + ถอนจากทีม)
-- · ห้ามเหลือ Super Admin เป็นศูนย์ (ทั้งแก้ชั้นและลบบัญชีตัวเอง)
-- คนแรกตั้งด้วย scripts/create-user.ts --role SUPER_ADMIN
-- =====================================================================
set search_path = public, extensions;

insert into public.roles (code, label_th, can_enter_backoffice, sort_order)
values ('SUPER_ADMIN', 'ซูเปอร์แอดมิน', true, 50)
on conflict (code) do update set label_th = excluded.label_th, can_enter_backoffice = excluded.can_enter_backoffice, sort_order = excluded.sort_order;

create or replace function public.super_admin_assert(p_actor uuid) returns void
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.users where id = p_actor and role = 'SUPER_ADMIN' and deleted_at is null) then
    raise exception 'SUPER_ADMIN_REQUIRED' using errcode = '42501';
  end if;
end $$;

-- ล็อกแถว Super Admin ทั้งหมดก่อนนับ — สองคนลดชั้นตัวเองพร้อมกันจะไม่เหลือศูนย์
create or replace function public.assert_keeps_super_admin(p_user uuid) returns void
language plpgsql set search_path = '' as $$
begin
  perform 1 from public.users where role = 'SUPER_ADMIN' and deleted_at is null for update;
  if not exists (select 1 from public.users where role = 'SUPER_ADMIN' and deleted_at is null and id <> p_user) then
    raise exception 'LAST_SUPER_ADMIN' using errcode = 'P0001';
  end if;
end $$;

create or replace function public.admin_set_user_role(p_actor uuid, p_user uuid, p_role public.user_role)
returns jsonb language plpgsql set search_path = '' as $$
declare old_role public.user_role; v_detached int := 0;
begin
  perform public.admin_assert(p_actor);
  perform public.super_admin_assert(p_actor);
  select role into old_role from public.users where id = p_user and deleted_at is null for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  if old_role = p_role then
    return jsonb_build_object('id', p_user, 'role', p_role, 'bars_detached', 0);
  end if;
  if old_role = 'SUPER_ADMIN' then perform public.assert_keeps_super_admin(p_user); end if;

  if p_role in ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN') then
    update public.bars set owner_id = null where owner_id = p_user;
    update public.bar_staff set revoked_at = now() where user_id = p_user and revoked_at is null;
    get diagnostics v_detached = row_count;
  end if;

  update public.users set role = p_role where id = p_user;
  perform public.admin_audit(p_actor, 'user.role', 'users', p_user, jsonb_build_object('role', old_role),
    jsonb_build_object('role', p_role, 'bars_detached', v_detached));
  return jsonb_build_object('id', p_user, 'role', p_role, 'bars_detached', v_detached);
end $$;

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
  if p_role in ('ADMIN', 'SUPER_ADMIN') then perform public.super_admin_assert(p_actor); end if;
  select * into u from public.users where id = p_user for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;

  -- สิทธิ์ที่ต้องมีร้าน: MERCHANT = เจ้าของ/ผู้จัดการ · STAFF = พนักงาน
  if (p_bar is null) <> (p_bar_role is null)
     or (p_role = 'MERCHANT' and p_bar_role is distinct from 'OWNER' and p_bar_role is distinct from 'MANAGER')
     or (p_role = 'STAFF' and p_bar_role is distinct from 'STAFF')
     or (p_role in ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN') and p_bar is not null) then
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

create or replace function public.app_delete_account(p_actor uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare u public.users;
begin
  u := public.app_assert_user(p_actor);
  if u.role = 'SUPER_ADMIN' then perform public.assert_keeps_super_admin(p_actor); end if;
  if exists (select 1 from public.bookings where user_id = p_actor
             and status in ('AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')) then
    raise exception 'HAS_ACTIVE_BOOKINGS' using errcode = 'P0001';
  end if;
  update public.users set deleted_at = now() where id = p_actor;
  update public.bar_staff set revoked_at = now() where user_id = p_actor and revoked_at is null;
  delete from public.favorites where user_id = p_actor;
  perform public.app_audit(p_actor, 'user.delete_request', 'users', p_actor, null);
  return jsonb_build_object('id', p_actor, 'deleted', true);
end $$;

-- ฟังก์ชันเขียน: service_role (NestJS) เท่านั้น
revoke execute on function public.super_admin_assert(uuid) from public, anon, authenticated;
revoke execute on function public.assert_keeps_super_admin(uuid) from public, anon, authenticated;
grant execute on function public.super_admin_assert(uuid) to service_role;
grant execute on function public.assert_keeps_super_admin(uuid) to service_role;
