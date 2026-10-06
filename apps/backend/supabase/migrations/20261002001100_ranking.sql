-- =====================================================================
-- NightOut · เฟส 2 / 11 — จัดอันดับ (ดาว / Tier) · Editor's pick
-- =====================================================================
set search_path = public, extensions;

create table public.tier_scores (                        -- 1 แถวต่อร้านต่อรอบ = ประวัติขึ้น/ลงดาว
  id               uuid primary key default gen_random_uuid(),
  bar_id           uuid not null references public.bars(id) on delete cascade,
  period_type      public.rank_period not null,
  period_start     date not null,                        -- จันทร์ของสัปดาห์ / วันที่ 1 ของเดือน
  category         public.bar_category not null,
  district_id      uuid references public.districts(id) on delete set null,
  review_score     numeric(5,2) not null,
  checkin_score    numeric(5,2) not null,
  safety_score     numeric(5,2) not null,
  price_info_score numeric(5,2) not null,
  total_score      numeric(5,2) not null check (total_score between 0 and 100),
  stars            smallint check (stars between 1 and 5),
  tier             public.tier_letter,
  is_new           boolean not null,                     -- รีวิวจากเช็กอินจริง < 5 → ไม่มีดาว
  review_count     integer not null default 0,
  checkin_count    integer not null default 0,           -- = จำนวนโหวต (1 การจองที่เช็กอิน = 1 โหวต)
  rank_in_category integer,
  rank_in_district integer,
  prev_stars       smallint,
  computed_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (bar_id, period_type, period_start),
  check (is_new = (stars is null)),
  check (tier is null or tier = case when stars = 5 then 'S'::public.tier_letter when stars = 4 then 'A'::public.tier_letter
                                     when stars = 3 then 'B'::public.tier_letter else 'C'::public.tier_letter end)
);
create index tier_scores_rank on public.tier_scores (period_type, period_start, category, total_score desc) where not is_new;
create trigger tier_scores_updated_at before update on public.tier_scores for each row execute function public.set_updated_at();

create table public.editor_picks (                       -- ทีมปักหมุด แยกจากคะแนนระบบ
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid not null references public.bars(id) on delete cascade,
  note       text,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  pinned_by  uuid references public.users(id) on delete set null,   -- null = ระบบ/seed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger editor_picks_updated_at before update on public.editor_picks for each row execute function public.set_updated_at();

create policy tier_scores_read  on public.tier_scores  for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy editor_picks_read on public.editor_picks for select using (
  public.bar_is_public(bar_id) and now() >= starts_at and (ends_at is null or now() < ends_at));
