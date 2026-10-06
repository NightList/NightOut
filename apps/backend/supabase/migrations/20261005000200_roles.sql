-- =====================================================================
-- NightOut · ตาราง roles — ที่เดียวที่บอกว่า role ไหนเข้า Backoffice ได้
-- users.role ยังเป็น enum user_role และต้องมีแถวในตารางนี้ (FK)
-- เพิ่ม role ที่เข้าหลังบ้านได้: alter type … add value แล้ว insert แถวพร้อม can_enter_backoffice = true
-- ประตู is_admin / admin_assert / สลิป storage / แจ้งเตือนแอดมิน อ่านธงนี้ ไม่ได้เทียบ 'ADMIN' ตรง ๆ
-- =====================================================================
set search_path = public, extensions;

create table public.roles (
  code                    public.user_role primary key,
  label_th                text not null check (char_length(label_th) between 1 and 40),
  can_enter_backoffice    boolean not null default false,
  sort_order              smallint not null,
  created_at              timestamptz not null default now()
);

insert into public.roles (code, label_th, can_enter_backoffice, sort_order) values
  ('CUSTOMER', 'ลูกค้า', false, 10),
  ('STAFF', 'พนักงานร้าน', false, 20),
  ('MERCHANT', 'ร้านค้า', false, 30),
  ('ADMIN', 'แอดมิน', true, 40);

alter table public.users
  add constraint users_role_fkey foreign key (role) references public.roles (code);
create index if not exists users_role_fk on public.users (role);

alter table public.roles enable row level security;
revoke all on table public.roles from anon, authenticated;
grant select on table public.roles to authenticated;
create policy roles_read on public.roles for select to authenticated using (true);

-- ธงจากตาราง roles (ใช้ใน storage policy ซึ่งไม่มี MFA)
create or replace function public.role_enters_backoffice(p_role public.user_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select r.can_enter_backoffice from public.roles r where r.code = p_role), false)
$$;
revoke all on function public.role_enters_backoffice(public.user_role) from public, anon;
grant execute on function public.role_enters_backoffice(public.user_role) to authenticated, service_role;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (
       select 1
       from public.users u
       join public.roles r on r.code = u.role
       where u.id = auth.uid() and u.deleted_at is null and r.can_enter_backoffice
     )
$$;

create or replace function public.admin_assert(p_actor uuid) returns void
language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.users u
    join public.roles r on r.code = u.role
    where u.id = p_actor and u.deleted_at is null and r.can_enter_backoffice
  ) then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
  perform set_config('app.user_id', p_actor::text, true);
end $$;

create or replace function public.admin_audit(p_actor uuid, p_action text, p_entity text, p_id uuid, p_before jsonb, p_after jsonb)
returns void language sql set search_path = '' as $$
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before, after)
  values (p_actor, (select u.role from public.users u where u.id = p_actor), p_action, p_entity, p_id, p_before, p_after)
$$;

create or replace function public.app_notify_admins(p_event text, p_title text, p_body text, p_link text, p_booking uuid default null, p_bar uuid default null)
returns void language sql set search_path = '' as $$
  select public.app_notify(u.id, p_event, p_title, p_body, p_link, p_booking, p_bar)
  from public.users u
  join public.roles r on r.code = u.role
  where u.deleted_at is null and r.can_enter_backoffice
$$;

drop policy if exists "deposit-slips: owner or admin read" on storage.objects;
create policy "deposit-slips: owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'deposit-slips' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.role_enters_backoffice(public.auth_role())));

drop policy if exists "bar-verifications: team or admin read" on storage.objects;
create policy "bar-verifications: team or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'bar-verifications' and (public.is_bar_member_path((storage.foldername(name))[1]) or public.role_enters_backoffice(public.auth_role())));

drop policy if exists "payout-slips: team or admin read" on storage.objects;
create policy "payout-slips: team or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'payout-slips' and (public.is_bar_member_path((storage.foldername(name))[1]) or public.role_enters_backoffice(public.auth_role())));

drop policy if exists "promo-slips: team or admin read" on storage.objects;
create policy "promo-slips: team or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'promo-slips' and (public.is_bar_member_path((storage.foldername(name))[1]) or public.role_enters_backoffice(public.auth_role())));
