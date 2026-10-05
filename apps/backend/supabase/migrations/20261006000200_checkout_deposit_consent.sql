-- =====================================================================
-- NightOut · หน้า Checkout: ลูกค้าต้องติ๊กยอมรับเงื่อนไขริบมัดจำ + กรอกเบอร์โทร
--   - booking_deposit_consents: หลักฐานการยอมรับ 1 แถวต่อการจอง (แก้/ลบไม่ได้ แม้แต่ service_role)
--       เก็บข้อความที่ลูกค้าเห็นจริง + ค่าเงื่อนไขของร้าน ณ ตอนนั้น + IP + User-Agent + เวลา
--   - app_create_booking (ตัวใหม่) = ตรวจแบน → app_create_booking_core (ของเดิม …001700) → เบอร์ + consent
--       ทั้งหมดอยู่ในธุรกรรมเดียว: ไม่ติ๊ก/ไม่มีเบอร์/เบอร์โดนแบน → ไม่มีการจองเกิดขึ้น
--   - เบอร์ล่าสุดจำไว้ที่ users.phone_e164 (ถ้ายังไม่มีบัญชีอื่นใช้) → หน้า Checkout เติมให้ครั้งหน้า
-- =====================================================================
set search_path = public, extensions;

create table if not exists public.booking_deposit_consents (
  booking_id          uuid primary key references public.bookings(id),
  user_id             uuid not null references public.users(id),
  terms_version       text not null check (char_length(terms_version) between 1 and 40),
  terms_text          text not null check (char_length(terms_text) between 20 and 4000),  -- ข้อความที่แสดงข้าง checkbox
  deposit_amount      numeric(12,2) not null,
  refund_before_hours smallint not null,
  grace_minutes       smallint not null,
  deposit_policy      text,                                                           -- เงื่อนไขที่ร้านเขียนเอง (snapshot)
  ip                  inet,
  user_agent          text check (char_length(user_agent) <= 500),
  accepted_at         timestamptz not null default now()
);
create index if not exists booking_deposit_consents_user_id_fk on public.booking_deposit_consents (user_id);

-- หลักฐานต้องไม่ถูกแก้ย้อนหลัง
create or replace function public.forbid_consent_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'CONSENT_IMMUTABLE' using errcode = '42501';
end $$;
drop trigger if exists booking_deposit_consents_immutable on public.booking_deposit_consents;
create trigger booking_deposit_consents_immutable before update or delete on public.booking_deposit_consents
  for each row execute function public.forbid_consent_change();

alter table public.booking_deposit_consents enable row level security;
drop policy if exists consents_read_own on public.booking_deposit_consents;
create policy consents_read_own on public.booking_deposit_consents for select to authenticated using (user_id = auth.uid());
drop policy if exists admin_read on public.booking_deposit_consents;
create policy admin_read on public.booking_deposit_consents for select to authenticated using (public.is_admin());
revoke insert, update, delete, truncate on public.booking_deposit_consents from anon, authenticated;
revoke select on public.booking_deposit_consents from anon;

-- ---------------------------------------------------------------------
-- จองโต๊ะ (ตัวใหม่)
-- ---------------------------------------------------------------------
do $$ begin
  if to_regprocedure('public.app_create_booking_core(uuid, uuid, uuid, timestamptz, integer, uuid, text)') is null then
    alter function public.app_create_booking(uuid, uuid, uuid, timestamptz, integer, uuid, text) rename to app_create_booking_core;
  end if;
end $$;
drop function if exists public.app_create_booking(uuid, uuid, uuid, timestamptz, integer, uuid, text);

-- p_consent = { accepted: true, terms_version, terms_text, ip, user_agent } (ip / user_agent NestJS ใส่จาก request)
create or replace function public.app_create_booking(p_actor uuid, p_bar uuid, p_zone uuid, p_datetime timestamptz,
                                                     p_pax integer, p_promotion uuid default null, p_note text default null,
                                                     p_contact_phone text default null, p_consent jsonb default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_phone text := nullif(btrim(p_contact_phone), '');
  r jsonb; s public.bar_booking_settings; v_ip inet;
begin
  perform public.app_assert_user(p_actor);
  if v_phone is null then raise exception 'CONTACT_PHONE_REQUIRED' using errcode = '22023'; end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'INVALID_PHONE' using errcode = '22023'; end if;
  perform public.booking_ban_check(p_actor, v_phone);

  r := public.app_create_booking_core(p_actor, p_bar, p_zone, p_datetime, p_pax, p_promotion, p_note);
  update public.bookings set contact_phone = v_phone where id = (r->>'id')::uuid;

  -- มัดจำ > 0 ต้องยอมรับเงื่อนไขริบมัดจำ (ทุกการจองต้องมัดจำตามกฎธุรกิจ)
  if (r->>'deposit_required')::numeric > 0 then
    if p_consent is null or coalesce((p_consent->>'accepted')::boolean, false) is not true
       or nullif(btrim(p_consent->>'terms_text'), '') is null or nullif(btrim(p_consent->>'terms_version'), '') is null then
      raise exception 'DEPOSIT_TERMS_REQUIRED' using errcode = '22023';
    end if;
    select * into s from public.bar_booking_settings where bar_id = p_bar;
    begin
      v_ip := nullif(p_consent->>'ip', '')::inet;
    exception when others then
      v_ip := null;
    end;
    insert into public.booking_deposit_consents (booking_id, user_id, terms_version, terms_text, deposit_amount,
                                                 refund_before_hours, grace_minutes, deposit_policy, ip, user_agent)
    values ((r->>'id')::uuid, p_actor, btrim(p_consent->>'terms_version'), btrim(p_consent->>'terms_text'),
            (r->>'deposit_required')::numeric, s.refund_before_hours, s.grace_minutes, s.deposit_policy,
            v_ip, left(p_consent->>'user_agent', 500));
    perform public.app_audit(p_actor, 'booking.deposit_terms_accepted', 'bookings', (r->>'id')::uuid,
      jsonb_build_object('terms_version', btrim(p_consent->>'terms_version'), 'deposit_amount', r->'deposit_required'));
  end if;

  -- จำเบอร์ไว้เติมให้ครั้งหน้า (ข้ามถ้าบัญชีอื่นใช้เบอร์นี้อยู่ — unique)
  update public.users set phone_e164 = v_phone
   where id = p_actor and phone_e164 is distinct from v_phone
     and not exists (select 1 from public.users o where o.phone_e164 = v_phone and o.id <> p_actor);
  return r;
end $$;

-- ---------------------------------------------------------------------
-- Backoffice: เห็นเบอร์ + หลักฐานการยอมรับเงื่อนไขในหน้าการจอง
-- bookings.contact_phone ไม่ได้ grant ให้ authenticated (…000800) → view แบบ security_invoker อ่านตรงไม่ได้
-- จึงอ่านผ่านฟังก์ชันนี้ ซึ่งคืนค่าเฉพาะแอดมิน (ADMIN + MFA)
-- ---------------------------------------------------------------------
create or replace function public.admin_booking_contact_phone(p_booking uuid) returns text
language sql stable security definer set search_path = '' as $$
  select b.contact_phone from public.bookings b where b.id = p_booking and public.is_admin()
$$;
revoke all on function public.admin_booking_contact_phone(uuid) from public, anon;
grant execute on function public.admin_booking_contact_phone(uuid) to authenticated;

create or replace view public.admin_bookings with (security_invoker = true) as
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
            from public.booking_status_history h where h.booking_id = bk.id), '[]'::jsonb) as status_history,
  public.admin_booking_contact_phone(bk.id) as contact_phone,
  (select jsonb_build_object('terms_version', c.terms_version, 'terms_text', c.terms_text, 'deposit_amount', c.deposit_amount,
                             'refund_before_hours', c.refund_before_hours, 'grace_minutes', c.grace_minutes,
                             'deposit_policy', c.deposit_policy, 'ip', host(c.ip), 'user_agent', c.user_agent,
                             'accepted_at', c.accepted_at)
   from public.booking_deposit_consents c where c.booking_id = bk.id) as deposit_consent
from public.bookings bk
join public.bars b on b.id = bk.bar_id
left join public.users       u on u.id = bk.user_id
left join public.table_zones z on z.id = bk.zone_id
left join public.tables      t on t.id = bk.table_id
where public.is_admin();

revoke all on function public.app_create_booking_core(uuid, uuid, uuid, timestamptz, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.app_create_booking_core(uuid, uuid, uuid, timestamptz, integer, uuid, text) to service_role;
revoke all on function public.app_create_booking(uuid, uuid, uuid, timestamptz, integer, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.app_create_booking(uuid, uuid, uuid, timestamptz, integer, uuid, text, text, jsonb) to service_role;
revoke all on function public.forbid_consent_change() from public, anon, authenticated;
