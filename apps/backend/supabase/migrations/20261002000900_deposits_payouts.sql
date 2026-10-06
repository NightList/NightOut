-- =====================================================================
-- NightOut · เฟส 2 / 9 — เงินมัดจำ · รอบโอนให้ร้าน · เครดิตร้าน
-- ⚠️ DRAFT: ห้ามเปิดรับเงินจริงจนกว่าจะได้คำตอบเรื่องกฎหมายการรับเงินแทนร้าน (DATABASE_CHANGES.md ข้อ 10.3)
-- =====================================================================
set search_path = public, extensions;

create table public.bar_payouts (                        -- รอบโอนเงินให้ร้าน
  id                  uuid primary key default gen_random_uuid(),
  bar_id              uuid not null references public.bars(id),
  payout_account_id   uuid references public.bar_payout_accounts(id) on delete set null,
  amount              numeric(12,2) not null check (amount >= 0),
  commission_deducted numeric(12,2) not null default 0,
  status              public.payout_status not null default 'DRAFT',
  transfer_ref        text,
  transfer_slip_path  text,                              -- bucket payout-slips: <bar_id>/<file>
  paid_by             uuid references public.users(id) on delete set null,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger bar_payouts_updated_at before update on public.bar_payouts for each row execute function public.set_updated_at();

create table public.deposits (                           -- 1 แถวต่อการส่งสลิป (ส่งใหม่ได้ถ้าถูกปฏิเสธ)
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references public.bookings(id),
  bar_id          uuid not null references public.bars(id),
  amount          numeric(10,2) not null check (amount > 0),
  slip_path       text,                                  -- bucket deposit-slips: <user_id>/<booking_id>.<ext> · ลบตาม retention
  slip_ref        text,                                  -- trans ref จาก QR ในสลิป
  slip_amount     numeric(10,2),
  slip_paid_at    timestamptz,
  status          public.deposit_status not null default 'SUBMITTED',
  reject_reason   text,
  verified_by     uuid references public.users(id) on delete set null,
  verified_at     timestamptz,
  settlement      public.deposit_settlement not null default 'NONE',
  settled_at      timestamptz,
  payout_id       uuid references public.bar_payouts(id) on delete set null,
  refund_ref      text,
  refunded_at     timestamptz,
  slip_deleted_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint deposits_booking_same_bar foreign key (booking_id, bar_id) references public.bookings (id, bar_id),
  -- เงินขยับได้เมื่อสลิปผ่านแล้ว · ยกเว้นคืนเงิน (REFUND_PENDING) ตอนสลิปยังไม่ถูกตรวจ
  constraint deposits_settlement_needs_verified check (
    settlement = 'NONE'
    or status = 'VERIFIED'
    or (settlement = 'REFUND_PENDING' and status = 'SUBMITTED'))
);
create trigger deposits_updated_at before update on public.deposits for each row execute function public.set_updated_at();
create unique index deposits_one_active on public.deposits (booking_id) where status in ('SUBMITTED','VERIFIED');
create unique index deposits_slip_ref   on public.deposits (slip_ref) where slip_ref is not null and status <> 'REJECTED';  -- กันใช้สลิปซ้ำ
create index deposits_settlement        on public.deposits (bar_id, settlement);

create table public.bar_credit_ledger (                  -- เครดิตร้าน (+ เข้า / − ใช้) · append-only
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid not null references public.bars(id),
  deposit_id uuid references public.deposits(id) on delete set null,
  amount     numeric(12,2) not null,
  reason     public.credit_reason not null,
  note       text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bar_credit_ledger_updated_at before update on public.bar_credit_ledger for each row execute function public.set_updated_at();

create view public.bar_credit_balance with (security_invoker = true) as
  select bar_id, sum(amount) as balance from public.bar_credit_ledger group by bar_id;

-- ลูกค้ายกเลิก/ถูกปฏิเสธ ระหว่างรอตรวจสลิป → ตั้งคืนเงิน
create or replace function public.handle_booking_refund_on_cancel() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status = 'DEPOSIT_SUBMITTED' and new.status in ('CANCELLED_BY_CUSTOMER', 'REJECTED') then
    update public.deposits
       set settlement = 'REFUND_PENDING', settled_at = now()
     where booking_id = new.id and status = 'SUBMITTED' and settlement = 'NONE';
  end if;
  return new;
end $$;
create trigger bookings_refund_on_cancel after update of status on public.bookings
  for each row when (old.status is distinct from new.status) execute function public.handle_booking_refund_on_cancel();

-- สรุปมัดจำใน booking_detail (ไม่มี slip_path — สลิปเปิดผ่าน signed URL จาก NestJS)
create or replace function public.booking_deposit_summary(p_booking uuid) returns jsonb
language sql stable set search_path = '' as $$
  select case when d.id is null then null else jsonb_build_object(
    'id', d.id, 'amount', d.amount, 'status', d.status, 'reject_reason', d.reject_reason,
    'settlement', d.settlement, 'verified_at', d.verified_at, 'created_at', d.created_at) end
  from (select 1) x
  left join lateral (
    select * from public.deposits where booking_id = p_booking order by created_at desc limit 1) d on true
$$;

-- RLS (เปิดใน migration สุดท้าย): ลูกค้าเห็นมัดจำของตัวเอง · ร้านเห็นรอบโอน/เครดิตของร้าน (ร้านไม่เห็นสลิป)
create policy deposits_read_own on public.deposits for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy bar_payouts_read_team       on public.bar_payouts       for select using (public.is_bar_member(bar_id));
create policy bar_credit_ledger_read_team on public.bar_credit_ledger for select using (public.is_bar_member(bar_id));
