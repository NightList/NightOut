-- =====================================================================
-- NightOut · ฟังก์ชันการกระทำของลูกค้า / ร้านค้า + view ที่หน้าบ้านต้องใช้เพิ่ม + trigger ผลข้างเคียง
--
-- หลักเดิม: หน้าเว็บอ่านผ่าน view/RPC (RLS) · เขียนผ่าน NestJS เท่านั้น
--   ฟังก์ชัน app_* รับ p_actor (ผู้ใช้จาก JWT ที่ NestJS ตรวจแล้ว) → ตรวจสิทธิ์ซ้ำในฟังก์ชัน → เขียนในธุรกรรมเดียว
--   เรียกได้เฉพาะ service_role (NestJS) · error เป็นรหัสตัวใหญ่ (หน้าเว็บแปลเป็นภาษาไทย)
-- =====================================================================
set search_path = public, extensions;

-- ค่าคอมเริ่มต้น (% ของยอดประเมิน) เมื่อร้านยังไม่มี commission_rules
insert into public.platform_settings (key, value) values ('default_commission_percent', '10')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 1. helper
-- ---------------------------------------------------------------------
-- ผู้ใช้ที่ยังใช้งานอยู่ + ตั้ง app.user_id ให้ trigger ประวัติสถานะ
create or replace function public.app_assert_user(p_actor uuid) returns public.users
language plpgsql set search_path = '' as $$
declare u public.users;
begin
  select * into u from public.users where id = p_actor and deleted_at is null;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  perform set_config('app.user_id', p_actor::text, true);
  return u;
end $$;

-- บทบาทในทีมร้าน (ต้องตอบรับคำเชิญแล้ว)
create or replace function public.app_team_role(p_actor uuid, p_bar uuid) returns public.bar_staff_role
language plpgsql stable set search_path = '' as $$
declare r public.bar_staff_role;
begin
  select role into r from public.bar_staff
   where bar_id = p_bar and user_id = p_actor and accepted_at is not null and revoked_at is null;
  if r is null then raise exception 'NOT_BAR_MEMBER' using errcode = '42501'; end if;
  return r;
end $$;

-- เจ้าของ / ผู้จัดการ เท่านั้น (พนักงานแก้ข้อมูลร้านไม่ได้)
create or replace function public.app_assert_manager(p_actor uuid, p_bar uuid) returns public.bar_staff_role
language plpgsql stable set search_path = '' as $$
declare r public.bar_staff_role := public.app_team_role(p_actor, p_bar);
begin
  if r = 'STAFF' then raise exception 'NOT_BAR_MANAGER' using errcode = '42501'; end if;
  return r;
end $$;

-- แจ้งเตือนในเว็บ (กระดิ่ง) · payload.link = หน้าที่กดแล้วไป
create or replace function public.app_notify(p_user uuid, p_event text, p_title text, p_body text, p_link text,
                                             p_booking uuid default null, p_bar uuid default null, p_dedupe text default null)
returns void language sql set search_path = '' as $$
  insert into public.notifications (user_id, event_type, booking_id, bar_id, title, body, payload, dedupe_key)
  values (p_user, p_event, p_booking, p_bar, p_title, p_body,
          case when p_link is null then '{}'::jsonb else jsonb_build_object('link', p_link) end, p_dedupe)
  on conflict (dedupe_key) do nothing
$$;

create or replace function public.app_notify_team(p_bar uuid, p_event text, p_title text, p_body text, p_link text, p_booking uuid default null)
returns void language sql set search_path = '' as $$
  select public.app_notify(s.user_id, p_event, p_title, p_body, p_link, p_booking, p_bar)
  from public.bar_staff s where s.bar_id = p_bar and s.accepted_at is not null and s.revoked_at is null
$$;

create or replace function public.app_notify_admins(p_event text, p_title text, p_body text, p_link text, p_booking uuid default null, p_bar uuid default null)
returns void language sql set search_path = '' as $$
  select public.app_notify(u.id, p_event, p_title, p_body, p_link, p_booking, p_bar)
  from public.users u where u.role = 'ADMIN' and u.deleted_at is null
$$;

-- "12/10 21:00" เวลาไทย
create or replace function public.app_fmt(p_at timestamptz) returns text
language sql immutable set search_path = '' as $$
  select to_char(p_at at time zone 'Asia/Bangkok', 'DD/MM HH24:MI')
$$;

create or replace function public.app_audit(p_actor uuid, p_action text, p_entity text, p_id uuid, p_after jsonb)
returns void language sql set search_path = '' as $$
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, after)
  values (p_actor, (select role from public.users where id = p_actor), p_action, p_entity, p_id, p_after)
$$;

-- ชื่อลูกค้าของการจอง — เห็นได้เฉพาะเจ้าของการจองและทีมร้าน (ตาราง users อ่านได้แค่แถวตัวเอง)
create or replace function public.booking_customer_name(p_user uuid, p_bar uuid) returns text
language sql stable security definer set search_path = '' as $$
  select u.display_name from public.users u
  where u.id = p_user and (p_user = auth.uid() or public.is_bar_member(p_bar))
$$;

-- ---------------------------------------------------------------------
-- 2. ลูกค้า
-- ---------------------------------------------------------------------
-- จองโต๊ะ: ตรวจเวลา/จำนวนคน/ความจุโซน → เลือกโต๊ะว่างที่พอดีที่สุด → snapshot โปร → มัดจำ
create or replace function public.app_create_booking(p_actor uuid, p_bar uuid, p_zone uuid, p_datetime timestamptz,
                                                     p_pax integer, p_promotion uuid default null, p_note text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  u public.users; b public.bars; s public.bar_booking_settings; z public.table_zones; pr public.bar_promotions;
  v_until timestamptz; v_table uuid; v_has_tables boolean; v_deposit numeric; v_status public.booking_status;
  v_code text; v_id uuid; v_local timestamp;
begin
  u := public.app_assert_user(p_actor);
  select * into b from public.bars where id = p_bar and status = 'APPROVED';
  if not found then raise exception 'BAR_NOT_FOUND' using errcode = 'P0002'; end if;
  select * into s from public.bar_booking_settings where bar_id = p_bar;
  if p_pax is null or p_pax < 1 or p_pax > s.max_pax_per_booking then
    raise exception 'PAX_OUT_OF_RANGE' using errcode = '22023';
  end if;
  if p_datetime < now() + make_interval(mins => s.min_advance_minutes) then
    raise exception 'BOOKING_TOO_SOON' using errcode = '22023';
  end if;
  if p_datetime > now() + make_interval(days => s.max_advance_days) then
    raise exception 'BOOKING_TOO_FAR' using errcode = '22023';
  end if;
  select * into z from public.table_zones where id = p_zone and bar_id = p_bar and active;
  if not found then raise exception 'ZONE_NOT_FOUND' using errcode = 'P0002'; end if;
  v_until := p_datetime + make_interval(mins => z.default_duration_minutes);

  -- ล็อกโซน + นับความจุที่เหลือ (request พร้อมกันต่อคิวกันที่นี่)
  if public.zone_remaining_pax(p_zone, p_datetime, v_until) < p_pax then
    raise exception 'ZONE_FULL' using errcode = 'P0001';
  end if;
  select exists (select 1 from public.tables t where t.zone_id = p_zone and t.active) into v_has_tables;
  if v_has_tables then
    select t.id into v_table from public.tables t
     where t.zone_id = p_zone and t.active
       and not exists (select 1 from public.bookings x
                        where x.table_id = t.id
                          and x.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')
                          and x.reserved_period && tstzrange(p_datetime, v_until, '[)'))
     order by (t.seats >= p_pax) desc, case when t.seats >= p_pax then t.seats end asc nulls last, t.seats desc, t.name
     limit 1;
    if v_table is null then raise exception 'ZONE_FULL' using errcode = 'P0001'; end if;
  elsif not z.allow_zone_only_booking then
    raise exception 'ZONE_FULL' using errcode = 'P0001';
  end if;

  if p_promotion is not null then
    v_local := p_datetime at time zone 'Asia/Bangkok';
    select * into pr from public.bar_promotions
     where id = p_promotion and bar_id = p_bar and active and moderation_status = 'APPROVED'
       and (valid_from is null or valid_from <= v_local::date)
       and (valid_to is null or valid_to >= v_local::date);
    if not found
       or not (extract(dow from v_local)::smallint = any (pr.days_of_week))
       or (pr.cutoff_time is not null and v_local::time > pr.cutoff_time)
       or (pr.min_pax is not null and p_pax < pr.min_pax) then
      raise exception 'PROMOTION_NOT_AVAILABLE' using errcode = '22023';
    end if;
  end if;

  v_deposit := case when s.deposit_unit = 'PER_PERSON' then s.deposit_amount * p_pax else s.deposit_amount end;
  v_status := case when v_deposit > 0 then 'AWAITING_DEPOSIT' else 'PENDING' end;
  loop
    v_code := 'NL-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.bookings where code = v_code);
  end loop;

  begin
    insert into public.bookings (code, user_id, bar_id, zone_id, table_id, booking_datetime, reserved_from, reserved_until,
                                 pax, status, customer_note, deposit_required, deposit_policy_snapshot, grace_minutes,
                                 auto_cancel_at, expires_at)
    values (v_code, p_actor, p_bar, p_zone, v_table, p_datetime, p_datetime, v_until,
            p_pax, v_status, nullif(trim(p_note), ''), v_deposit, s.deposit_policy, s.grace_minutes,
            p_datetime + make_interval(mins => s.grace_minutes),
            least(now() + make_interval(mins => case when v_status = 'AWAITING_DEPOSIT' then s.deposit_timeout_minutes
                                                     else s.pending_timeout_minutes end),
                  p_datetime + make_interval(mins => s.grace_minutes)))
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'ZONE_FULL' using errcode = 'P0001';
  end;

  if pr.id is not null then
    insert into public.booking_promotions (booking_id, promotion_id, title_snapshot, perk_snapshot)
    values (v_id, pr.id, pr.title, jsonb_build_object('perk_type', pr.perk_type, 'description', pr.description,
            'discount_percent', pr.discount_percent, 'cutoff_time', to_char(pr.cutoff_time, 'HH24:MI')));
  end if;
  insert into public.booking_shares (booking_id) values (v_id);

  perform public.app_notify(p_actor, 'BOOKING_CREATED', 'สร้างการจองแล้ว',
    b.name || ' · ' || public.app_fmt(p_datetime) || ' · ' || p_pax || ' คน', '/bookings/' || v_id, v_id, p_bar);
  perform public.app_notify_team(p_bar, 'BOOKING_NEW', 'มีการจองใหม่',
    u.display_name || ' · ' || public.app_fmt(p_datetime) || ' · ' || p_pax || ' คน', '/merchant/bookings', v_id);
  return jsonb_build_object('id', v_id, 'code', v_code, 'status', v_status, 'deposit_required', v_deposit);
end $$;

-- ส่งสลิปมัดจำ (ไฟล์อัปโหลดเข้า bucket deposit-slips/<user_id>/... จากหน้าเว็บแล้ว)
create or replace function public.app_submit_deposit(p_actor uuid, p_booking uuid, p_slip_path text, p_slip_ref text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare u public.users; bk public.bookings; v_bar text; v_id uuid;
begin
  u := public.app_assert_user(p_actor);
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

-- ลูกค้ายกเลิกเอง (มัดจำ: trigger ตัดสินว่าคืนลูกค้าหรือเป็นของร้านตามนโยบาย refund_before_hours)
create or replace function public.app_cancel_booking(p_actor uuid, p_booking uuid, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare u public.users; bk public.bookings;
begin
  u := public.app_assert_user(p_actor);
  select * into bk from public.bookings where id = p_booking for update;
  if not found or bk.user_id <> p_actor then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  if bk.status not in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED') then
    raise exception 'INVALID_BOOKING_TRANSITION' using errcode = 'P0001';
  end if;
  perform set_config('app.reason', coalesce(nullif(trim(p_reason), ''), 'customer cancelled'), true);
  update public.bookings set status = 'CANCELLED_BY_CUSTOMER', cancel_reason = nullif(trim(p_reason), '') where id = bk.id;
  perform public.app_notify_team(bk.bar_id, 'BOOKING_CANCELLED', 'ลูกค้ายกเลิกการจอง',
    u.display_name || ' · ' || bk.code || ' · ' || public.app_fmt(bk.booking_datetime), '/merchant/bookings', bk.id);
  return jsonb_build_object('id', bk.id, 'status', 'CANCELLED_BY_CUSTOMER');
end $$;

-- รีวิว (การจองที่เช็กอินแล้ว 1 ครั้ง) · ไฟล์แนบอัปโหลดเข้า review-media/<user_id>/<review_id>/... ก่อนเรียก
create or replace function public.app_add_review(p_actor uuid, p_booking uuid, p_review_id uuid, p_rating integer,
                                                 p_comment text, p_media jsonb default '[]'::jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare u public.users; bk public.bookings; m jsonb; v_prefix text; i integer := 0;
begin
  u := public.app_assert_user(p_actor);
  select * into bk from public.bookings where id = p_booking;
  if not found or bk.user_id <> p_actor then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  if bk.status not in ('CHECKED_IN','COMPLETED') then raise exception 'REVIEW_REQUIRES_CHECKIN' using errcode = 'P0001'; end if;
  if exists (select 1 from public.reviews where booking_id = bk.id) then raise exception 'REVIEW_EXISTS' using errcode = 'P0001'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'INVALID_RATING' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_media, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_media, '[]'::jsonb)) > 6 then
    raise exception 'REVIEW_MEDIA_LIMIT' using errcode = '22023';
  end if;
  insert into public.reviews (id, booking_id, user_id, bar_id, rating, comment, has_media)
  values (coalesce(p_review_id, gen_random_uuid()), bk.id, p_actor, bk.bar_id, p_rating, nullif(trim(p_comment), ''),
          jsonb_array_length(coalesce(p_media, '[]'::jsonb)) > 0)
  returning id into p_review_id;
  v_prefix := p_actor::text || '/' || p_review_id::text || '/';
  for m in select * from jsonb_array_elements(coalesce(p_media, '[]'::jsonb)) loop
    if left(m->>'path', length(v_prefix)) <> v_prefix then raise exception 'INVALID_MEDIA_PATH' using errcode = '22023'; end if;
    insert into public.review_media (review_id, kind, storage_path, thumb_path, duration_sec, size_bytes, sort_order)
    values (p_review_id, coalesce(m->>'kind', 'IMAGE')::public.media_kind, m->>'path',
            case when left(m->>'thumb_path', length(v_prefix)) = v_prefix then m->>'thumb_path' end,
            nullif(m->>'duration_sec', '')::numeric::smallint, nullif(m->>'size_bytes', '')::integer, i);
    i := i + 1;
  end loop;
  -- คะแนนเฉลี่ยแบบสะสม (ร้านเดโมมีจำนวนรีวิวตั้งต้นจาก seed)
  update public.bar_stats
     set rating_avg = round((coalesce(rating_avg, 0) * rating_count + p_rating)::numeric / (rating_count + 1), 2),
         rating_count = rating_count + 1
   where bar_id = bk.bar_id;
  perform public.app_notify_team(bk.bar_id, 'REVIEW_NEW', 'มีรีวิวใหม่', u.display_name || ' ให้ ' || p_rating || ' ดาว', '/merchant/reviews', bk.id);
  return jsonb_build_object('id', p_review_id, 'bar_id', bk.bar_id);
end $$;

create or replace function public.app_toggle_favorite(p_actor uuid, p_bar uuid) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  if not exists (select 1 from public.bars where id = p_bar and status = 'APPROVED') then
    raise exception 'BAR_NOT_FOUND' using errcode = 'P0002';
  end if;
  delete from public.favorites where user_id = p_actor and bar_id = p_bar;
  if found then return jsonb_build_object('bar_id', p_bar, 'favorite', false); end if;
  insert into public.favorites (user_id, bar_id) values (p_actor, p_bar);
  return jsonb_build_object('bar_id', p_bar, 'favorite', true);
end $$;

create or replace function public.app_mark_notifications_read(p_actor uuid, p_ids uuid[] default null) returns jsonb
language plpgsql set search_path = '' as $$
declare n integer;
begin
  perform public.app_assert_user(p_actor);
  update public.notifications set read_at = now()
   where user_id = p_actor and read_at is null and (p_ids is null or id = any (p_ids));
  get diagnostics n = row_count;
  return jsonb_build_object('updated', n);
end $$;

-- แก้โปรไฟล์/ความชอบ — ส่งเฉพาะ key ที่จะแก้
--   {display_name, style_ids[], district_ids[], budget_per_person, usual_pax, theme, onboarded}
create or replace function public.app_update_profile(p_actor uuid, p jsonb) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  if p ? 'display_name' then
    if char_length(trim(p->>'display_name')) not between 1 and 60 then raise exception 'INVALID_DISPLAY_NAME' using errcode = '22023'; end if;
    update public.users set display_name = trim(p->>'display_name') where id = p_actor;
  end if;
  if coalesce((p->>'onboarded')::boolean, false) then
    update public.users set onboarded_at = coalesce(onboarded_at, now()) where id = p_actor;
  end if;
  insert into public.user_preferences (user_id) values (p_actor) on conflict do nothing;
  update public.user_preferences set
    preferred_style_ids    = case when p ? 'style_ids' then coalesce(array(select jsonb_array_elements_text(p->'style_ids')::uuid), '{}') else preferred_style_ids end,
    preferred_district_ids = case when p ? 'district_ids' then coalesce(array(select jsonb_array_elements_text(p->'district_ids')::uuid), '{}') else preferred_district_ids end,
    budget_per_person      = case when p ? 'budget_per_person' then nullif(p->>'budget_per_person', '')::numeric else budget_per_person end,
    usual_pax              = case when p ? 'usual_pax' then nullif(p->>'usual_pax', '')::smallint else usual_pax end,
    theme                  = case when p ? 'theme' then (p->>'theme')::public.theme_mode else theme end
  where user_id = p_actor;
  return jsonb_build_object('id', p_actor);
end $$;

-- ขอลบบัญชี (PDPA) — ปิดบัญชีทันที · run_retention_jobs() ล้างข้อมูลส่วนตัวเมื่อครบ account_retention_days
create or replace function public.app_delete_account(p_actor uuid) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
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

-- รายงานรีวิว (ลูกค้าหรือร้าน) → ไปที่หน้า "รีวิวที่ถูกรายงาน" ของแอดมิน
create or replace function public.app_report_review(p_actor uuid, p_review uuid, p_reason text, p_detail text default null)
returns jsonb language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  if not exists (select 1 from public.reviews where id = p_review and status = 'PUBLISHED') then
    raise exception 'REVIEW_NOT_FOUND' using errcode = 'P0002';
  end if;
  insert into public.review_reports (review_id, reporter_id, reason, detail)
  values (p_review, p_actor, coalesce(p_reason, 'OTHER'), nullif(trim(p_detail), ''))
  on conflict (review_id, reporter_id) do update set status = 'OPEN', reason = excluded.reason, detail = excluded.detail;
  perform public.app_notify_admins('REVIEW_REPORTED', 'มีรีวิวถูกรายงาน', coalesce(p_reason, 'OTHER'), '/reviews', null, null);
  return jsonb_build_object('review_id', p_review, 'reported', true);
end $$;

-- ---------------------------------------------------------------------
-- 3. ร้านค้า — การจอง / เช็กอิน / ความแน่น
-- ---------------------------------------------------------------------
-- เปลี่ยนสถานะโดยทีมร้าน (ตรงกับ BOOKING_TRANSITIONS ใน packages/utils)
create or replace function public.app_team_set_booking_status(p_actor uuid, p_booking uuid, p_to public.booking_status, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare bk public.bookings; r public.bar_staff_role; v_actor text; ok boolean;
begin
  perform public.app_assert_user(p_actor);
  select * into bk from public.bookings where id = p_booking for update;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  r := public.app_team_role(p_actor, bk.bar_id);
  v_actor := case when r = 'STAFF' then 'STAFF' else 'MERCHANT' end;
  ok := case
    when bk.status = 'PENDING'           and p_to in ('CONFIRMED','REJECTED') then true
    when bk.status = 'DEPOSIT_SUBMITTED' and p_to = 'REJECTED'                then v_actor = 'MERCHANT'
    when bk.status = 'CONFIRMED'         and p_to = 'CHECKED_IN'              then true
    when bk.status = 'CONFIRMED'         and p_to = 'CANCELLED_BY_MERCHANT'   then v_actor = 'MERCHANT'
    when bk.status = 'CHECKED_IN'        and p_to = 'COMPLETED'               then true
    else false end;
  if not ok then raise exception 'INVALID_BOOKING_TRANSITION' using errcode = 'P0001'; end if;
  perform set_config('app.reason', coalesce(nullif(trim(p_reason), ''), lower(v_actor)), true);
  if p_to = 'CHECKED_IN' then
    insert into public.checkins (booking_id, checked_in_by, method, table_id) values (bk.id, p_actor, 'MANUAL', bk.table_id);
  end if;
  update public.bookings
     set status = p_to,
         cancel_reason = case when p_to in ('REJECTED','CANCELLED_BY_MERCHANT') then nullif(trim(p_reason), '') else cancel_reason end
   where id = bk.id;
  return jsonb_build_object('id', bk.id, 'status', p_to);
end $$;

-- เช็กอินด้วยรหัสจอง (NL-XXXXXX) หรือข้อความจาก QR (NIGHTOUT:<booking id>)
create or replace function public.app_check_in(p_actor uuid, p_bar uuid, p_code text) returns jsonb
language plpgsql set search_path = '' as $$
declare v text := upper(trim(coalesce(p_code, ''))); bk public.bookings; v_zone text;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_team_role(p_actor, p_bar);
  select * into bk from public.bookings
   where bar_id = p_bar
     and (code = v
          or (v like 'NIGHTOUT:%' and id::text = lower(substr(v, 10)))
          or (v like 'NIGHTLIST:%' and id::text = lower(substr(v, 11))))   -- QR เก่า (ชื่อเดิม NightList) ยังสแกนได้
   for update;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002'; end if;
  if bk.status <> 'CONFIRMED' then raise exception 'BOOKING_NOT_CONFIRMED' using errcode = 'P0001'; end if;
  perform set_config('app.reason', 'check-in', true);
  insert into public.checkins (booking_id, checked_in_by, method, table_id) values (bk.id, p_actor, 'MANUAL', bk.table_id);
  update public.bookings set status = 'CHECKED_IN' where id = bk.id;
  select name into v_zone from public.table_zones where id = bk.zone_id;
  return jsonb_build_object('id', bk.id, 'code', bk.code, 'pax', bk.pax, 'zone_name', v_zone,
                            'customer_name', (select display_name from public.users where id = bk.user_id));
end $$;

create or replace function public.app_set_crowd(p_actor uuid, p_bar uuid, p_status public.crowd_status) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  perform public.app_team_role(p_actor, p_bar);
  insert into public.crowd_status_logs (bar_id, status, updated_by) values (p_bar, p_status, p_actor);
  return jsonb_build_object('bar_id', p_bar, 'current_crowd', p_status);
end $$;

-- ---------------------------------------------------------------------
-- 4. ร้านค้า — ข้อมูลร้าน (เจ้าของ / ผู้จัดการ)
-- ---------------------------------------------------------------------
-- {name, description, address, phone, district_id, style_keys[], hours[{day_of_week,open_time,close_time,is_closed}], links[{type,url}]}
create or replace function public.app_update_bar_info(p_actor uuid, p_bar uuid, p jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare h jsonb; l jsonb; i integer := 0;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  update public.bars set
    name        = case when p ? 'name' then trim(p->>'name') else name end,
    description = case when p ? 'description' then nullif(trim(p->>'description'), '') else description end,
    address     = case when p ? 'address' then trim(p->>'address') else address end,
    phone       = case when p ? 'phone' then nullif(trim(p->>'phone'), '') else phone end,
    district_id = case when p ? 'district_id' then nullif(p->>'district_id', '')::uuid else district_id end
  where id = p_bar;
  if p ? 'style_keys' then
    delete from public.bar_styles where bar_id = p_bar;
    insert into public.bar_styles (bar_id, style_id)
    select p_bar, s.id from public.styles s where s.key in (select jsonb_array_elements_text(p->'style_keys'));
  end if;
  if p ? 'hours' then
    delete from public.bar_hours where bar_id = p_bar;
    for h in select * from jsonb_array_elements(p->'hours') loop
      insert into public.bar_hours (bar_id, day_of_week, open_time, close_time, is_closed)
      values (p_bar, (h->>'day_of_week')::smallint,
              case when coalesce((h->>'is_closed')::boolean, false) then null else (h->>'open_time')::time end,
              case when coalesce((h->>'is_closed')::boolean, false) then null else (h->>'close_time')::time end,
              coalesce((h->>'is_closed')::boolean, false));
    end loop;
  end if;
  if p ? 'links' then
    delete from public.bar_links where bar_id = p_bar;
    for l in select * from jsonb_array_elements(p->'links') loop
      begin
        insert into public.bar_links (bar_id, type, url, sort_order) values (p_bar, (l->>'type')::public.link_type, l->>'url', i);
      exception when check_violation then
        raise exception 'INVALID_LINK' using errcode = '22023', detail = l->>'type';
      end;
      i := i + 1;
    end loop;
  end if;
  perform public.app_audit(p_actor, 'bar.update_info', 'bars', p_bar, p - 'hours' - 'links');
  return jsonb_build_object('id', p_bar);
end $$;

-- เมนูทั้งชุด [{id?, category, name, price, available}] — รายการที่ไม่ส่งมาถูกลบ
create or replace function public.app_set_menu(p_actor uuid, p_bar uuid, p_items jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare it jsonb; v_cat uuid; v_id uuid; i integer := 0; keep uuid[] := '{}';
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if coalesce(trim(it->>'name'), '') = '' or (it->>'price')::numeric < 0 then raise exception 'INVALID_MENU_ITEM' using errcode = '22023'; end if;
    select id into v_cat from public.menu_categories where bar_id = p_bar and name = coalesce(nullif(trim(it->>'category'), ''), 'อื่นๆ');
    if v_cat is null then
      insert into public.menu_categories (bar_id, name, sort_order)
      values (p_bar, coalesce(nullif(trim(it->>'category'), ''), 'อื่นๆ'),
              (select coalesce(max(sort_order), 0) + 1 from public.menu_categories where bar_id = p_bar))
      returning id into v_cat;
    end if;
    v_id := null;
    if it->>'id' ~ '^[0-9a-f-]{36}$' then
      update public.menu_items set category_id = v_cat, name = trim(it->>'name'), price = (it->>'price')::numeric,
             is_available = coalesce((it->>'available')::boolean, true), sort_order = i
       where id = (it->>'id')::uuid and bar_id = p_bar returning id into v_id;
    end if;
    if v_id is null then
      insert into public.menu_items (bar_id, category_id, name, price, is_available, sort_order)
      values (p_bar, v_cat, trim(it->>'name'), (it->>'price')::numeric, coalesce((it->>'available')::boolean, true), i)
      returning id into v_id;
    end if;
    keep := keep || v_id;
    i := i + 1;
  end loop;
  delete from public.menu_items where bar_id = p_bar and not (id = any (keep));
  -- ราคาเฉลี่ยต่อหัว (ประมาณจากเมนู) ใช้ในตัวกรองงบ
  update public.bar_stats set avg_price_per_person = coalesce(
    (select round(avg(price)) * 2 from public.menu_items where bar_id = p_bar and is_available), avg_price_per_person)
   where bar_id = p_bar and avg_price_per_person is null;
  return jsonb_build_object('bar_id', p_bar, 'count', i);
end $$;

-- โปรโมชันตอนจอง [{id?, title, description, cutoff_time 'HH:MM'|null, days[]|null, active}]
-- ข้อความ/เงื่อนไขใหม่หรือที่แก้ → รอแอดมินตรวจถ้อยคำ (moderation PENDING) ก่อนลูกค้าเห็น
create or replace function public.app_set_bar_promotions(p_actor uuid, p_bar uuid, p_items jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare it jsonb; v_old public.bar_promotions; v_id uuid; i integer := 0; keep uuid[] := '{}';
        v_days smallint[]; v_cut time; v_title text; v_desc text; pending integer := 0;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_title := trim(coalesce(it->>'title', ''));
    if char_length(v_title) not between 1 and 60 then raise exception 'INVALID_PROMOTION' using errcode = '22023'; end if;
    v_desc := nullif(trim(it->>'description'), '');
    v_cut := nullif(it->>'cutoff_time', '')::time;
    v_days := case when jsonb_typeof(it->'days') = 'array' and jsonb_array_length(it->'days') > 0
                   then array(select jsonb_array_elements_text(it->'days')::smallint order by 1)
                   else '{0,1,2,3,4,5,6}'::smallint[] end;
    v_old := null;
    if it->>'id' ~ '^[0-9a-f-]{36}$' then
      select * into v_old from public.bar_promotions where id = (it->>'id')::uuid and bar_id = p_bar;
    end if;
    if v_old.id is not null then
      update public.bar_promotions set
        title = v_title, description = v_desc, cutoff_time = v_cut, days_of_week = v_days,
        active = coalesce((it->>'active')::boolean, true), sort_order = i,
        moderation_status = case when v_old.title is distinct from v_title or v_old.description is distinct from v_desc
                                   or v_old.cutoff_time is distinct from v_cut or v_old.days_of_week is distinct from v_days
                                 then 'PENDING'::public.moderation_status else v_old.moderation_status end
       where id = v_old.id returning id into v_id;
    else
      insert into public.bar_promotions (bar_id, title, description, perk_type, cutoff_time, days_of_week, active, sort_order)
      values (p_bar, v_title, v_desc, 'OTHER', v_cut, v_days, coalesce((it->>'active')::boolean, true), i)
      returning id into v_id;
    end if;
    keep := keep || v_id;
    i := i + 1;
  end loop;
  delete from public.bar_promotions where bar_id = p_bar and not (id = any (keep));
  select count(*) into pending from public.bar_promotions where bar_id = p_bar and moderation_status = 'PENDING';
  if pending > 0 then
    perform public.app_notify_admins('PROMOTION_TEXT_PENDING', 'มีโปรโมชันร้านรอตรวจถ้อยคำ',
      (select name from public.bars where id = p_bar) || ' · ' || pending || ' รายการ', '/promotions', null, p_bar);
  end if;
  return jsonb_build_object('bar_id', p_bar, 'count', i, 'pending', pending);
end $$;

-- ค่าธรรมเนียมที่แสดงในหน้าร้าน (SC %, VAT %, ค่าเปิดขวด/ค่าเข้า ต่อโต๊ะ)
create or replace function public.app_set_fees(p_actor uuid, p_bar uuid, p_service_charge numeric, p_vat numeric, p_other numeric)
returns jsonb language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  if coalesce(p_service_charge, 0) not between 0 and 30 or coalesce(p_vat, 0) not between 0 and 10 or coalesce(p_other, 0) < 0 then
    raise exception 'INVALID_FEES' using errcode = '22023';
  end if;
  delete from public.bar_fees where bar_id = p_bar;
  insert into public.bar_fees (bar_id, fee_type, label, calc, value, apply_order)
  select p_bar, v.t::public.fee_type, v.l, v.c::public.fee_calc, v.val, v.o
  from (values ('SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', coalesce(p_service_charge, 0), 1),
               ('VAT', 'VAT', 'PERCENTAGE', coalesce(p_vat, 0), 2),
               ('OTHER', 'ค่าเปิดขวด / ค่าเข้า', 'FIXED_PER_TABLE', coalesce(p_other, 0), 3)) v(t, l, c, val, o)
  where v.val > 0;
  return jsonb_build_object('bar_id', p_bar);
end $$;

-- โซน/โต๊ะ [{id?, name, capacity_pax, default_duration_minutes, tables:[{id?, name, seats}]}]
-- โซน/โต๊ะที่ไม่ส่งมา → ปิดใช้ (active = false) เพราะการจองเก่ายังอ้างถึง
create or replace function public.app_set_zones(p_actor uuid, p_bar uuid, p_zones jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare zj jsonb; tj jsonb; v_zone uuid; v_table uuid; i integer := 0; keep_z uuid[] := '{}'; keep_t uuid[];
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  for zj in select * from jsonb_array_elements(coalesce(p_zones, '[]'::jsonb)) loop
    if coalesce(trim(zj->>'name'), '') = '' then raise exception 'INVALID_ZONE' using errcode = '22023'; end if;
    v_zone := null;
    if zj->>'id' ~ '^[0-9a-f-]{36}$' then
      update public.table_zones set name = trim(zj->>'name'),
             capacity_pax = greatest(1, coalesce((zj->>'capacity_pax')::integer, capacity_pax)),
             default_duration_minutes = coalesce((zj->>'default_duration_minutes')::integer, default_duration_minutes),
             active = true, sort_order = i
       where id = (zj->>'id')::uuid and bar_id = p_bar returning id into v_zone;
    end if;
    if v_zone is null then
      insert into public.table_zones (bar_id, name, capacity_pax, default_duration_minutes, sort_order)
      values (p_bar, trim(zj->>'name'), greatest(1, coalesce((zj->>'capacity_pax')::integer, 4)),
              coalesce((zj->>'default_duration_minutes')::integer, 180), i)
      returning id into v_zone;
    end if;
    keep_z := keep_z || v_zone;
    keep_t := '{}';
    for tj in select * from jsonb_array_elements(coalesce(zj->'tables', '[]'::jsonb)) loop
      v_table := null;
      if tj->>'id' ~ '^[0-9a-f-]{36}$' then
        update public.tables set name = trim(tj->>'name'), seats = greatest(1, coalesce((tj->>'seats')::integer, seats)), active = true
         where id = (tj->>'id')::uuid and zone_id = v_zone returning id into v_table;
      end if;
      if v_table is null then
        insert into public.tables (zone_id, name, seats) values (v_zone, trim(tj->>'name'), greatest(1, coalesce((tj->>'seats')::integer, 4)))
        on conflict (zone_id, name) do update set seats = excluded.seats, active = true
        returning id into v_table;
      end if;
      keep_t := keep_t || v_table;
    end loop;
    update public.tables set active = false where zone_id = v_zone and not (id = any (keep_t));
    i := i + 1;
  end loop;
  update public.table_zones set active = false where bar_id = p_bar and not (id = any (keep_z));
  return jsonb_build_object('bar_id', p_bar, 'zones', i);
end $$;

-- Safety ที่ร้านแจ้งเอง → กลับเป็น SELF_DECLARED (รอทีมตรวจหลักฐานใหม่)
create or replace function public.app_set_safety(p_actor uuid, p_bar uuid, p_key text, p_value public.safety_value)
returns jsonb language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  if not exists (select 1 from public.safety_features where key = p_key) then raise exception 'SAFETY_FEATURE_NOT_FOUND' using errcode = 'P0002'; end if;
  insert into public.bar_safety_features (bar_id, feature_key, value, source)
  values (p_bar, p_key, p_value, 'SELF_DECLARED')
  on conflict (bar_id, feature_key) do update
    set value = excluded.value, source = 'SELF_DECLARED', verified_by = null, verified_at = null;
  perform public.recompute_safety_score(p_bar);
  return jsonb_build_object('bar_id', p_bar, 'key', p_key, 'value', p_value);
end $$;

-- หลักฐาน Safety (ไฟล์อัปโหลดเข้า bar-verifications/<bar_id>/... แล้ว) → รอทีมตรวจ
create or replace function public.app_set_safety_evidence(p_actor uuid, p_bar uuid, p_key text, p_path text)
returns jsonb language plpgsql set search_path = '' as $$
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  if not exists (select 1 from public.safety_features where key = p_key) then raise exception 'SAFETY_FEATURE_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_path is null or split_part(p_path, '/', 1) <> p_bar::text then raise exception 'INVALID_EVIDENCE_PATH' using errcode = '22023'; end if;
  insert into public.bar_safety_features (bar_id, feature_key, evidence_path, source)
  values (p_bar, p_key, p_path, 'SELF_DECLARED')
  on conflict (bar_id, feature_key) do update set evidence_path = excluded.evidence_path;
  perform public.app_notify_admins('SAFETY_EVIDENCE', 'มีหลักฐาน Safety รอตรวจ',
    (select name from public.bars where id = p_bar) || ' · ' || p_key, '/safety', null, p_bar);
  return jsonb_build_object('bar_id', p_bar, 'key', p_key, 'evidence_path', p_path);
end $$;

-- ตั้งค่าการจอง {deposit_amount, deposit_unit, deposit_policy, grace_minutes, pr_male, pr_female, pr_lgbtq}
create or replace function public.app_update_booking_settings(p_actor uuid, p_bar uuid, p jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare g text;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  update public.bar_booking_settings set
    deposit_amount = case when p ? 'deposit_amount' then greatest(0, (p->>'deposit_amount')::numeric) else deposit_amount end,
    deposit_unit   = case when p ? 'deposit_unit' then (p->>'deposit_unit')::public.deposit_unit else deposit_unit end,
    deposit_policy = case when p ? 'deposit_policy' then nullif(trim(p->>'deposit_policy'), '') else deposit_policy end,
    grace_minutes  = case when p ? 'grace_minutes' then (p->>'grace_minutes')::smallint else grace_minutes end
  where bar_id = p_bar;
  foreach g in array array['male', 'female', 'lgbtq'] loop
    if p ? ('pr_' || g) then
      delete from public.bar_pr_counts where bar_id = p_bar and gender = upper(g)::public.pr_gender;
      if coalesce((p->>('pr_' || g))::integer, 0) > 0 then
        insert into public.bar_pr_counts (bar_id, gender, pr_count) values (p_bar, upper(g)::public.pr_gender, (p->>('pr_' || g))::integer);
      end if;
    end if;
  end loop;
  perform public.app_audit(p_actor, 'bar.booking_settings', 'bars', p_bar, p);
  return jsonb_build_object('bar_id', p_bar);
end $$;

-- บัญชีรับเงิน — NestJS เข้ารหัสเลขบัญชี (AES-256-GCM) ก่อนส่งมา · ฐานข้อมูลเห็นแค่ 4 ตัวท้าย
create or replace function public.app_set_payout_account(p_actor uuid, p_bar uuid, p_bank_code text, p_account_name text,
                                                         p_account_no_enc text, p_last4 text)
returns jsonb language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  if coalesce(trim(p_bank_code), '') = '' or coalesce(trim(p_account_name), '') = '' or p_last4 !~ '^[0-9]{4}$' then
    raise exception 'INVALID_PAYOUT_ACCOUNT' using errcode = '22023';
  end if;
  update public.bar_payout_accounts set is_default = false where bar_id = p_bar and is_default;
  insert into public.bar_payout_accounts (bar_id, bank_code, account_name, account_no_enc, account_no_last4, is_default)
  values (p_bar, trim(p_bank_code), trim(p_account_name), decode(p_account_no_enc, 'base64'), p_last4, true)
  returning id into v_id;
  perform public.app_audit(p_actor, 'bar.payout_account', 'bar_payout_accounts', v_id,
    jsonb_build_object('bank_code', p_bank_code, 'account_name', p_account_name, 'last4', p_last4));
  return jsonb_build_object('id', v_id, 'account_no_last4', p_last4);
end $$;

-- ซื้อแพ็กเกจโปรโมท + สลิป (promo-slips/<bar_id>/...) → แอดมินตรวจ
create or replace function public.app_order_promotion(p_actor uuid, p_bar uuid, p_package uuid, p_slip_path text)
returns jsonb language plpgsql set search_path = '' as $$
declare pk public.promotion_packages; v_id uuid;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  select * into pk from public.promotion_packages where id = p_package and active;
  if not found then raise exception 'PACKAGE_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_slip_path is null or split_part(p_slip_path, '/', 1) <> p_bar::text then
    raise exception 'INVALID_SLIP_PATH' using errcode = '22023';
  end if;
  insert into public.promoted_listings (bar_id, package_id, placement, price_paid, starts_at, ends_at, status)
  values (p_bar, pk.id, pk.placement, pk.price, now(), now() + make_interval(days => pk.duration_days), 'PAYMENT_SUBMITTED')
  returning id into v_id;
  insert into public.promoted_listing_payments (promoted_listing_id, amount, slip_path) values (v_id, pk.price, p_slip_path);
  perform public.app_notify_admins('PROMOTION_SLIP', 'มีสลิปโปรโมทรอตรวจ',
    (select name from public.bars where id = p_bar) || ' · ' || pk.name || ' ' || pk.duration_days || ' วัน', '/promotions', null, p_bar);
  return jsonb_build_object('id', v_id, 'status', 'PAYMENT_SUBMITTED');
end $$;

-- ---------------------------------------------------------------------
-- 5. ทีมร้าน (เชิญ / ตอบรับ / นำออก) + สมัครเป็นร้าน
-- ---------------------------------------------------------------------
create or replace function public.app_invite_staff(p_actor uuid, p_bar uuid, p_email text, p_role public.bar_staff_role)
returns jsonb language plpgsql set search_path = '' as $$
declare r public.bar_staff_role; v_user uuid; cur public.bar_staff;
begin
  perform public.app_assert_user(p_actor);
  r := public.app_assert_manager(p_actor, p_bar);
  if p_role = 'OWNER' and r <> 'OWNER' then raise exception 'NOT_BAR_OWNER' using errcode = '42501'; end if;
  select id into v_user from public.users where email = lower(trim(p_email))::extensions.citext and deleted_at is null;
  if v_user is null then raise exception 'INVITEE_NOT_REGISTERED' using errcode = 'P0002'; end if;
  select * into cur from public.bar_staff where bar_id = p_bar and user_id = v_user;
  if cur.user_id is not null and cur.accepted_at is not null and cur.revoked_at is null then
    raise exception 'ALREADY_MEMBER' using errcode = 'P0001';
  end if;
  insert into public.bar_staff (bar_id, user_id, role, invited_by, invited_at, accepted_at, revoked_at)
  values (p_bar, v_user, p_role, p_actor, now(), null, null)
  on conflict (bar_id, user_id) do update
    set role = excluded.role, invited_by = excluded.invited_by, invited_at = now(), accepted_at = null, revoked_at = null;
  perform public.app_notify(v_user, 'STAFF_INVITE', 'คุณได้รับคำเชิญเข้าทีมร้าน',
    (select name from public.bars where id = p_bar), '/accept-invite', null, p_bar);
  return jsonb_build_object('bar_id', p_bar, 'user_id', v_user, 'role', p_role);
end $$;

create or replace function public.app_respond_invite(p_actor uuid, p_bar uuid, p_accept boolean) returns jsonb
language plpgsql set search_path = '' as $$
declare u public.users; s public.bar_staff;
begin
  u := public.app_assert_user(p_actor);
  select * into s from public.bar_staff where bar_id = p_bar and user_id = p_actor and accepted_at is null and revoked_at is null for update;
  if not found then raise exception 'INVITE_NOT_FOUND' using errcode = 'P0002'; end if;
  if not p_accept then
    update public.bar_staff set revoked_at = now() where bar_id = p_bar and user_id = p_actor;
    return jsonb_build_object('bar_id', p_bar, 'accepted', false);
  end if;
  update public.bar_staff set accepted_at = now() where bar_id = p_bar and user_id = p_actor;
  -- สิทธิ์เมนูร้านในเว็บอิง users.role: เจ้าของ/ผู้จัดการ = MERCHANT · พนักงาน = STAFF (ไม่ลดสิทธิ์ที่สูงกว่า)
  update public.users set role = case when s.role = 'STAFF' and role = 'CUSTOMER' then 'STAFF'::public.user_role
                                      when s.role <> 'STAFF' and role in ('CUSTOMER','STAFF') then 'MERCHANT'::public.user_role
                                      else role end
   where id = p_actor;
  perform public.app_notify_team(p_bar, 'STAFF_JOINED', 'มีสมาชิกใหม่ในทีม', u.display_name, '/merchant/staff');
  return jsonb_build_object('bar_id', p_bar, 'accepted', true, 'role', s.role);
end $$;

create or replace function public.app_remove_staff(p_actor uuid, p_bar uuid, p_user uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare r public.bar_staff_role; target public.bar_staff;
begin
  perform public.app_assert_user(p_actor);
  r := public.app_assert_manager(p_actor, p_bar);
  if p_user = p_actor then raise exception 'CANNOT_REMOVE_SELF' using errcode = 'P0001'; end if;
  select * into target from public.bar_staff where bar_id = p_bar and user_id = p_user and revoked_at is null;
  if not found then raise exception 'MEMBER_NOT_FOUND' using errcode = 'P0002'; end if;
  if target.role = 'OWNER' and r <> 'OWNER' then raise exception 'NOT_BAR_OWNER' using errcode = '42501'; end if;
  update public.bar_staff set revoked_at = now() where bar_id = p_bar and user_id = p_user;
  return jsonb_build_object('bar_id', p_bar, 'user_id', p_user, 'removed', true);
end $$;

-- สมัครเป็นร้าน {name, category, district_id, address, license} → ร้านสถานะ PENDING_REVIEW + ผู้สมัครเป็นเจ้าของ
-- ผู้สมัครได้ role MERCHANT ทันทีเพื่อเตรียมเมนู/โต๊ะ ระหว่างรอตรวจ (ลูกค้ายังไม่เห็นร้านจนกว่าแอดมินอนุมัติ)
create or replace function public.app_merchant_join(p_actor uuid, p jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare u public.users; v_id uuid; v_slug text;
begin
  u := public.app_assert_user(p_actor);
  if exists (select 1 from public.bars b join public.bar_staff s on s.bar_id = b.id
             where s.user_id = p_actor and s.role = 'OWNER' and s.revoked_at is null and b.status in ('DRAFT','PENDING_REVIEW')) then
    raise exception 'APPLICATION_PENDING' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p->>'name', ''))) not between 1 and 80 or coalesce(trim(p->>'address'), '') = '' then
    raise exception 'INVALID_BAR_INFO' using errcode = '22023';
  end if;
  loop
    v_slug := 'bar-' || substr(encode(extensions.gen_random_bytes(5), 'hex'), 1, 8);
    exit when not exists (select 1 from public.bars where slug = v_slug::extensions.citext);
  end loop;
  insert into public.bars (owner_id, slug, name, category, address, district_id, lat, lng, status)
  values (p_actor, v_slug, trim(p->>'name'), (p->>'category')::public.bar_category, trim(p->>'address'),
          nullif(p->>'district_id', '')::uuid, 13.756300, 100.501800, 'PENDING_REVIEW')
  returning id into v_id;
  if coalesce(trim(p->>'license'), '') <> '' then
    insert into public.bar_verifications (bar_id, document_type, storage_path, note)
    values (v_id, 'LICENSE_NUMBER', '', trim(p->>'license'));
  end if;
  update public.users set role = 'MERCHANT' where id = p_actor and role in ('CUSTOMER','STAFF');
  perform public.app_notify_admins('BAR_APPLICATION', 'มีร้านสมัครใหม่รอตรวจ', trim(p->>'name') || ' · ' || u.email, '/merchants', null, v_id);
  return jsonb_build_object('id', v_id, 'slug', v_slug, 'status', 'PENDING_REVIEW');
end $$;

-- ---------------------------------------------------------------------
-- 6. แอดมิน: ตรวจถ้อยคำโปรโมชันของร้าน
-- ---------------------------------------------------------------------
create or replace function public.admin_moderate_bar_promotion(p_actor uuid, p_promotion uuid, p_approve boolean, p_reason text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare pr public.bar_promotions;
begin
  perform public.admin_assert(p_actor);
  select * into pr from public.bar_promotions where id = p_promotion for update;
  if not found then raise exception 'PROMOTION_NOT_FOUND' using errcode = 'P0002'; end if;
  update public.bar_promotions
     set moderation_status = case when p_approve then 'APPROVED'::public.moderation_status else 'REJECTED'::public.moderation_status end,
         moderated_by = p_actor
   where id = p_promotion;
  perform public.app_notify_team(pr.bar_id, 'PROMOTION_TEXT_REVIEWED',
    case when p_approve then 'โปรโมชันผ่านการตรวจแล้ว' else 'โปรโมชันไม่ผ่านการตรวจ' end,
    pr.title || coalesce(' · ' || nullif(trim(p_reason), ''), ''), '/merchant/promotions');
  perform public.admin_audit(p_actor, case when p_approve then 'bar_promotion.approve' else 'bar_promotion.reject' end,
    'bar_promotions', p_promotion, jsonb_build_object('moderation_status', pr.moderation_status),
    jsonb_build_object('approve', p_approve, 'reason', p_reason));
  return jsonb_build_object('id', p_promotion, 'moderation_status', case when p_approve then 'APPROVED' else 'REJECTED' end);
end $$;

create view public.admin_bar_promotions with (security_invoker = true) as
select pr.id, pr.title, pr.description, pr.cutoff_time, pr.days_of_week, pr.active, pr.moderation_status,
       pr.created_at, pr.updated_at, jsonb_build_object('id', b.id, 'name', b.name) as bar
from public.bar_promotions pr
join public.bars b on b.id = pr.bar_id
where public.is_admin();

-- ---------------------------------------------------------------------
-- 7. trigger ผลข้างเคียงของการเปลี่ยนสถานะ (ใช้ทั้งจากลูกค้า ร้าน แอดมิน และ job)
-- ---------------------------------------------------------------------
create or replace function public.handle_booking_status_effects() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_bar public.bars; v_settings public.bar_booking_settings; v_title text; v_link text := '/bookings/' || new.id;
  v_base numeric; v_rule public.commission_rules; v_amount numeric; v_pct numeric;
begin
  select * into v_bar from public.bars where id = new.bar_id;

  -- มัดจำที่แพลตฟอร์มถือไว้ (HELD)
  if new.status in ('CHECKED_IN', 'NO_SHOW') then
    update public.deposits set settlement = 'PAYOUT_PENDING', settled_at = now()
     where booking_id = new.id and status = 'VERIFIED' and settlement = 'HELD';
  elsif new.status in ('CANCELLED_BY_MERCHANT', 'REJECTED') then
    update public.deposits set settlement = 'REFUND_PENDING', settled_at = now()
     where booking_id = new.id and status = 'VERIFIED' and settlement = 'HELD';
  elsif new.status = 'CANCELLED_BY_CUSTOMER' then
    select * into v_settings from public.bar_booking_settings where bar_id = new.bar_id;
    update public.deposits
       set settlement = case when now() <= new.booking_datetime - make_interval(hours => coalesce(v_settings.refund_before_hours, 24))
                             then 'REFUND_PENDING'::public.deposit_settlement else 'PAYOUT_PENDING'::public.deposit_settlement end,
           settled_at = now()
     where booking_id = new.id and status = 'VERIFIED' and settlement = 'HELD';
  end if;

  -- สถิติ + ค่าคอม
  if new.status in ('CHECKED_IN', 'NO_SHOW') then
    if new.status = 'CHECKED_IN' then
      update public.bar_stats set checkin_count = checkin_count + 1 where bar_id = new.bar_id;
    end if;
    select coalesce(avg_price_per_person, 0) * new.pax into v_base from public.bar_stats where bar_id = new.bar_id;
    v_base := coalesce(v_base, 0);
    select * into v_rule from public.commission_rules
     where bar_id = new.bar_id and effective_from <= new.booking_datetime
       and (effective_to is null or effective_to > new.booking_datetime)
     order by effective_from desc limit 1;
    if new.status = 'CHECKED_IN' then
      if v_rule.id is null then
        select coalesce((value #>> '{}')::numeric, 10) into v_pct from public.platform_settings where key = 'default_commission_percent';
        v_amount := round(v_base * coalesce(v_pct, 10) / 100, 2);
      else
        v_amount := case v_rule.calculation_type when 'PERCENTAGE' then round(v_base * v_rule.rate / 100, 2)
                                                 when 'FIXED' then v_rule.rate
                                                 else v_rule.rate * new.pax end;
      end if;
    else
      v_amount := case when v_rule.id is not null and v_rule.charge_on_no_show then round(v_base * coalesce(v_rule.no_show_rate, 0) / 100, 2) else 0 end;
    end if;
    insert into public.billing_events (booking_id, bar_id, event_type, commission_rule_id, base_amount, amount, status, period)
    values (new.id, new.bar_id, case when new.status = 'CHECKED_IN' then 'CHECK_IN'::public.billing_event_type else 'NO_SHOW'::public.billing_event_type end,
            v_rule.id, v_base, v_amount, case when v_amount > 0 then 'PENDING'::public.billing_status else 'WAIVED'::public.billing_status end,
            date_trunc('month', new.booking_datetime at time zone 'Asia/Bangkok')::date)
    on conflict (booking_id, event_type) do nothing;
  end if;

  -- แจ้งลูกค้า
  v_title := case new.status
    when 'CONFIRMED'             then case when old.status = 'DEPOSIT_SUBMITTED' then 'NightOut ตรวจสลิปแล้ว โต๊ะของคุณยืนยันแล้ว' else 'ร้านยืนยันการจองแล้ว' end
    when 'AWAITING_DEPOSIT'      then 'สลิปไม่ผ่าน กรุณาส่งใหม่'
    when 'REJECTED'              then 'ร้านไม่สามารถรับการจองนี้ได้'
    when 'CANCELLED_BY_MERCHANT' then 'ร้านยกเลิกการจอง'
    when 'CHECKED_IN'            then 'เช็กอินสำเร็จ ขอให้สนุกนะ!'
    when 'COMPLETED'             then 'ขอบคุณที่ใช้บริการ — รีวิวร้านได้แล้ว'
    when 'NO_SHOW'               then 'การจองถูกยกเลิกเพราะเลยเวลาที่กำหนด'
    when 'EXPIRED'               then 'การจองหมดเวลา'
    else null end;
  if v_title is not null then
    perform public.app_notify(new.user_id, 'BOOKING_' || new.status, v_title,
      v_bar.name || ' · ' || public.app_fmt(new.booking_datetime),
      case when new.status = 'AWAITING_DEPOSIT' then v_link || '/deposit'
           when new.status = 'COMPLETED' then '/reviews/new?booking=' || new.id else v_link end,
      new.id, new.bar_id);
  end if;
  if new.status = 'CONFIRMED' and old.status = 'DEPOSIT_SUBMITTED' then
    perform public.app_notify_team(new.bar_id, 'BOOKING_CONFIRMED', 'NightOut ยืนยันมัดจำแล้ว',
      new.code || ' · ' || public.app_fmt(new.booking_datetime), '/merchant/bookings', new.id);
  end if;
  return new;
end $$;
create trigger bookings_status_effects after update of status on public.bookings
  for each row when (old.status is distinct from new.status) execute function public.handle_booking_status_effects();

-- แจ้งเจ้าของร้านเมื่อแอดมินเปลี่ยนสถานะร้าน / ผลโปรโมท
create or replace function public.handle_bar_status_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.app_notify_team(new.id, 'BAR_' || new.status,
    case new.status when 'APPROVED' then 'ร้านของคุณเปิดแสดงบน NightOut แล้ว'
                    when 'REJECTED' then 'ร้านของคุณยังไม่ผ่านการตรวจ'
                    when 'SUSPENDED' then 'ร้านของคุณถูกระงับชั่วคราว'
                    else 'สถานะร้านเปลี่ยนเป็น ' || new.status end,
    new.name || coalesce(' · ' || new.status_reason, ''), '/merchant');
  return new;
end $$;
create trigger bars_status_notify after update of status on public.bars
  for each row when (old.status is distinct from new.status) execute function public.handle_bar_status_notify();

create or replace function public.handle_promoted_listing_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('ACTIVE', 'REJECTED') then
    perform public.app_notify_team(new.bar_id, 'PROMOTION_' || new.status,
      case when new.status = 'ACTIVE' then 'โปรโมทร้านเริ่มแสดงแล้ว' else 'สลิปโปรโมทไม่ผ่าน' end,
      coalesce(new.reject_reason, 'ถึง ' || public.app_fmt(new.ends_at)), '/merchant/promote');
  end if;
  return new;
end $$;
create trigger promoted_listings_notify after update of status on public.promoted_listings
  for each row when (old.status is distinct from new.status) execute function public.handle_promoted_listing_notify();

-- ---------------------------------------------------------------------
-- 8. job: หมดเวลา / ไม่มาตามนัด / ปิดโต๊ะ (pg_cron → NestJS /api/jobs/booking-timeouts → rpc นี้)
-- ---------------------------------------------------------------------
create or replace function public.run_booking_timeouts() returns jsonb
language plpgsql set search_path = '' as $$
declare v_expired integer; v_noshow integer; v_completed integer; v_run bigint;
begin
  insert into public.job_runs (job) values ('booking_timeouts') returning id into v_run;
  perform set_config('app.user_id', '', true);
  perform set_config('app.reason', 'timeout', true);
  update public.bookings set status = 'EXPIRED'
   where status in ('PENDING', 'AWAITING_DEPOSIT') and (expires_at < now() or auto_cancel_at < now());
  get diagnostics v_expired = row_count;
  update public.bookings set status = 'NO_SHOW' where status = 'CONFIRMED' and auto_cancel_at < now();
  get diagnostics v_noshow = row_count;
  update public.bookings set status = 'COMPLETED' where status = 'CHECKED_IN' and reserved_until < now();
  get diagnostics v_completed = row_count;
  update public.job_runs set finished_at = now(), processed = v_expired + v_noshow + v_completed where id = v_run;
  return jsonb_build_object('expired', v_expired, 'no_show', v_noshow, 'completed', v_completed);
end $$;

-- ---------------------------------------------------------------------
-- 9. view / RPC ที่หน้าเว็บอ่าน
-- ---------------------------------------------------------------------
-- booking_detail: + ชื่อลูกค้า (ทีมร้านเห็น) + ลิงก์แชร์ + รีวิวแล้วหรือยัง (เพิ่มคอลัมน์ท้ายสุด)
create or replace view public.booking_detail with (security_invoker = true) as
select
  bk.id, bk.code, bk.status, bk.user_id, (bk.user_id = auth.uid()) as is_mine,
  bk.booking_datetime, bk.reserved_from, bk.reserved_until, bk.pax, bk.customer_note, bk.request_pr,
  bk.deposit_required, bk.deposit_policy_snapshot, bk.grace_minutes, bk.auto_cancel_at, bk.expires_at,
  bk.confirmed_at, bk.checked_in_at, bk.completed_at, bk.cancelled_at, bk.cancel_reason,
  case when b.id is null then null else jsonb_build_object(
    'id', b.id, 'slug', b.slug, 'name', b.name, 'address', b.address, 'lat', b.lat, 'lng', b.lng,
    'cover_image_url', b.cover_image_url, 'cover_style', b.cover_style) end            as bar,
  case when z.id is null then null else jsonb_build_object('id', z.id, 'name', z.name) end as zone,
  case when t.id is null then null else jsonb_build_object('id', t.id, 'name', t.name, 'seats', t.seats) end as "table",
  case when bp.id is null then null else jsonb_build_object(
    'id', bp.promotion_id, 'title', bp.title_snapshot, 'perk', bp.perk_snapshot, 'redeemed_at', bp.redeemed_at) end as promotion,
  case when ps.id is null then null else jsonb_build_object(
    'items', ps.items, 'subtotal', ps.subtotal, 'service_charge_rate', ps.service_charge_rate, 'vat_rate', ps.vat_rate,
    'other_fees', ps.other_fees, 'estimated_total', ps.estimated_total, 'per_person', ps.per_person) end as price_estimate,
  case when pk.id is null then null else jsonb_build_object(
    'package_id', pk.package_id, 'name', pk.package_name, 'items', pk.items, 'price', pk.package_price, 'fees', pk.fees) end as package,
  public.booking_deposit_summary(bk.id)                          as deposit,
  case when ci.id is null then null else jsonb_build_object(
    'checked_in_at', ci.checked_in_at, 'method', ci.method, 'actual_pax', ci.actual_pax) end as checkin,
  coalesce((select jsonb_agg(jsonb_build_object(
              'from_status', h.from_status, 'to_status', h.to_status, 'reason', h.reason, 'created_at', h.created_at)
            order by h.created_at, h.id)
            from public.booking_status_history h where h.booking_id = bk.id), '[]'::jsonb) as status_history,
  bk.created_at,
  bk.updated_at,
  public.booking_customer_name(bk.user_id, bk.bar_id)            as customer_name,
  (select s.share_token from public.booking_shares s where s.booking_id = bk.id and s.revoked_at is null
   order by s.created_at limit 1)                                as share_token,
  exists (select 1 from public.reviews r where r.booking_id = bk.id) as has_review
from public.bookings bk
left join public.bars                      b  on b.id  = bk.bar_id
left join public.table_zones               z  on z.id  = bk.zone_id
left join public.tables                    t  on t.id  = bk.table_id
left join public.booking_promotions        bp on bp.booking_id = bk.id
left join public.booking_price_snapshots   ps on ps.booking_id = bk.id
left join public.booking_package_snapshots pk on pk.booking_id = bk.id
left join public.checkins                  ci on ci.booking_id = bk.id;

-- ร้านของฉัน (ทุกสถานะ) รูปแบบเดียวกับ bar_detail + สถานะ/บทบาท/บัญชีรับเงิน/โปรที่รอตรวจ
create view public.my_bar_detail with (security_invoker = true) as
select
  b.id, b.slug, b.name, b.category, b.lat, b.lng, b.cover_image_url, b.cover_style,
  case when d.id is null then null else jsonb_build_object('id', d.id, 'slug', d.slug, 'name_th', d.name_th) end as district,
  coalesce((select jsonb_agg(s.key order by s.sort_order, s.key)
            from public.bar_styles bs join public.styles s on s.id = bs.style_id where bs.bar_id = b.id), '[]'::jsonb) as styles,
  exists (select 1 from public.bar_pr_counts p where p.bar_id = b.id) as has_pr,
  (select jsonb_build_object(
            'male',   coalesce(max(p.pr_count) filter (where p.gender = 'MALE'),   0),
            'female', coalesce(max(p.pr_count) filter (where p.gender = 'FEMALE'), 0),
            'lgbtq',  coalesce(max(p.pr_count) filter (where p.gender = 'LGBTQ'),  0))
   from public.bar_pr_counts p where p.bar_id = b.id) as pr_counts,
  st.current_stars, st.current_tier, coalesce(st.is_new, true) as is_new, st.rating_avg,
  coalesce(st.rating_count, 0) as rating_count, coalesce(st.checkin_count, 0) as checkin_count,
  st.avg_price_per_person, st.safety_score, st.score, ls.current_crowd, ls.crowd_updated_at,
  coalesce(st.is_editor_pick, false) as is_editor_pick, public.bar_is_promoted(b.id) as is_promoted,
  b.description, b.address, b.phone, b.perks,
  coalesce((select jsonb_agg(jsonb_build_object(
              'day_of_week', h.day_of_week, 'open_time', to_char(h.open_time, 'HH24:MI'),
              'close_time', to_char(h.close_time, 'HH24:MI'), 'is_closed', h.is_closed) order by h.day_of_week)
            from public.bar_hours h where h.bar_id = b.id), '[]'::jsonb) as hours,
  coalesce((select jsonb_agg(jsonb_build_object('type', l.type, 'url', l.url) order by l.sort_order, l.created_at)
            from public.bar_links l where l.bar_id = b.id), '[]'::jsonb) as links,
  case when bs.bar_id is null then null else jsonb_build_object(
    'deposit_amount', bs.deposit_amount, 'deposit_unit', bs.deposit_unit, 'deposit_policy', bs.deposit_policy,
    'refund_before_hours', bs.refund_before_hours, 'grace_minutes', bs.grace_minutes,
    'pending_timeout_minutes', bs.pending_timeout_minutes, 'deposit_timeout_minutes', bs.deposit_timeout_minutes,
    'max_pax_per_booking', bs.max_pax_per_booking, 'min_advance_minutes', bs.min_advance_minutes,
    'max_advance_days', bs.max_advance_days) end as booking_settings,
  coalesce((select jsonb_agg(jsonb_build_object('fee_type', f.fee_type, 'label', f.label, 'calc', f.calc, 'value', f.value)
            order by f.apply_order, f.created_at) from public.bar_fees f where f.bar_id = b.id and f.active), '[]'::jsonb) as fees,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', mi.id, 'category', mc.name, 'name', mi.name, 'description', mi.description, 'price', mi.price,
              'unit_label', mi.unit_label, 'image_path', mi.image_path, 'is_available', mi.is_available)
            order by mi.sort_order, mi.name)
            from public.menu_items mi left join public.menu_categories mc on mc.id = mi.category_id
            where mi.bar_id = b.id), '[]'::jsonb) as menu,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', pp.id, 'name', pp.name, 'description', pp.description, 'pax_min', pp.pax_min, 'pax_max', pp.pax_max,
              'total_price', pp.total_price, 'fees_included', pp.fees_included,
              'items', coalesce((select jsonb_agg(jsonb_build_object('menu_item_id', pi.menu_item_id, 'name', pi.name_snapshot,
                                   'quantity', pi.quantity, 'unit_price', pi.unit_price_snapshot) order by pi.sort_order, pi.name_snapshot)
                                 from public.price_package_items pi where pi.package_id = pp.id), '[]'::jsonb))
            order by pp.pax_min, pp.name)
            from public.price_packages pp where pp.bar_id = b.id and pp.active), '[]'::jsonb) as packages,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', pr.id, 'title', pr.title, 'description', pr.description, 'perk_type', pr.perk_type,
              'discount_percent', pr.discount_percent, 'days_of_week', to_jsonb(pr.days_of_week),
              'valid_from', pr.valid_from, 'valid_to', pr.valid_to, 'cutoff_time', to_char(pr.cutoff_time, 'HH24:MI'),
              'min_pax', pr.min_pax, 'active', pr.active, 'moderation_status', pr.moderation_status)
            order by pr.sort_order, pr.created_at)
            from public.bar_promotions pr where pr.bar_id = b.id), '[]'::jsonb) as promotions,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', z.id, 'name', z.name, 'capacity_pax', z.capacity_pax,
              'default_duration_minutes', z.default_duration_minutes, 'allow_zone_only_booking', z.allow_zone_only_booking,
              'tables', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'seats', t.seats) order by t.name)
                                  from public.tables t where t.zone_id = z.id and t.active), '[]'::jsonb))
            order by z.sort_order, z.name)
            from public.table_zones z where z.bar_id = b.id and z.active), '[]'::jsonb) as zones,
  coalesce((select jsonb_agg(jsonb_build_object(
              'key', sf.key, 'name_th', sf.name_th, 'icon', sf.icon, 'value', coalesce(bsf.value, 'UNKNOWN'),
              'source', bsf.source, 'verified_at', bsf.verified_at) order by sf.sort_order, sf.key)
            from public.safety_features sf
            left join public.bar_safety_features bsf on bsf.feature_key = sf.key and bsf.bar_id = b.id), '[]'::jsonb) as safety,
  b.status, b.status_reason, m.role as staff_role,
  (select jsonb_build_object('bank_code', pa.bank_code, 'account_name', pa.account_name,
                             'account_no_last4', pa.account_no_last4, 'verified_at', pa.verified_at)
   from public.bar_payout_accounts pa where pa.bar_id = b.id and pa.is_default) as payout_account,
  b.created_at, b.updated_at
from public.bars b
join public.bar_staff m on m.bar_id = b.id and m.user_id = auth.uid() and m.accepted_at is not null and m.revoked_at is null
left join public.districts            d  on d.id = b.district_id
left join public.bar_stats            st on st.bar_id = b.id
left join public.bar_live_status      ls on ls.bar_id = b.id
left join public.bar_booking_settings bs on bs.bar_id = b.id;

-- รีวิวของฉัน (ทุกสถานะ)
create view public.my_reviews with (security_invoker = true) as
select r.id, r.booking_id, r.bar_id, r.rating, r.comment, r.status, r.created_at,
       jsonb_build_object('id', b.id, 'slug', b.slug, 'name', b.name) as bar,
       coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'storage_path', m.storage_path,
                   'thumb_path', m.thumb_path, 'duration_sec', m.duration_sec) order by m.sort_order, m.created_at)
                 from public.review_media m where m.review_id = r.id), '[]'::jsonb) as media
from public.reviews r
join public.bars b on b.id = r.bar_id
where r.user_id = auth.uid();

-- public_reviews: + booking_id ของผู้อ่านเอง (ใช้กันรีวิวซ้ำในหน้าเว็บ) ไม่ได้ — คงเดิม

-- โซนว่างตอนเลือกเวลาจอง (ลูกค้าเห็นการจองของคนอื่นไม่ได้ → นับให้ฝั่ง DB)
create or replace function public.zone_availability(p_bar uuid, p_datetime timestamptz)
returns table (zone_id uuid, zone_name text, capacity_pax integer, remaining_pax integer, free_tables integer,
               total_tables integer, "full" boolean)
language sql stable security definer set search_path = '' as $$
  with z as (
    select z.*, tstzrange(p_datetime, p_datetime + make_interval(mins => z.default_duration_minutes), '[)') as win
    from public.table_zones z
    where z.bar_id = p_bar and z.active and (public.bar_is_public(p_bar) or public.is_bar_member(p_bar))
  ), x as (
    select z.id, z.name, z.capacity_pax::integer as cap, z.sort_order, z.allow_zone_only_booking,
      z.capacity_pax - coalesce((select sum(bk.pax) from public.bookings bk
                                 where bk.zone_id = z.id and bk.reserved_period && z.win
                                   and bk.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')), 0) as remaining,
      (select count(*) from public.tables t where t.zone_id = z.id and t.active
         and not exists (select 1 from public.bookings bk where bk.table_id = t.id and bk.reserved_period && z.win
                           and bk.status in ('PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','CHECKED_IN')))::integer as free_t,
      (select count(*) from public.tables t where t.zone_id = z.id and t.active)::integer as total_t
    from z
  )
  select id, name, cap, greatest(remaining, 0)::integer, free_t, total_t,
         (remaining <= 0 or (total_t > 0 and free_t = 0) or (total_t = 0 and not allow_zone_only_booking))
  from x order by sort_order, name
$$;

-- สมุดมัดจำของร้าน (ไม่มี path สลิป — ร้านห้ามเห็นสลิปลูกค้า)
create or replace function public.bar_deposit_ledger(p_bar uuid)
returns table (deposit_id uuid, booking_id uuid, booking_code text, booking_datetime timestamptz, customer_name text,
               amount numeric, status public.deposit_status, settlement public.deposit_settlement,
               verified_at timestamptz, settled_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, bk.id, bk.code, bk.booking_datetime, u.display_name, d.amount, d.status, d.settlement,
         d.verified_at, d.settled_at, d.created_at
  from public.deposits d
  join public.bookings bk on bk.id = d.booking_id
  left join public.users u on u.id = bk.user_id
  where d.bar_id = p_bar and public.is_bar_member(p_bar)
  order by bk.booking_datetime desc, d.created_at desc
$$;

-- สมาชิกทีมร้าน (รวมคำเชิญที่ยังไม่ตอบ)
create or replace function public.bar_team(p_bar uuid)
returns table (user_id uuid, display_name text, email text, role public.bar_staff_role, invited_at timestamptz, accepted_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.user_id, u.display_name, u.email::text, s.role, s.invited_at, s.accepted_at
  from public.bar_staff s join public.users u on u.id = s.user_id
  where s.bar_id = p_bar and s.revoked_at is null and public.is_bar_member(p_bar)
  order by (s.role = 'OWNER') desc, s.accepted_at nulls last, u.display_name
$$;

-- คำเชิญเข้าทีมร้านที่รอฉันตอบ
create or replace function public.my_invites()
returns table (bar_id uuid, bar_name text, role public.bar_staff_role, invited_at timestamptz, invited_by text)
language sql stable security definer set search_path = '' as $$
  select s.bar_id, b.name, s.role, s.invited_at, iu.display_name
  from public.bar_staff s
  join public.bars b on b.id = s.bar_id
  left join public.users iu on iu.id = s.invited_by
  where s.user_id = auth.uid() and s.accepted_at is null and s.revoked_at is null
  order by s.invited_at desc
$$;

-- ---------------------------------------------------------------------
-- 10. สิทธิ์
-- ---------------------------------------------------------------------
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and (p.proname like 'app\_%' or p.proname in ('admin_moderate_bar_promotion', 'run_booking_timeouts')) loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;
-- ใช้ภายใน view (ต้องให้ผู้เรียก view เรียกได้)
grant execute on function public.booking_customer_name(uuid, uuid) to authenticated;
grant execute on function public.app_fmt(timestamptz) to authenticated, service_role;
grant execute on function public.zone_availability(uuid, timestamptz) to anon, authenticated;
grant execute on function public.bar_deposit_ledger(uuid), public.bar_team(uuid), public.my_invites() to authenticated;
revoke execute on function public.bar_deposit_ledger(uuid), public.bar_team(uuid), public.my_invites() from anon, public;

grant select on public.my_bar_detail, public.my_reviews, public.booking_detail to authenticated;
revoke select on public.my_bar_detail, public.my_reviews, public.booking_detail from anon;
grant select on public.admin_bar_promotions to authenticated;
revoke select on public.admin_bar_promotions from anon;

-- index ของคอลัมน์ที่ trigger/ฟังก์ชันใหม่ค้นบ่อย
create index if not exists booking_shares_booking on public.booking_shares (booking_id);
create index if not exists billing_events_booking on public.billing_events (booking_id);
