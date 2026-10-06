-- =====================================================================
-- NightOut · เฟส 2 / 14 — PDPA retention + ตัวรัน job
--
-- ตัวรัน job (ข้อ 8.2): pg_cron เรียก NestJS /api/jobs/* ด้วย pg_net ทุกนาที (no-show, expire, complete, แจ้งเตือน)
--   ตั้งค่าหลัง deploy: เก็บ api_url + job_secret ใน Supabase Vault แล้วรันคำสั่งด้านล่างใน SQL editor
--   (ไม่ใส่ใน migration เพราะต้องใช้ secret ของแต่ละ environment)
--
--   select cron.schedule('nightout-booking-timeouts', '* * * * *', $$
--     select net.http_post(
--       url     := (select decrypted_secret from vault.decrypted_secrets where name = 'api_url') || '/api/jobs/booking-timeouts',
--       headers := jsonb_build_object('x-job-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'job_secret')))
--   $$);
--   -- เช่นเดียวกัน: /api/jobs/notifications (ทุกนาที), /api/jobs/promoted-listings (ทุกนาที),
--   -- /api/jobs/tier?period=WEEKLY ('5 17 * * 0' = 00:05 จันทร์เวลาไทย), /api/jobs/slip-cleanup ('0 20 * * *')
--   select cron.schedule('nightout-retention', '30 19 * * *', $$ select public.run_retention_jobs() $$);  -- 02:30 เวลาไทย
-- =====================================================================
set search_path = public, extensions;

-- ล้างข้อมูลส่วนตัวของบัญชีที่ขอลบ (users.deleted_at) เมื่อเลย retention
-- + ล้างเบอร์ติดต่อในการจองที่จบไปนานกว่า retention
-- ค่า retention อยู่ใน platform_settings: account_retention_days, contact_phone_retention_days
create or replace function public.run_retention_jobs() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_account_days integer := coalesce((select (value #>> '{}')::integer from public.platform_settings where key = 'account_retention_days'), 30);
  v_phone_days   integer := coalesce((select (value #>> '{}')::integer from public.platform_settings where key = 'contact_phone_retention_days'), 90);
  v_users  integer;
  v_phones integer;
  v_run    bigint;
begin
  insert into public.job_runs (job) values ('retention') returning id into v_run;

  with targets as (
    select id from public.users
    where deleted_at is not null and anonymized_at is null
      and deleted_at < now() - make_interval(days => v_account_days)
  ), wiped as (
    update public.users u set
      email             = 'deleted+' || u.id || '@nightout.invalid',
      display_name      = 'ผู้ใช้ที่ลบบัญชี',
      phone_e164        = null,
      phone_verified_at = null,
      avatar_url        = null,
      birthdate         = date '1900-01-01',
      anonymized_at     = now()
    from targets t where u.id = t.id
    returning u.id
  ), channels as (
    delete from public.notification_channels c using wiped w where c.user_id = w.id
  ), prefs as (
    update public.user_preferences p set preferred_style_ids = '{}', preferred_district_ids = '{}', budget_per_person = null
    from wiped w where p.user_id = w.id
  ), phones as (
    update public.bookings b set contact_phone = null
    from wiped w where b.user_id = w.id and b.contact_phone is not null
  )
  select count(*) into v_users from wiped;

  update public.bookings set contact_phone = null
  where contact_phone is not null
    and booking_datetime < now() - make_interval(days => v_phone_days);
  get diagnostics v_phones = row_count;

  update public.job_runs set finished_at = now(), processed = v_users + v_phones where id = v_run;
  return jsonb_build_object('users_anonymized', v_users, 'contact_phones_cleared', v_phones);
end $$;
revoke execute on function public.run_retention_jobs() from public, anon, authenticated;
