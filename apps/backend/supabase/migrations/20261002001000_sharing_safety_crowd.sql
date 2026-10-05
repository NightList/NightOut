-- =====================================================================
-- NightOut · เฟส 2 / 10 — แชร์การจอง · รายงานความปลอดภัย · log ความแน่นร้าน
-- =====================================================================
set search_path = public, extensions;

create table public.booking_shares (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  share_token text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger booking_shares_updated_at before update on public.booking_shares for each row execute function public.set_updated_at();

create table public.booking_share_joins (                -- เพื่อนกด "ไปด้วย"
  id         uuid primary key default gen_random_uuid(),
  share_id   uuid not null references public.booking_shares(id) on delete cascade,
  user_id    uuid references public.users(id) on delete set null,
  guest_name text check (char_length(guest_name) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or guest_name is not null)
);
create unique index booking_share_joins_user_once on public.booking_share_joins (share_id, user_id) where user_id is not null;
create trigger booking_share_joins_updated_at before update on public.booking_share_joins for each row execute function public.set_updated_at();

-- หน้า /share/:token — ไม่มีข้อมูลส่วนตัว (ไม่มีเบอร์/อีเมล/QR) · ต้องรู้ token ถึงจะอ่านได้
create or replace function public.get_share_card(p_token text)
returns table (booking_datetime timestamptz, pax smallint, status public.booking_status, zone_name text,
               bar_name text, bar_slug extensions.citext, address text, lat numeric, lng numeric,
               host_first_name text, going_count bigint)
language sql stable security definer set search_path = '' as $$
  select bk.booking_datetime, bk.pax, bk.status, z.name, b.name, b.slug, b.address, b.lat, b.lng,
         split_part(u.display_name, ' ', 1),
         (select count(*) from public.booking_share_joins j where j.share_id = s.id)
  from public.booking_shares s
  join public.bookings    bk on bk.id = s.booking_id
  join public.bars        b  on b.id  = bk.bar_id
  join public.table_zones z  on z.id  = bk.zone_id
  join public.users       u  on u.id  = bk.user_id
  where s.share_token = p_token and s.revoked_at is null
$$;
grant execute on function public.get_share_card(text) to anon, authenticated;

create table public.safety_reports (                     -- ลูกค้าที่เช็กอินแล้วโหวตว่าข้อมูลตรงไหม
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references public.bars(id) on delete cascade,
  feature_key text not null references public.safety_features(key) on update cascade,
  booking_id  uuid not null references public.bookings(id),
  user_id     uuid not null references public.users(id),
  is_accurate boolean not null,
  comment     text,
  status      public.safety_report_status not null default 'OPEN',
  resolved_by uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (booking_id, feature_key)
);
create trigger safety_reports_updated_at before update on public.safety_reports for each row execute function public.set_updated_at();

create table public.crowd_status_logs (                  -- log ทุกครั้งที่ร้านกดอัปเดตความแน่น
  id         bigint generated always as identity primary key,
  bar_id     uuid not null references public.bars(id) on delete cascade,
  status     public.crowd_status not null,
  updated_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);
create index crowd_status_logs_latest on public.crowd_status_logs (bar_id, created_at desc);

-- เขียนสถานะล่าสุดที่ bar_live_status (ตาราง Realtime)
create or replace function public.sync_bar_crowd() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.bar_live_status (bar_id, current_crowd, crowd_updated_at)
  values (new.bar_id, new.status, new.created_at)
  on conflict (bar_id) do update set current_crowd = excluded.current_crowd, crowd_updated_at = excluded.crowd_updated_at;
  return new;
end $$;
create trigger crowd_status_logs_sync after insert on public.crowd_status_logs for each row execute function public.sync_bar_crowd();

create policy booking_shares_read on public.booking_shares for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id))));
create policy booking_share_joins_read_own on public.booking_share_joins for select using (user_id = auth.uid());
create policy safety_reports_read_own on public.safety_reports for select using (user_id = auth.uid() or public.is_bar_member(bar_id));
create policy crowd_status_logs_read_team on public.crowd_status_logs for select using (public.is_bar_member(bar_id));
