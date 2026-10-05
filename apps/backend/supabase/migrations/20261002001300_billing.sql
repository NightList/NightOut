-- =====================================================================
-- NightOut · เฟส 2 / 13 — ค่าคอม · billing · invoice
-- ค่าคอมคิดจาก price snapshot (รอตัดสินใจ ข้อ 10.7 — อนาคตใช้ checkins.actual_spend)
-- =====================================================================
set search_path = public, extensions;

create table public.commission_rules (
  id                uuid primary key default gen_random_uuid(),
  bar_id            uuid not null references public.bars(id),
  calculation_type  public.commission_calc not null,
  rate              numeric(10,2) not null check (rate >= 0),   -- 5 = 5% หรือ 50 บาท
  charge_on_no_show boolean not null default false,
  no_show_rate      numeric(5,2) check (no_show_rate between 0 and 100),
  effective_from    timestamptz not null,
  effective_to      timestamptz,                         -- null = ยังมีผล
  created_by        uuid not null references public.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from),
  constraint commission_rules_no_overlap exclude using gist (
    bar_id with =, tstzrange(effective_from, coalesce(effective_to, 'infinity'), '[)') with &&)
);
create trigger commission_rules_updated_at before update on public.commission_rules for each row execute function public.set_updated_at();

create table public.invoices (
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid not null references public.bars(id),
  period     date not null,                              -- วันที่ 1 ของเดือน
  number     text not null unique,                       -- INV-202609-0001
  subtotal   numeric(12,2) not null,
  vat_amount numeric(12,2) not null default 0,
  total      numeric(12,2) not null,
  status     public.invoice_status not null default 'DRAFT',
  issued_at  timestamptz,
  paid_at    timestamptz,
  pdf_path   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bar_id, period)
);
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create table public.billing_events (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references public.bookings(id),
  bar_id             uuid not null references public.bars(id),
  event_type         public.billing_event_type not null,
  commission_rule_id uuid references public.commission_rules(id) on delete set null,
  base_amount        numeric(12,2) not null default 0,
  amount             numeric(12,2) not null default 0,
  status             public.billing_status not null default 'PENDING',
  period             date not null,                      -- เดือนของ booking_datetime (Asia/Bangkok)
  invoice_id         uuid references public.invoices(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (booking_id, event_type),
  constraint billing_events_booking_same_bar foreign key (booking_id, bar_id) references public.bookings (id, bar_id)
);
create index billing_events_period on public.billing_events (bar_id, period, status);
create trigger billing_events_updated_at before update on public.billing_events for each row execute function public.set_updated_at();

create policy commission_rules_read_team on public.commission_rules for select using (public.is_bar_member(bar_id));
create policy invoices_read_team         on public.invoices         for select using (public.is_bar_member(bar_id));
create policy billing_events_read_team   on public.billing_events   for select using (public.is_bar_member(bar_id));
