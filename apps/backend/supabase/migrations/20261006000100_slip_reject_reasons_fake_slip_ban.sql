-- =====================================================================
-- NightOut · แอดมินปฏิเสธสลิปมัดจำพร้อม "เหตุผล" (dropdown) + ระบบติดธงสลิปปลอม → แบน
--   - deposits.reject_code: FAKE_SLIP | AMOUNT_MISMATCH | WRONG_ACCOUNT | UNREADABLE | DUPLICATE | OTHER
--   - ปฏิเสธด้วย FAKE_SLIP → บันทึก user_flags (ผูกผู้ใช้ + เบอร์ของการจองนั้น)
--     ธงที่ยังไม่ถูกล้างครบ 2 ครั้ง (นับทั้งของบัญชีนี้และเบอร์นี้) → แบนบัญชี (users.banned_at)
--     + แบนทุกเบอร์ที่บัญชีนี้เคยใช้ (banned_phones) → เบอร์นั้นจองไม่ได้อีก แม้สมัครบัญชีใหม่
--   - admin_unban_user: ปลดแบน + ล้างธง (กรณีแอดมินกดผิด)
--   - แก้บั๊ก admin_review_deposit: ลูกค้ายกเลิกระหว่างรอตรวจ (มัดจำเป็น SUBMITTED + REFUND_PENDING)
--       อนุมัติ → เดิมทับเป็น HELD (เงินที่ต้องคืนหาย) · ตอนนี้คง REFUND_PENDING ไว้ และไม่ยืนยันการจองที่ยกเลิกแล้ว
--       ปฏิเสธ → เดิมชน CHECK deposits_settlement_needs_verified · ตอนนี้ settlement กลับเป็น NONE (ไม่มีเงินให้คืน)
-- =====================================================================
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- 1. ตาราง / คอลัมน์
-- ---------------------------------------------------------------------
alter table public.deposits
  add column if not exists reject_code text
    constraint deposits_reject_code_check
    check (reject_code in ('FAKE_SLIP', 'AMOUNT_MISMATCH', 'WRONG_ACCOUNT', 'UNREADABLE', 'DUPLICATE', 'OTHER'));

alter table public.users
  add column if not exists banned_at  timestamptz,
  add column if not exists ban_reason text;

-- ธงความเสี่ยงของผู้ใช้ (ตอนนี้มีแค่สลิปปลอม) · เก็บเบอร์ไว้ในแถวเอง เพราะ retention ล้าง bookings.contact_phone
create table if not exists public.user_flags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id),
  kind        text not null check (kind in ('FAKE_SLIP')),
  deposit_id  uuid unique references public.deposits(id),
  booking_id  uuid references public.bookings(id),
  phone_e164  text check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  note        text,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  cleared_at  timestamptz,                               -- แอดมินปลดแบน → ธงไม่นับแล้ว
  cleared_by  uuid references public.users(id)
);
create index if not exists user_flags_user_id_fk    on public.user_flags (user_id);
create index if not exists user_flags_booking_id_fk on public.user_flags (booking_id);
create index if not exists user_flags_created_by_fk on public.user_flags (created_by);
create index if not exists user_flags_cleared_by_fk on public.user_flags (cleared_by);
create index if not exists user_flags_phone_active  on public.user_flags (phone_e164) where cleared_at is null;

-- เบอร์ที่ห้ามจอง
create table if not exists public.banned_phones (
  phone_e164  text primary key check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  user_id     uuid references public.users(id),          -- บัญชีที่ทำให้เบอร์นี้โดนแบน (ปลดแบนบัญชี = ปลดเบอร์ด้วย)
  reason      text not null,
  banned_by   uuid references public.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists banned_phones_user_id_fk   on public.banned_phones (user_id);
create index if not exists banned_phones_banned_by_fk on public.banned_phones (banned_by);

alter table public.user_flags    enable row level security;
alter table public.banned_phones enable row level security;
drop policy if exists admin_read on public.user_flags;
create policy admin_read on public.user_flags for select to authenticated using (public.is_admin());
drop policy if exists admin_read on public.banned_phones;
create policy admin_read on public.banned_phones for select to authenticated using (public.is_admin());
revoke insert, update, delete, truncate on public.user_flags, public.banned_phones from anon, authenticated;
revoke select on public.user_flags, public.banned_phones from anon;

-- ---------------------------------------------------------------------
-- 2. helper
-- ---------------------------------------------------------------------
-- ข้อความเหตุผลที่ลูกค้าเห็น (หน้าโอนมัดจำ) — ตรงกับ DEPOSIT_REJECT_REASONS ใน @nightout/types
create or replace function public.deposit_reject_label(p_code text) returns text
language sql immutable set search_path = '' as $$
  select case p_code
    when 'FAKE_SLIP'       then 'สลิปไม่ผ่านการตรวจสอบ (สลิปปลอม/ตัดต่อ)'
    when 'AMOUNT_MISMATCH' then 'ยอดเงินในสลิปไม่ตรงกับมัดจำ'
    when 'WRONG_ACCOUNT'   then 'โอนเข้าบัญชีไม่ถูกต้อง'
    when 'UNREADABLE'      then 'สลิปไม่ชัด อ่านข้อมูลไม่ได้'
    when 'DUPLICATE'       then 'สลิปนี้เคยใช้ไปแล้ว'
    when 'OTHER'           then 'อื่น ๆ'
  end
$$;

-- บัญชี/เบอร์นี้ถูกแบนหรือไม่ (ใช้ตอนจอง + ส่งสลิป)
create or replace function public.booking_ban_check(p_user uuid, p_phone text default null) returns void
language plpgsql stable set search_path = '' as $$
begin
  if exists (select 1 from public.users where id = p_user and banned_at is not null) then
    raise exception 'ACCOUNT_BANNED' using errcode = '42501';
  end if;
  if p_phone is not null and exists (select 1 from public.banned_phones where phone_e164 = p_phone) then
    raise exception 'PHONE_BANNED' using errcode = '42501';
  end if;
end $$;

-- ติดธงสลิปปลอม → ครบ 2 ครั้ง แบนบัญชี + ทุกเบอร์ที่บัญชีนี้เคยใช้
create or replace function public.apply_fake_slip_flag(p_actor uuid, p_deposit uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare
  bk public.bookings; u public.users; v_phone text; v_count integer; v_banned boolean := false;
begin
  select b.* into bk from public.bookings b join public.deposits d on d.booking_id = b.id where d.id = p_deposit;
  select * into u from public.users where id = bk.user_id for update;
  v_phone := coalesce(bk.contact_phone, u.phone_e164);
  insert into public.user_flags (user_id, kind, deposit_id, booking_id, phone_e164, created_by)
  values (bk.user_id, 'FAKE_SLIP', p_deposit, bk.id, v_phone, p_actor)
  on conflict (deposit_id) do nothing;

  select count(*) into v_count from public.user_flags f
   where f.kind = 'FAKE_SLIP' and f.cleared_at is null
     and (f.user_id = bk.user_id or (v_phone is not null and f.phone_e164 = v_phone));

  if v_count >= 2 then
    if u.banned_at is null then
      update public.users set banned_at = now(), ban_reason = 'ส่งสลิปปลอม ' || v_count || ' ครั้ง' where id = u.id;
      v_banned := true;
      perform public.app_notify(u.id, 'ACCOUNT_BANNED', 'บัญชีของคุณถูกระงับการจอง',
        'ตรวจพบสลิปมัดจำไม่ถูกต้องซ้ำ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อ NightOut', null);
      perform public.admin_audit(p_actor, 'user.ban', 'users', u.id,
        jsonb_build_object('banned_at', null), jsonb_build_object('reason', 'FAKE_SLIP', 'flags', v_count));
    end if;
    insert into public.banned_phones (phone_e164, user_id, reason, banned_by)
    select distinct p, u.id, 'ส่งสลิปปลอม ' || v_count || ' ครั้ง', p_actor
    from (
      select u.phone_e164 as p
      union select v_phone
      union select b.contact_phone from public.bookings b where b.user_id = u.id
      union select f.phone_e164 from public.user_flags f where f.user_id = u.id and f.cleared_at is null
    ) x where p is not null
    on conflict (phone_e164) do nothing;
  end if;
  return jsonb_build_object('fake_slip_count', v_count, 'banned', v_banned or u.banned_at is not null);
end $$;

-- ---------------------------------------------------------------------
-- 3. ตรวจสลิป (แทนของ …001600 — เพิ่ม p_reason_code)
-- ---------------------------------------------------------------------
drop function if exists public.admin_review_deposit(uuid, uuid, boolean, text);
create or replace function public.admin_review_deposit(p_actor uuid, p_deposit uuid, p_approve boolean,
                                            p_reason text default null, p_reason_code text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  d public.deposits; bk public.bookings; v_reason text; v_flag jsonb;
begin
  perform public.admin_assert(p_actor);
  select * into d from public.deposits where id = p_deposit for update;
  if not found then raise exception 'DEPOSIT_NOT_FOUND' using errcode = 'P0002'; end if;
  if d.status <> 'SUBMITTED' then raise exception 'DEPOSIT_ALREADY_REVIEWED' using errcode = 'P0001'; end if;
  select * into bk from public.bookings where id = d.booking_id for update;

  if p_approve then
    -- ลูกค้ายกเลิกไปแล้วระหว่างรอตรวจ (REFUND_PENDING) → เงินเข้าจริงแต่ต้องคืน ไม่ใช่ถือไว้
    update public.deposits
       set status = 'VERIFIED',
           settlement = case when d.settlement = 'REFUND_PENDING' then 'REFUND_PENDING'::public.deposit_settlement
                             else 'HELD'::public.deposit_settlement end,
           verified_by = p_actor, verified_at = now(), settled_at = now()
     where id = p_deposit;
    if bk.status = 'DEPOSIT_SUBMITTED' then
      perform set_config('app.reason', 'deposit verified', true);
      update public.bookings set status = 'CONFIRMED' where id = bk.id;
    end if;
  else
    if p_reason_code is null then raise exception 'REJECT_REASON_REQUIRED' using errcode = '22023'; end if;
    if public.deposit_reject_label(p_reason_code) is null then
      raise exception 'INVALID_REJECT_REASON' using errcode = '22023';
    end if;
    if p_reason_code = 'OTHER' and nullif(btrim(p_reason), '') is null then
      raise exception 'REJECT_REASON_REQUIRED' using errcode = '22023';
    end if;
    v_reason := case when p_reason_code = 'OTHER' then btrim(p_reason)
                     else public.deposit_reject_label(p_reason_code) || coalesce(' — ' || nullif(btrim(p_reason), ''), '') end;
    update public.deposits
       set status = 'REJECTED', reject_code = p_reason_code, reject_reason = v_reason,
           settlement = 'NONE', settled_at = case when d.settlement <> 'NONE' then now() else settled_at end,
           verified_by = p_actor, verified_at = now()
     where id = p_deposit;
    if bk.status = 'DEPOSIT_SUBMITTED' then
      perform set_config('app.reason', v_reason, true);
      update public.bookings set status = 'AWAITING_DEPOSIT' where id = bk.id;
    end if;
    if p_reason_code = 'FAKE_SLIP' then
      v_flag := public.apply_fake_slip_flag(p_actor, p_deposit);
    end if;
  end if;

  perform public.admin_audit(p_actor, case when p_approve then 'deposit.verify' else 'deposit.reject' end, 'deposits', p_deposit,
    jsonb_build_object('status', d.status, 'settlement', d.settlement),
    jsonb_build_object('approve', p_approve, 'reason_code', p_reason_code, 'reason', v_reason) || coalesce(v_flag, '{}'::jsonb));
  return jsonb_build_object('id', p_deposit, 'status', case when p_approve then 'VERIFIED' else 'REJECTED' end,
                            'reject_code', case when p_approve then null else p_reason_code end)
         || coalesce(v_flag, '{}'::jsonb);
end $$;

-- ปลดแบน (แอดมินกดผิด / ลูกค้าชี้แจงแล้ว) — ล้างธงที่นับอยู่ด้วย ไม่งั้นสลิปเสียครั้งหน้าจะโดนแบนทันที
create or replace function public.admin_unban_user(p_actor uuid, p_user uuid, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare u public.users; v_phones integer; v_flags integer;
begin
  perform public.admin_assert(p_actor);
  select * into u from public.users where id = p_user for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  update public.users set banned_at = null, ban_reason = null where id = p_user;
  delete from public.banned_phones where user_id = p_user;
  get diagnostics v_phones = row_count;
  update public.user_flags set cleared_at = now(), cleared_by = p_actor
   where user_id = p_user and cleared_at is null;
  get diagnostics v_flags = row_count;
  perform public.admin_audit(p_actor, 'user.unban', 'users', p_user,
    jsonb_build_object('banned_at', u.banned_at, 'ban_reason', u.ban_reason),
    jsonb_build_object('reason', nullif(btrim(p_reason), ''), 'phones_unbanned', v_phones, 'flags_cleared', v_flags));
  if u.banned_at is not null then
    perform public.app_notify(p_user, 'ACCOUNT_UNBANNED', 'บัญชีของคุณจองโต๊ะได้ตามปกติแล้ว', 'ขอบคุณที่ชี้แจงกับ NightOut', null);
  end if;
  return jsonb_build_object('id', p_user, 'banned', false, 'phones_unbanned', v_phones, 'flags_cleared', v_flags);
end $$;

-- ส่งสลิป: บัญชีที่ถูกแบนส่งไม่ได้ (แทนของ …001700 — เพิ่มบรรทัดตรวจแบน)
create or replace function public.app_submit_deposit(p_actor uuid, p_booking uuid, p_slip_path text, p_slip_ref text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare u public.users; bk public.bookings; v_bar text; v_id uuid;
begin
  u := public.app_assert_user(p_actor);
  perform public.booking_ban_check(p_actor);
  select * into bk from public.bookings where id = p_booking for update;
  if not found or bk.user_id <> p_actor then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  if bk.status <> 'AWAITING_DEPOSIT' then raise exception 'BOOKING_NOT_AWAITING_DEPOSIT' using errcode = 'P0001'; end if;
  if bk.deposit_required <= 0 then raise exception 'NO_DEPOSIT_REQUIRED' using errcode = 'P0001'; end if;
  if p_slip_path is null or split_part(p_slip_path, '/', 1) <> p_actor::text then
    raise exception 'INVALID_SLIP_PATH' using errcode = '22023';
  end if;
  begin
    insert into public.deposits (booking_id, bar_id, amount, slip_path, slip_ref)
    values (bk.id, bk.bar_id, bk.deposit_required, p_slip_path, nullif(trim(p_slip_ref), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'SLIP_ALREADY_USED' using errcode = 'P0001';
  end;
  perform set_config('app.reason', 'deposit submitted', true);
  update public.bookings set status = 'DEPOSIT_SUBMITTED' where id = bk.id;
  select name into v_bar from public.bars where id = bk.bar_id;
  perform public.app_notify_admins('DEPOSIT_SUBMITTED', 'มีสลิปมัดจำรอตรวจ',
    v_bar || ' · ' || u.display_name || ' · ' || bk.deposit_required || ' บาท', '/deposits', bk.id, bk.bar_id);
  perform public.app_notify_team(bk.bar_id, 'DEPOSIT_SUBMITTED', 'ลูกค้าโอนมัดจำแล้ว (รอ NightOut ตรวจ)',
    u.display_name || ' · ' || bk.code, '/merchant/bookings', bk.id);
  return jsonb_build_object('id', v_id, 'booking_id', bk.id, 'status', 'SUBMITTED');
end $$;

-- ---------------------------------------------------------------------
-- 4. view ของ Backoffice (เพิ่มคอลัมน์ท้ายสุด — create or replace view ต่อท้ายได้)
-- ---------------------------------------------------------------------
create or replace view public.admin_users with (security_invoker = true) as
select
  u.id, u.email, u.display_name, u.role, u.created_at, u.deleted_at,
  coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'name', b.name, 'role', s.role)
                             order by b.name)
            from public.bar_staff s join public.bars b on b.id = s.bar_id
            where s.user_id = u.id and s.revoked_at is null), '[]'::jsonb) as bars,
  u.phone_e164, u.banned_at, u.ban_reason,
  (select count(*) from public.user_flags f where f.user_id = u.id and f.kind = 'FAKE_SLIP' and f.cleared_at is null)::integer
    as fake_slip_count,
  coalesce((select jsonb_agg(p.phone_e164 order by p.phone_e164) from public.banned_phones p where p.user_id = u.id), '[]'::jsonb)
    as banned_phones
from public.users u
where public.is_admin();

create or replace view public.admin_deposits with (security_invoker = true) as
select
  d.id, d.amount, d.slip_path, d.slip_ref, d.status, d.reject_reason, d.settlement,
  d.verified_at, d.settled_at, d.created_at,
  jsonb_build_object('id', bk.id, 'code', bk.code, 'status', bk.status, 'booking_datetime', bk.booking_datetime, 'pax', bk.pax) as booking,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  case when u.id is null then null else jsonb_build_object('id', u.id, 'display_name', u.display_name, 'email', u.email) end as customer,
  (select jsonb_build_object('bank_code', pa.bank_code, 'account_name', pa.account_name, 'account_no_last4', pa.account_no_last4)
   from public.bar_payout_accounts pa where pa.bar_id = b.id and pa.is_default) as payout_account,
  d.reject_code,
  -- ประวัติสลิปปลอมของลูกค้า (ให้แอดมินเห็นก่อนตัดสิน)
  (select count(*) from public.user_flags f where f.user_id = u.id and f.kind = 'FAKE_SLIP' and f.cleared_at is null)::integer
    as customer_fake_slip_count,
  (u.banned_at is not null) as customer_banned
from public.deposits d
join public.bookings bk on bk.id = d.booking_id
join public.bars     b  on b.id  = d.bar_id
left join public.users u on u.id = bk.user_id
where public.is_admin();

-- ---------------------------------------------------------------------
-- 5. สิทธิ์
-- ---------------------------------------------------------------------
revoke all on function public.admin_review_deposit(uuid, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.admin_review_deposit(uuid, uuid, boolean, text, text) to service_role;
revoke all on function public.admin_unban_user(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_unban_user(uuid, uuid, text) to service_role;
revoke all on function public.apply_fake_slip_flag(uuid, uuid) from public, anon, authenticated;
revoke all on function public.booking_ban_check(uuid, text) from public, anon, authenticated;
revoke all on function public.app_submit_deposit(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.app_submit_deposit(uuid, uuid, text, text) to service_role;
