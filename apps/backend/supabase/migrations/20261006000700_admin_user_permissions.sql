-- NightOut · สิทธิ์แก้ไข/ลบบัญชีใน Backoffice
set search_path = public, extensions;

create or replace function public.admin_update_user_account(p_actor uuid, p_user uuid, p jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  actor_role public.user_role;
  before_row public.users;
  after_row public.users;
begin
  select role into actor_role from public.users where id = p_actor and deleted_at is null;
  if actor_role is null then raise exception 'NOT_ADMIN' using errcode = '42501'; end if;
  if actor_role <> 'SUPER_ADMIN' and p_actor <> p_user then
    raise exception 'SELF_ONLY' using errcode = '42501';
  end if;
  select * into before_row from public.users where id = p_user and deleted_at is null for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  if p ? 'display_name' then update public.users set display_name = btrim(p ->> 'display_name') where id = p_user; end if;
  if p ? 'phone_e164' then update public.users set phone_e164 = nullif(btrim(p ->> 'phone_e164'), '') where id = p_user; end if;
  if p ? 'email' then update public.users set email = lower(btrim(p ->> 'email'))::extensions.citext where id = p_user; end if;
  select * into after_row from public.users where id = p_user;
  perform public.admin_audit(p_actor, 'user.update', 'users', p_user, to_jsonb(before_row), to_jsonb(after_row));
  return jsonb_build_object('id', after_row.id, 'email', after_row.email, 'display_name', after_row.display_name, 'phone_e164', after_row.phone_e164);
end $$;

create or replace function public.admin_delete_user(p_actor uuid, p_user uuid)
returns jsonb language plpgsql set search_path = '' as $$
declare before_row public.users;
begin
  perform public.super_admin_assert(p_actor);
  select * into before_row from public.users where id = p_user and deleted_at is null for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  if before_row.role = 'SUPER_ADMIN' then perform public.assert_keeps_super_admin(p_user); end if;
  update public.users set deleted_at = now() where id = p_user;
  update public.bar_staff set revoked_at = now() where user_id = p_user and revoked_at is null;
  update public.bars set owner_id = null where owner_id = p_user;
  perform public.admin_audit(p_actor, 'user.delete', 'users', p_user, to_jsonb(before_row), jsonb_build_object('deleted', true));
  return jsonb_build_object('id', p_user, 'deleted', true);
end $$;

revoke all on function public.admin_update_user_account(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_update_user_account(uuid, uuid, jsonb) to service_role;
revoke all on function public.admin_delete_user(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_user(uuid, uuid) to service_role;
