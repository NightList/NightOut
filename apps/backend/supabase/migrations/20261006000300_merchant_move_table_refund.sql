-- =====================================================================
-- NightOut · Dashboard ร้าน — ให้ทีมร้าน (ทุกบทบาท รวม PR/STAFF) จัดการเคสหน้างาน
--   1) ย้ายโต๊ะ: app_team_move_booking — เปลี่ยนโซน/โต๊ะของการจองที่ยังถือโต๊ะอยู่
--        ช่วงเวลาเดิม · โต๊ะต้องว่าง (exclusion constraint) · ย้ายข้ามโซนต้องมีที่ว่างพอ · แจ้งลูกค้า + audit
--      bar_booking_table_options: รายการโซน/โต๊ะพร้อมสถานะว่าง ณ เวลาของการจองนั้น (ให้หน้า "ย้ายโต๊ะ" เลือก)
--   2) ยืนยันการคืนเงิน: app_team_refund_deposit — ร้านอนุมัติให้คืนมัดจำลูกค้า
--        การจองยังไม่เริ่ม (CONFIRMED) → ยกเลิกฝั่งร้าน (trigger ตั้ง REFUND_PENDING ให้)
--        เช็กอิน/ปิดโต๊ะ/ไม่มา แล้ว แต่ยังไม่โอนให้ร้าน (PAYOUT_PENDING) → ตั้ง REFUND_PENDING
--        แอดมินเห็นในแท็บ "รอคืนลูกค้า" แล้วโอนคืน (admin_settle_deposit REFUNDED) เหมือนเดิม
-- =====================================================================
set search_path = public, extensions;

alter table public.deposits
  add column if not exists refund_reason       text check (char_length(refund_reason) <= 300),
  add column if not exists refund_requested_by uuid references public.users(id),
  add column if not exists refund_requested_at timestamptz;
create index if not exists deposits_refund_requested_by_fk on public.deposits (refund_requested_by);

-- ---------------------------------------------------------------------
-- 1. ย้ายโต๊ะ
-- ---------------------------------------------------------------------
create or replace function public.bar_booking_table_options(p_booking uuid)
returns table (zone_id uuid, zone_name text, table_id uuid, table_name text, seats integer,
               available boolean, is_current boolean, zone_remaining_pax integer)
language sql stable security definer set search_path = '' as $$
  with bk as (
    select b.* from public.bookings b where b.id = p_booking and public.is_bar_member(b.bar_id)
  ), z as (
    select z.* from public.table_zones z join bk on z.bar_id = bk.bar_id where z.active
  ), rem as (
    select z.id,
      z.capacity_pax - coalesce((select sum(x.pax) from public.bookings x
                                 where x.zone_id = z.id and x.id <> bk.id and x.reserved_period && bk.reserved_period
                                   and x.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')), 0)
        as remaining
    from z cross join bk
  )
  -- โต๊ะทุกตัว
  select z.id, z.name, t.id, t.name, t.seats::integer,
         not exists (select 1 from public.bookings x
                      where x.table_id = t.id and x.id <> bk.id and x.reserved_period && bk.reserved_period
                        and x.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN'))
           and (z.id = bk.zone_id or rem.remaining >= bk.pax),
         (t.id = bk.table_id), greatest(rem.remaining, 0)::integer
  from z cross join bk join rem on rem.id = z.id
  join public.tables t on t.zone_id = z.id and t.active
  union all
  -- โซนที่ไม่มีโต๊ะ (จองแบบไม่ระบุโต๊ะ)
  select z.id, z.name, null, null, null,
         (z.id = bk.zone_id or rem.remaining >= bk.pax) and not (z.id = bk.zone_id and bk.table_id is null),
         (z.id = bk.zone_id and bk.table_id is null), greatest(rem.remaining, 0)::integer
  from z cross join bk join rem on rem.id = z.id
  where not exists (select 1 from public.tables t where t.zone_id = z.id and t.active)
     or z.allow_zone_only_booking
  order by 2, 4 nulls first
$$;
grant execute on function public.bar_booking_table_options(uuid) to authenticated;
revoke all on function public.bar_booking_table_options(uuid) from anon;

create or replace function public.app_team_move_booking(p_actor uuid, p_booking uuid, p_zone uuid, p_table uuid default null,
                                                        p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  u public.users; bk public.bookings; z public.table_zones; t public.tables;
  v_from_zone text; v_from_table text; v_has_tables boolean;
begin
  u := public.app_assert_user(p_actor);
  select * into bk from public.bookings where id = p_booking for update;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.app_team_role(p_actor, bk.bar_id);
  if bk.status not in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN') then
    raise exception 'BOOKING_NOT_MOVABLE' using errcode = 'P0001';
  end if;

  select * into z from public.table_zones where id = p_zone and bar_id = bk.bar_id and active;
  if not found then raise exception 'ZONE_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_table is not null then
    select * into t from public.tables where id = p_table and zone_id = z.id and active;
    if not found then raise exception 'TABLE_NOT_FOUND' using errcode = 'P0002'; end if;
  else
    select exists (select 1 from public.tables x where x.zone_id = z.id and x.active) into v_has_tables;
    if v_has_tables and not z.allow_zone_only_booking then raise exception 'TABLE_REQUIRED' using errcode = '22023'; end if;
  end if;
  if z.id = bk.zone_id and p_table is not distinct from bk.table_id then
    raise exception 'BOOKING_SAME_TABLE' using errcode = '22023';
  end if;
  -- ข้ามโซน: ล็อกโซนปลายทาง + เช็กความจุ (ไม่นับการจองนี้เอง)
  if z.id <> bk.zone_id and public.zone_remaining_pax(z.id, bk.reserved_from, bk.reserved_until, bk.id) < bk.pax then
    raise exception 'ZONE_FULL' using errcode = 'P0001';
  end if;

  select name into v_from_zone from public.table_zones where id = bk.zone_id;
  select name into v_from_table from public.tables where id = bk.table_id;
  begin
    update public.bookings set zone_id = z.id, table_id = p_table where id = bk.id;
  exception when exclusion_violation then
    raise exception 'TABLE_TAKEN' using errcode = 'P0001';
  end;
  if bk.status = 'CHECKED_IN' then
    update public.checkins set table_id = p_table where booking_id = bk.id;
  end if;

  perform public.app_audit(p_actor, 'booking.move', 'bookings', bk.id, jsonb_build_object(
    'from_zone', v_from_zone, 'from_table', v_from_table, 'to_zone', z.name, 'to_table', t.name,
    'reason', nullif(btrim(p_reason), '')));
  perform public.app_notify(bk.user_id, 'BOOKING_MOVED', 'ร้านย้ายโต๊ะให้คุณ',
    (select name from public.bars where id = bk.bar_id) || ' · ' || z.name || coalesce(' · โต๊ะ ' || t.name, '')
      || ' · ' || public.app_fmt(bk.booking_datetime),
    '/bookings/' || bk.id, bk.id, bk.bar_id);
  return jsonb_build_object('id', bk.id, 'zone_id', z.id, 'zone_name', z.name, 'table_id', p_table, 'table_name', t.name);
end $$;

-- ---------------------------------------------------------------------
-- 2. ยืนยันการคืนเงิน (ร้านอนุมัติ → NightOut โอนคืน)
-- ---------------------------------------------------------------------
create or replace function public.app_team_refund_deposit(p_actor uuid, p_booking uuid, p_reason text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  u public.users; bk public.bookings; d public.deposits; v_reason text := nullif(btrim(p_reason), ''); v_bar text;
begin
  u := public.app_assert_user(p_actor);
  if v_reason is null or char_length(v_reason) < 3 then raise exception 'REFUND_REASON_REQUIRED' using errcode = '22023'; end if;
  select * into bk from public.bookings where id = p_booking for update;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.app_team_role(p_actor, bk.bar_id);

  select * into d from public.deposits
   where booking_id = bk.id and status = 'VERIFIED' and settlement in ('HELD', 'PAYOUT_PENDING') for update;
  if not found then
    if exists (select 1 from public.deposits where booking_id = bk.id and settlement in ('REFUND_PENDING', 'REFUNDED')) then
      raise exception 'REFUND_ALREADY_REQUESTED' using errcode = 'P0001';
    end if;
    raise exception 'NO_REFUNDABLE_DEPOSIT' using errcode = 'P0001';
  end if;

  perform set_config('app.reason', 'refund approved by bar: ' || v_reason, true);
  if bk.status in ('PENDING', 'CONFIRMED') then
    -- ยังไม่ได้ใช้โต๊ะ → ยกเลิกฝั่งร้าน (ปล่อยโต๊ะ) · trigger ตั้ง REFUND_PENDING + แจ้งลูกค้า
    update public.bookings set status = 'CANCELLED_BY_MERCHANT', cancel_reason = v_reason where id = bk.id;
  end if;
  update public.deposits
     set settlement = 'REFUND_PENDING', settled_at = now(),
         refund_reason = v_reason, refund_requested_by = p_actor, refund_requested_at = now()
   where id = d.id;

  select name into v_bar from public.bars where id = bk.bar_id;
  perform public.app_notify(bk.user_id, 'DEPOSIT_REFUND_APPROVED', 'ร้านอนุมัติคืนมัดจำให้คุณแล้ว',
    v_bar || ' · ' || d.amount || ' บาท · NightOut จะโอนคืนให้เร็วที่สุด', '/bookings/' || bk.id, bk.id, bk.bar_id);
  perform public.app_notify_admins('DEPOSIT_REFUND_PENDING', 'ร้านอนุมัติคืนมัดจำ — รอโอนคืนลูกค้า',
    v_bar || ' · ' || bk.code || ' · ' || d.amount || ' บาท · ' || v_reason, '/deposits', bk.id, bk.bar_id);
  perform public.app_audit(p_actor, 'deposit.refund_request', 'deposits', d.id, jsonb_build_object(
    'booking_id', bk.id, 'from_settlement', d.settlement, 'booking_status', bk.status, 'reason', v_reason));
  return jsonb_build_object('id', d.id, 'booking_id', bk.id, 'settlement', 'REFUND_PENDING', 'amount', d.amount,
                            'booking_status', (select status from public.bookings where id = bk.id));
end $$;

-- สรุปมัดจำใน booking_detail: เดิมเป็น security invoker → ทีมร้านอ่านตาราง deposits ไม่ได้ (RLS: เจ้าของการจองเท่านั้น)
-- Dashboard ร้านจึงเห็น "ยังไม่ได้โอนมัดจำ" เสมอ และไม่รู้ว่าคืนเงินได้ไหม → อ่านแทนแบบ security definer
-- เฉพาะเจ้าของการจอง / ทีมร้านนั้น / แอดมิน · ไม่มี slip_path (ร้านยังห้ามเห็นสลิป)
create or replace function public.booking_deposit_summary(p_booking uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when d.id is null then null else jsonb_build_object(
    'id', d.id, 'amount', d.amount, 'status', d.status, 'reject_reason', d.reject_reason,
    'settlement', d.settlement, 'verified_at', d.verified_at, 'created_at', d.created_at,
    'refund_reason', d.refund_reason) end
  from public.bookings b
  left join lateral (
    select * from public.deposits where booking_id = b.id order by created_at desc limit 1) d on true
  where b.id = p_booking
    and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id) or public.is_admin())
$$;
revoke all on function public.booking_deposit_summary(uuid) from public, anon;
grant execute on function public.booking_deposit_summary(uuid) to authenticated, service_role;

-- Backoffice: เห็นว่ารอคืนเพราะอะไร ใครในร้านอนุมัติ
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
  (select count(*) from public.user_flags f where f.user_id = u.id and f.kind = 'FAKE_SLIP' and f.cleared_at is null)::integer
    as customer_fake_slip_count,
  (u.banned_at is not null) as customer_banned,
  d.refund_reason, d.refund_requested_at,
  (select x.display_name from public.users x where x.id = d.refund_requested_by) as refund_requested_by_name
from public.deposits d
join public.bookings bk on bk.id = d.booking_id
join public.bars     b  on b.id  = d.bar_id
left join public.users u on u.id = bk.user_id
where public.is_admin();

revoke all on function public.app_team_move_booking(uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.app_team_move_booking(uuid, uuid, uuid, uuid, text) to service_role;
revoke all on function public.app_team_refund_deposit(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.app_team_refund_deposit(uuid, uuid, text) to service_role;
