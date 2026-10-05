-- =====================================================================
-- NightOut · Backoffice (แอดมิน)
--  - อ่าน: ADMIN ที่ยืนยัน MFA แล้ว (JWT aal2) อ่านได้ทุกตารางผ่าน RLS + view สำหรับแต่ละหน้า
--  - เขียน: ฟังก์ชัน admin_* เรียกได้เฉพาะ service_role (NestJS) · ทุกฟังก์ชันตรวจว่า actor เป็น ADMIN
--           และบันทึก audit_logs ใน transaction เดียวกัน
-- =====================================================================
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- ใครเป็นแอดมิน (ต้อง role ADMIN ในตาราง users + token ผ่าน MFA แล้ว)
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN' and deleted_at is null)
$$;

-- แอดมินอ่านได้ทุกตาราง (policy นี้ OR กับ policy เดิมของแต่ละตาราง)
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop policy if exists admin_read on public.%I', t);
    execute format('create policy admin_read on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- view ของแต่ละหน้าแอดมิน (security_invoker + where is_admin() → ผู้ไม่ใช่แอดมิน/ยังไม่ผ่าน MFA ได้แถวว่างเสมอ)
-- ---------------------------------------------------------------------
create view public.admin_users with (security_invoker = true) as
select
  u.id, u.email, u.display_name, u.role, u.created_at, u.deleted_at,
  coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'name', b.name, 'role', s.role)
                             order by b.name)
            from public.bar_staff s join public.bars b on b.id = s.bar_id
            where s.user_id = u.id and s.revoked_at is null), '[]'::jsonb) as bars
from public.users u
where public.is_admin();

create view public.admin_bars with (security_invoker = true) as
select
  b.id, b.slug, b.name, b.category, b.status, b.status_reason, b.address, b.created_at, b.approved_at,
  case when d.id is null then null else jsonb_build_object('id', d.id, 'slug', d.slug, 'name_th', d.name_th) end as district,
  case when o.id is null then null else jsonb_build_object('id', o.id, 'email', o.email, 'display_name', o.display_name) end as owner,
  st.current_stars, st.current_tier, coalesce(st.is_new, true) as is_new, st.score, st.rating_avg,
  coalesce(st.rating_count, 0) as rating_count, coalesce(st.checkin_count, 0) as checkin_count,
  st.safety_score, coalesce(st.is_editor_pick, false) as is_editor_pick,
  public.bar_is_promoted(b.id) as is_promoted
from public.bars b
left join public.districts d on d.id = b.district_id
left join public.users     o on o.id = b.owner_id
left join public.bar_stats st on st.bar_id = b.id
where public.is_admin();

create view public.admin_bookings with (security_invoker = true) as
select
  bk.id, bk.code, bk.status, bk.booking_datetime, bk.pax, bk.deposit_required, bk.created_at,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  case when u.id is null then null else jsonb_build_object('id', u.id, 'display_name', u.display_name, 'email', u.email) end as customer,
  z.name as zone_name,
  t.name as table_name,
  coalesce((select jsonb_agg(jsonb_build_object('from_status', h.from_status, 'to_status', h.to_status, 'reason', h.reason,
                                                'created_at', h.created_at,
                                                'changed_by', (select x.display_name from public.users x where x.id = h.changed_by))
                             order by h.created_at, h.id)
            from public.booking_status_history h where h.booking_id = bk.id), '[]'::jsonb) as status_history
from public.bookings bk
join public.bars b on b.id = bk.bar_id
left join public.users       u on u.id = bk.user_id
left join public.table_zones z on z.id = bk.zone_id
left join public.tables      t on t.id = bk.table_id
where public.is_admin();

create view public.admin_deposits with (security_invoker = true) as
select
  d.id, d.amount, d.slip_path, d.slip_ref, d.status, d.reject_reason, d.settlement,
  d.verified_at, d.settled_at, d.created_at,
  jsonb_build_object('id', bk.id, 'code', bk.code, 'status', bk.status, 'booking_datetime', bk.booking_datetime, 'pax', bk.pax) as booking,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  case when u.id is null then null else jsonb_build_object('id', u.id, 'display_name', u.display_name, 'email', u.email) end as customer,
  (select jsonb_build_object('bank_code', pa.bank_code, 'account_name', pa.account_name, 'account_no_last4', pa.account_no_last4)
   from public.bar_payout_accounts pa where pa.bar_id = b.id and pa.is_default) as payout_account
from public.deposits d
join public.bookings bk on bk.id = d.booking_id
join public.bars     b  on b.id  = d.bar_id
left join public.users u on u.id = bk.user_id
where public.is_admin();

create view public.admin_reviews with (security_invoker = true) as
select
  r.id, r.rating, r.comment, r.status, r.created_at,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  u.display_name as author_name,
  (select count(*) from public.review_reports rr where rr.review_id = r.id and rr.status = 'OPEN')::integer as open_report_count,
  coalesce((select jsonb_agg(jsonb_build_object('reason', rr.reason, 'detail', rr.detail, 'status', rr.status, 'created_at', rr.created_at)
                             order by rr.created_at)
            from public.review_reports rr where rr.review_id = r.id), '[]'::jsonb) as reports
from public.reviews r
join public.bars b on b.id = r.bar_id
left join public.users u on u.id = r.user_id
where public.is_admin();

create view public.admin_safety_queue with (security_invoker = true) as
select
  f.id, f.feature_key, sf.name_th, f.value, f.source, f.evidence_path, f.note, f.verified_at, f.updated_at,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  (select count(*) from public.safety_reports sr
    where sr.bar_id = f.bar_id and sr.feature_key = f.feature_key and not sr.is_accurate and sr.status = 'OPEN')::integer as open_inaccurate_reports
from public.bar_safety_features f
join public.bars            b  on b.id  = f.bar_id
join public.safety_features sf on sf.key = f.feature_key
where public.is_admin();

create view public.admin_promoted_listings with (security_invoker = true) as
select
  pl.id, pl.placement, pl.price_paid, pl.status, pl.starts_at, pl.ends_at, pl.reject_reason, pl.created_at,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  jsonb_build_object('id', pp.id, 'name', pp.name, 'duration_days', pp.duration_days) as package,
  (select jsonb_build_object('id', p.id, 'amount', p.amount, 'slip_path', p.slip_path, 'status', p.status, 'created_at', p.created_at)
   from public.promoted_listing_payments p where p.promoted_listing_id = pl.id order by p.created_at desc limit 1) as latest_payment
from public.promoted_listings pl
join public.bars               b  on b.id  = pl.bar_id
join public.promotion_packages pp on pp.id = pl.package_id
where public.is_admin();

create view public.admin_billing_events with (security_invoker = true) as
select
  be.id, be.event_type, be.base_amount, be.amount, be.status, be.period, be.created_at,
  jsonb_build_object('id', b.id, 'name', b.name) as bar,
  bk.code as booking_code
from public.billing_events be
join public.bars     b  on b.id  = be.bar_id
join public.bookings bk on bk.id = be.booking_id
where public.is_admin();

create view public.admin_audit_logs with (security_invoker = true) as
select
  a.id, a.action, a.entity_type, a.entity_id, a.before, a.after, a.created_at, a.actor_role,
  case when u.id is null then null else jsonb_build_object('id', u.id, 'email', u.email, 'display_name', u.display_name) end as actor
from public.audit_logs a
left join public.users u on u.id = a.actor_id
where public.is_admin();

create or replace function public.admin_dashboard()
returns table (bookings_today integer, bars_pending integer, reviews_reported integer,
               promo_slips_pending integer, deposits_to_verify integer, payouts_pending integer)
language sql stable set search_path = '' as $$
  select
    (select count(*) from public.bookings
      where (booking_datetime at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date)::integer,
    (select count(*) from public.bars where status in ('PENDING_REVIEW'))::integer,
    (select count(distinct review_id) from public.review_reports where status = 'OPEN')::integer,
    (select count(*) from public.promoted_listings where status = 'PAYMENT_SUBMITTED')::integer,
    (select count(*) from public.deposits where status = 'SUBMITTED')::integer,
    (select count(*) from public.deposits where settlement = 'PAYOUT_PENDING')::integer
  where public.is_admin()
$$;

revoke all on public.admin_users, public.admin_bars, public.admin_bookings, public.admin_deposits, public.admin_reviews,
              public.admin_safety_queue, public.admin_promoted_listings, public.admin_billing_events, public.admin_audit_logs
  from anon;
grant select on public.admin_users, public.admin_bars, public.admin_bookings, public.admin_deposits, public.admin_reviews,
                public.admin_safety_queue, public.admin_promoted_listings, public.admin_billing_events, public.admin_audit_logs
  to authenticated;
revoke execute on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;

-- ---------------------------------------------------------------------
-- การกระทำของแอดมิน (NestJS เรียกด้วย service_role)
-- ---------------------------------------------------------------------
create or replace function public.admin_assert(p_actor uuid) returns void
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.users where id = p_actor and role = 'ADMIN' and deleted_at is null) then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
  perform set_config('app.user_id', p_actor::text, true);   -- ให้ trigger ประวัติสถานะรู้ว่าใครทำ
end $$;

create or replace function public.admin_audit(p_actor uuid, p_action text, p_entity text, p_id uuid, p_before jsonb, p_after jsonb)
returns void language sql set search_path = '' as $$
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before, after)
  values (p_actor, 'ADMIN', p_action, p_entity, p_id, p_before, p_after)
$$;

-- ร้าน: อนุมัติ / ไม่อนุมัติ / ระงับ / เปิดใช้งานอีกครั้ง
create or replace function public.admin_set_bar_status(p_actor uuid, p_bar uuid, p_status public.bar_status, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare old_status public.bar_status;
begin
  perform public.admin_assert(p_actor);
  select status into old_status from public.bars where id = p_bar for update;
  if not found then raise exception 'BAR_NOT_FOUND' using errcode = 'P0002'; end if;
  update public.bars set status = p_status, status_reason = p_reason,
         approved_at = case when p_status = 'APPROVED' then coalesce(approved_at, now()) else approved_at end
   where id = p_bar;
  perform public.admin_audit(p_actor, 'bar.status', 'bars', p_bar,
    jsonb_build_object('status', old_status), jsonb_build_object('status', p_status, 'reason', p_reason));
  return jsonb_build_object('id', p_bar, 'status', p_status);
end $$;

-- ร้าน: Editor's pick
create or replace function public.admin_set_editor_pick(p_actor uuid, p_bar uuid, p_value boolean)
returns jsonb language plpgsql set search_path = '' as $$
begin
  perform public.admin_assert(p_actor);
  update public.bar_stats set is_editor_pick = p_value where bar_id = p_bar;
  if not found then raise exception 'BAR_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_value then
    insert into public.editor_picks (bar_id, pinned_by) values (p_bar, p_actor);
  else
    update public.editor_picks set ends_at = now() where bar_id = p_bar and (ends_at is null or ends_at > now());
  end if;
  perform public.admin_audit(p_actor, 'bar.editor_pick', 'bars', p_bar, null, jsonb_build_object('is_editor_pick', p_value));
  return jsonb_build_object('id', p_bar, 'is_editor_pick', p_value);
end $$;

-- คำนวณ Safety Score ใหม่จาก checklist (weight ของข้อที่ YES / weight ทั้งหมด)
create or replace function public.recompute_safety_score(p_bar uuid) returns void
language sql set search_path = '' as $$
  update public.bar_stats set safety_score = (
    select round(100.0 * coalesce(sum(sf.weight) filter (where f.value = 'YES'), 0) / nullif(sum(sf.weight), 0))
    from public.safety_features sf
    left join public.bar_safety_features f on f.feature_key = sf.key and f.bar_id = p_bar)
  where bar_id = p_bar
$$;

-- Safety: ทีมตรวจหลักฐานแล้ว → ADMIN_VERIFIED
create or replace function public.admin_verify_safety(p_actor uuid, p_feature uuid)
returns jsonb language plpgsql set search_path = '' as $$
declare f record;
begin
  perform public.admin_assert(p_actor);
  update public.bar_safety_features
     set source = 'ADMIN_VERIFIED', verified_by = p_actor, verified_at = now()
   where id = p_feature
  returning bar_id, feature_key, value into f;
  if not found then raise exception 'SAFETY_FEATURE_NOT_FOUND' using errcode = 'P0002'; end if;
  update public.safety_reports set status = 'CONFIRMED', resolved_by = p_actor, resolved_at = now()
   where bar_id = f.bar_id and feature_key = f.feature_key and status = 'OPEN';
  perform public.recompute_safety_score(f.bar_id);
  perform public.admin_audit(p_actor, 'safety.verify', 'bar_safety_features', p_feature, null,
    jsonb_build_object('bar_id', f.bar_id, 'feature_key', f.feature_key, 'value', f.value));
  return jsonb_build_object('id', p_feature, 'source', 'ADMIN_VERIFIED');
end $$;

-- มัดจำ: ตรวจสลิป → ผ่าน (ยืนยันโต๊ะ) / ไม่ผ่าน (ให้ลูกค้าส่งใหม่)
create or replace function public.admin_review_deposit(p_actor uuid, p_deposit uuid, p_approve boolean, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare d record;
begin
  perform public.admin_assert(p_actor);
  select * into d from public.deposits where id = p_deposit for update;
  if not found then raise exception 'DEPOSIT_NOT_FOUND' using errcode = 'P0002'; end if;
  if d.status <> 'SUBMITTED' then raise exception 'DEPOSIT_ALREADY_REVIEWED' using errcode = 'P0001'; end if;
  if p_approve then
    update public.deposits set status = 'VERIFIED', settlement = 'HELD', verified_by = p_actor, verified_at = now(), settled_at = now()
     where id = p_deposit;
    perform set_config('app.reason', 'deposit verified', true);
    update public.bookings set status = 'CONFIRMED' where id = d.booking_id and status = 'DEPOSIT_SUBMITTED';
  else
    update public.deposits set status = 'REJECTED', reject_reason = coalesce(p_reason, 'สลิปไม่ถูกต้อง'), verified_by = p_actor, verified_at = now()
     where id = p_deposit;
    perform set_config('app.reason', coalesce(p_reason, 'slip rejected'), true);
    update public.bookings set status = 'AWAITING_DEPOSIT' where id = d.booking_id and status = 'DEPOSIT_SUBMITTED';
  end if;
  perform public.admin_audit(p_actor, case when p_approve then 'deposit.verify' else 'deposit.reject' end, 'deposits', p_deposit,
    jsonb_build_object('status', d.status), jsonb_build_object('approve', p_approve, 'reason', p_reason));
  return jsonb_build_object('id', p_deposit, 'status', case when p_approve then 'VERIFIED' else 'REJECTED' end);
end $$;

-- มัดจำ: โอนให้ร้านแล้ว / เก็บเป็นเครดิตร้าน
create or replace function public.admin_settle_deposit(p_actor uuid, p_deposit uuid, p_how public.deposit_settlement)
returns jsonb language plpgsql set search_path = '' as $$
declare d record;
begin
  perform public.admin_assert(p_actor);
  if p_how not in ('PAID_OUT', 'CREDIT', 'REFUNDED') then raise exception 'INVALID_SETTLEMENT' using errcode = '22023'; end if;
  select * into d from public.deposits where id = p_deposit for update;
  if not found then raise exception 'DEPOSIT_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_how in ('PAID_OUT', 'CREDIT') and d.settlement <> 'PAYOUT_PENDING' then
    raise exception 'DEPOSIT_NOT_PAYOUT_PENDING' using errcode = 'P0001';
  end if;
  if p_how = 'REFUNDED' and d.settlement <> 'REFUND_PENDING' then
    raise exception 'DEPOSIT_NOT_REFUND_PENDING' using errcode = 'P0001';
  end if;
  update public.deposits set settlement = p_how, settled_at = now(),
         refunded_at = case when p_how = 'REFUNDED' then now() else refunded_at end
   where id = p_deposit;
  if p_how = 'CREDIT' then
    insert into public.bar_credit_ledger (bar_id, deposit_id, amount, reason, created_by)
    values (d.bar_id, d.id, d.amount, 'DEPOSIT_TO_CREDIT', p_actor);
  end if;
  perform public.admin_audit(p_actor, 'deposit.settle', 'deposits', p_deposit,
    jsonb_build_object('settlement', d.settlement), jsonb_build_object('settlement', p_how));
  return jsonb_build_object('id', p_deposit, 'settlement', p_how);
end $$;

-- รีวิว: เก็บไว้ (ปิดรายงาน) / ซ่อน / ลบ
create or replace function public.admin_moderate_review(p_actor uuid, p_review uuid, p_action text, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare old_status public.review_status; new_status public.review_status;
begin
  perform public.admin_assert(p_actor);
  if p_action not in ('KEEP', 'HIDE', 'REMOVE', 'RESTORE') then raise exception 'INVALID_ACTION' using errcode = '22023'; end if;
  select status into old_status from public.reviews where id = p_review for update;
  if not found then raise exception 'REVIEW_NOT_FOUND' using errcode = 'P0002'; end if;
  new_status := case p_action when 'HIDE' then 'HIDDEN' when 'REMOVE' then 'REMOVED' when 'RESTORE' then 'PUBLISHED' else old_status end;
  update public.reviews set status = new_status where id = p_review;
  update public.review_reports set status = case when p_action = 'KEEP' then 'DISMISSED'::public.report_status else 'ACTIONED'::public.report_status end
   where review_id = p_review and status = 'OPEN';
  insert into public.review_moderation_logs (review_id, admin_id, action, from_status, to_status, reason)
  values (p_review, p_actor, case p_action when 'KEEP' then 'DISMISS_REPORTS' else p_action end, old_status, new_status, p_reason);
  perform public.admin_audit(p_actor, 'review.' || lower(p_action), 'reviews', p_review,
    jsonb_build_object('status', old_status), jsonb_build_object('status', new_status, 'reason', p_reason));
  return jsonb_build_object('id', p_review, 'status', new_status);
end $$;

-- โปรโมท: สลิปผ่าน (เริ่มแสดงทันที) / ไม่ผ่าน
create or replace function public.admin_review_promotion(p_actor uuid, p_listing uuid, p_approve boolean, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare l record; v_days integer; v_start timestamptz;
begin
  perform public.admin_assert(p_actor);
  select pl.*, pp.duration_days into l
    from public.promoted_listings pl join public.promotion_packages pp on pp.id = pl.package_id
   where pl.id = p_listing for update of pl;
  if not found then raise exception 'PROMOTION_NOT_FOUND' using errcode = 'P0002'; end if;
  if l.status <> 'PAYMENT_SUBMITTED' then raise exception 'PROMOTION_NOT_AWAITING_REVIEW' using errcode = 'P0001'; end if;
  update public.promoted_listing_payments
     set status = case when p_approve then 'VERIFIED'::public.slip_status else 'REJECTED'::public.slip_status end,
         verified_by = p_actor, verified_at = now()
   where id = (select id from public.promoted_listing_payments where promoted_listing_id = p_listing order by created_at desc limit 1);
  if p_approve then
    v_start := greatest(l.starts_at, now());
    update public.promoted_listings
       set status = 'ACTIVE', approved_by = p_actor, approved_at = now(),
           starts_at = v_start, ends_at = v_start + make_interval(days => l.duration_days)
     where id = p_listing;
  else
    update public.promoted_listings set status = 'REJECTED', reject_reason = coalesce(p_reason, 'สลิปไม่ถูกต้อง') where id = p_listing;
  end if;
  perform public.admin_audit(p_actor, case when p_approve then 'promotion.approve' else 'promotion.reject' end,
    'promoted_listings', p_listing, jsonb_build_object('status', l.status), jsonb_build_object('approve', p_approve, 'reason', p_reason));
  return jsonb_build_object('id', p_listing, 'status', case when p_approve then 'ACTIVE' else 'REJECTED' end);
end $$;

-- ผู้ใช้: เปลี่ยน role (ห้ามลดสิทธิ์ตัวเอง กันแอดมินคนสุดท้ายล็อกตัวเองออก)
create or replace function public.admin_set_user_role(p_actor uuid, p_user uuid, p_role public.user_role)
returns jsonb language plpgsql set search_path = '' as $$
declare old_role public.user_role;
begin
  perform public.admin_assert(p_actor);
  if p_user = p_actor and p_role <> 'ADMIN' then raise exception 'CANNOT_DEMOTE_SELF' using errcode = 'P0001'; end if;
  select role into old_role from public.users where id = p_user for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  update public.users set role = p_role where id = p_user;
  perform public.admin_audit(p_actor, 'user.role', 'users', p_user, jsonb_build_object('role', old_role), jsonb_build_object('role', p_role));
  return jsonb_build_object('id', p_user, 'role', p_role);
end $$;

-- ฟังก์ชันเขียนทั้งหมด: service_role (NestJS) เท่านั้น
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'admin\_%' escape '\' and p.proname <> 'admin_dashboard'
                                           or p.proname = 'recompute_safety_score') loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
