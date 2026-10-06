-- =====================================================================
-- NightOut · เฟส 1 / 1 — extensions + enums + ฟังก์ชันกลาง
-- ใช้คู่กับ docs/DATABASE.md และ docs/DATABASE_CHANGES.md (spec v1.1)
-- ทุก enum เป็น UPPER_SNAKE_CASE · เวลาเก็บเป็น timestamptz · timezone ธุรกิจ Asia/Bangkok
-- =====================================================================

-- Supabase เก็บ extension ไว้ใน schema `extensions` แต่ตอนรัน migration search_path ไม่มี schema นี้
create schema if not exists extensions;
create extension if not exists pgcrypto   with schema extensions;  -- gen_random_bytes()
create extension if not exists btree_gist with schema extensions;  -- exclusion constraint (uuid =, tstzrange &&)
create extension if not exists citext     with schema extensions;  -- email / slug ไม่สนตัวพิมพ์
create extension if not exists pg_trgm    with schema extensions;  -- ค้นชื่อร้านแบบ fuzzy
create extension if not exists postgis    with schema extensions;  -- พิกัด / ค้นร้านใกล้ฉัน
create extension if not exists pg_cron;                            -- job ทุกนาที → เรียก NestJS /api/jobs/*
create extension if not exists pg_net     with schema extensions;  -- pg_cron ยิง HTTP
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------
create type public.user_role               as enum ('CUSTOMER','MERCHANT','STAFF','ADMIN');
create type public.age_verification_method as enum ('SELF_DECLARED','ID_CHECK_AT_VENUE','EKYC');
create type public.consent_type            as enum ('TERMS','PRIVACY','COOKIE','AGE_CONFIRMATION','LOCATION','MARKETING','LINE_NOTIFICATION');
create type public.theme_mode              as enum ('LIGHT','DARK','SYSTEM');

create type public.notification_channel    as enum ('LINE','WEB_PUSH','IN_APP','EMAIL');
create type public.delivery_status         as enum ('QUEUED','SENT','FAILED','RETRYING');

create type public.bar_category            as enum ('PUB_BAR','CHILL','RESTAURANT');
create type public.bar_status              as enum ('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','SUSPENDED');
create type public.bar_staff_role          as enum ('OWNER','MANAGER','STAFF');
create type public.media_kind              as enum ('IMAGE','VIDEO');
create type public.link_type               as enum ('INSTAGRAM','TIKTOK','FACEBOOK','LINE_OA','WEBSITE','REVIEW_CLIP');
create type public.safety_value            as enum ('YES','NO','UNKNOWN');
create type public.safety_source           as enum ('SELF_DECLARED','ADMIN_VERIFIED');
create type public.safety_report_status    as enum ('OPEN','CONFIRMED','DISMISSED');
create type public.crowd_status            as enum ('AVAILABLE','ALMOST_FULL','FULL');
create type public.pr_gender               as enum ('MALE','FEMALE','LGBTQ');

create type public.fee_type                as enum ('SERVICE_CHARGE','VAT','CORKAGE','ENTRY','OTHER');
create type public.fee_calc                as enum ('PERCENTAGE','FIXED_PER_TABLE','FIXED_PER_PERSON');
create type public.perk_type               as enum ('FOOD_DISCOUNT','FREE_APPETIZER','FREE_SOFT_DRINK','WAIVE_ENTRY','WAIVE_TABLE_FEE','SPECIAL_ZONE','OTHER');
create type public.moderation_status       as enum ('PENDING','APPROVED','REJECTED');

create type public.deposit_unit            as enum ('PER_TABLE','PER_PERSON');
create type public.booking_status          as enum (
  'PENDING','AWAITING_DEPOSIT','DEPOSIT_SUBMITTED','CONFIRMED','REJECTED',
  'CANCELLED_BY_CUSTOMER','CANCELLED_BY_MERCHANT','CHECKED_IN','COMPLETED','NO_SHOW','EXPIRED');
create type public.checkin_method          as enum ('QR','MANUAL');
create type public.deposit_status          as enum ('SUBMITTED','VERIFIED','REJECTED');
create type public.deposit_settlement      as enum ('NONE','HELD','PAYOUT_PENDING','PAID_OUT','CREDIT','REFUND_PENDING','REFUNDED');
create type public.payout_status           as enum ('DRAFT','PENDING','PAID','CANCELLED');
create type public.credit_reason           as enum ('DEPOSIT_TO_CREDIT','CREDIT_USED','ADJUSTMENT');

create type public.review_status           as enum ('PUBLISHED','HIDDEN','REMOVED');
create type public.report_status           as enum ('OPEN','ACTIONED','DISMISSED');

create type public.rank_period             as enum ('WEEKLY','MONTHLY');
create type public.tier_letter             as enum ('S','A','B','C');

create type public.promo_placement         as enum ('HOME_BANNER','HOME_RECOMMENDED','SEARCH_TOP');
create type public.promoted_status         as enum ('PENDING_PAYMENT','PAYMENT_SUBMITTED','ACTIVE','EXPIRED','REJECTED','CANCELLED');
create type public.slip_status             as enum ('SUBMITTED','VERIFIED','REJECTED');

create type public.commission_calc         as enum ('PERCENTAGE','FIXED','FIXED_PER_PERSON');
create type public.billing_event_type      as enum ('CHECK_IN','NO_SHOW');
create type public.billing_status          as enum ('PENDING','INVOICED','PAID','WAIVED');
create type public.invoice_status          as enum ('DRAFT','ISSUED','PAID','VOID');

-- ---------------------------------------------------------------------
-- updated_at อัตโนมัติ (ทุกตารางหลัก)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
