-- =====================================================================
-- NightOut · เฟส 1 / 8 — view + RPC สำหรับหน้าบ้าน · RLS · สิทธิ์คอลัมน์ · Storage · Realtime
--
-- หลัก: อ่านผ่าน view/RPC ได้ตรง (security_invoker = true → ใช้ RLS ของผู้เรียก) · เขียนผ่าน NestJS เท่านั้น
-- กฎ "ไม่มีข้อมูล": array = [] · object = null · ตัวนับ = 0 · ค่าอื่น = null · pr_counts = {male:0,female:0,lgbtq:0}
-- ทุก key ต้องอยู่ในผลลัพธ์เสมอ · array มี ORDER BY เสมอ · เวลาเปิด-ปิดเป็น "HH:MM"
-- =====================================================================
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- 1. bar_cards — ลิสต์ร้าน / แผนที่ / ranking
-- ---------------------------------------------------------------------
create view public.bar_cards with (security_invoker = true) as
select
  b.id,
  b.slug,
  b.name,
  b.category,
  b.lat,
  b.lng,
  b.cover_image_url,
  b.cover_style,
  case when d.id is null then null
       else jsonb_build_object('id', d.id, 'slug', d.slug, 'name_th', d.name_th) end              as district,
  coalesce((select jsonb_agg(s.key order by s.sort_order, s.key)
            from public.bar_styles bs join public.styles s on s.id = bs.style_id
            where bs.bar_id = b.id), '[]'::jsonb)                                                    as styles,
  exists (select 1 from public.bar_pr_counts p where p.bar_id = b.id)                                as has_pr,
  (select jsonb_build_object(
            'male',   coalesce(max(p.pr_count) filter (where p.gender = 'MALE'),   0),
            'female', coalesce(max(p.pr_count) filter (where p.gender = 'FEMALE'), 0),
            'lgbtq',  coalesce(max(p.pr_count) filter (where p.gender = 'LGBTQ'),  0))
   from public.bar_pr_counts p where p.bar_id = b.id)                                                as pr_counts,
  st.current_stars,
  st.current_tier,
  coalesce(st.is_new, true)                                                                          as is_new,
  st.rating_avg,
  coalesce(st.rating_count, 0)                                                                       as rating_count,
  coalesce(st.checkin_count, 0)                                                                      as checkin_count,
  st.avg_price_per_person,
  st.safety_score,
  st.score,
  ls.current_crowd,
  ls.crowd_updated_at,
  coalesce(st.is_editor_pick, false)                                                                 as is_editor_pick,
  public.bar_is_promoted(b.id)                                                                       as is_promoted
from public.bars b
left join public.districts       d  on d.id = b.district_id
left join public.bar_stats       st on st.bar_id = b.id
left join public.bar_live_status ls on ls.bar_id = b.id
where b.status = 'APPROVED';

-- ---------------------------------------------------------------------
-- 2. bar_detail — หน้ารายละเอียดร้าน (หนึ่งหน้า = หนึ่งการเรียก)
-- ---------------------------------------------------------------------
create view public.bar_detail with (security_invoker = true) as
select
  c.*,
  b.description,
  b.address,
  b.phone,
  b.perks,
  coalesce((select jsonb_agg(jsonb_build_object(
              'day_of_week', h.day_of_week,
              'open_time',   to_char(h.open_time,  'HH24:MI'),
              'close_time',  to_char(h.close_time, 'HH24:MI'),
              'is_closed',   h.is_closed) order by h.day_of_week)
            from public.bar_hours h where h.bar_id = b.id), '[]'::jsonb)                             as hours,
  coalesce((select jsonb_agg(jsonb_build_object(
              'date',       sh.date,
              'open_time',  to_char(sh.open_time,  'HH24:MI'),
              'close_time', to_char(sh.close_time, 'HH24:MI'),
              'is_closed',  sh.is_closed,
              'note',       sh.note) order by sh.date)
            from public.bar_special_hours sh where sh.bar_id = b.id and sh.date >= current_date), '[]'::jsonb) as special_hours,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', m.id, 'kind', m.kind, 'storage_path', m.storage_path, 'caption', m.caption,
              'width', m.width, 'height', m.height, 'duration_sec', m.duration_sec) order by m.sort_order, m.created_at)
            from public.bar_media m where m.bar_id = b.id), '[]'::jsonb)                             as media,
  coalesce((select jsonb_agg(jsonb_build_object('type', l.type, 'url', l.url) order by l.sort_order, l.created_at)
            from public.bar_links l where l.bar_id = b.id), '[]'::jsonb)                             as links,
  case when bs.bar_id is null then null else jsonb_build_object(
    'deposit_amount',          bs.deposit_amount,
    'deposit_unit',            bs.deposit_unit,
    'deposit_policy',          bs.deposit_policy,
    'refund_before_hours',     bs.refund_before_hours,
    'grace_minutes',           bs.grace_minutes,
    'pending_timeout_minutes', bs.pending_timeout_minutes,
    'deposit_timeout_minutes', bs.deposit_timeout_minutes,
    'max_pax_per_booking',     bs.max_pax_per_booking,
    'min_advance_minutes',     bs.min_advance_minutes,
    'max_advance_days',        bs.max_advance_days) end                                             as booking_settings,
  coalesce((select jsonb_agg(jsonb_build_object(
              'fee_type', f.fee_type, 'label', f.label, 'calc', f.calc, 'value', f.value) order by f.apply_order, f.created_at)
            from public.bar_fees f where f.bar_id = b.id and f.active), '[]'::jsonb)                 as fees,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', mi.id, 'category', mc.name, 'name', mi.name, 'description', mi.description,
              'price', mi.price, 'unit_label', mi.unit_label, 'image_path', mi.image_path,
              'is_available', mi.is_available) order by mc.sort_order nulls last, mi.sort_order, mi.name)
            from public.menu_items mi left join public.menu_categories mc on mc.id = mi.category_id
            where mi.bar_id = b.id), '[]'::jsonb)                                                    as menu,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', pp.id, 'name', pp.name, 'description', pp.description, 'pax_min', pp.pax_min, 'pax_max', pp.pax_max,
              'total_price', pp.total_price, 'fees_included', pp.fees_included,
              'items', coalesce((select jsonb_agg(jsonb_build_object(
                          'menu_item_id', pi.menu_item_id, 'name', pi.name_snapshot,
                          'quantity', pi.quantity, 'unit_price', pi.unit_price_snapshot) order by pi.sort_order, pi.name_snapshot)
                        from public.price_package_items pi where pi.package_id = pp.id), '[]'::jsonb))
            order by pp.pax_min, pp.name)
            from public.price_packages pp where pp.bar_id = b.id and pp.active), '[]'::jsonb)         as packages,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', pr.id, 'title', pr.title, 'description', pr.description, 'perk_type', pr.perk_type,
              'discount_percent', pr.discount_percent, 'days_of_week', to_jsonb(pr.days_of_week),
              'valid_from', pr.valid_from, 'valid_to', pr.valid_to,
              'cutoff_time', to_char(pr.cutoff_time, 'HH24:MI'), 'min_pax', pr.min_pax) order by pr.sort_order, pr.title)
            from public.bar_promotions pr
            where pr.bar_id = b.id and pr.active and pr.moderation_status = 'APPROVED'
              and (pr.valid_to is null or pr.valid_to >= current_date)), '[]'::jsonb)               as promotions,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', z.id, 'name', z.name, 'capacity_pax', z.capacity_pax,
              'default_duration_minutes', z.default_duration_minutes,
              'allow_zone_only_booking', z.allow_zone_only_booking,
              'tables', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'seats', t.seats) order by t.name)
                                  from public.tables t where t.zone_id = z.id and t.active), '[]'::jsonb))
            order by z.sort_order, z.name)
            from public.table_zones z where z.bar_id = b.id and z.active), '[]'::jsonb)              as zones,
  coalesce((select jsonb_agg(jsonb_build_object(
              'key', sf.key, 'name_th', sf.name_th, 'icon', sf.icon,
              'value', coalesce(bsf.value, 'UNKNOWN'), 'source', bsf.source, 'verified_at', bsf.verified_at)
            order by sf.sort_order, sf.key)
            from public.safety_features sf
            left join public.bar_safety_features bsf on bsf.feature_key = sf.key and bsf.bar_id = b.id), '[]'::jsonb) as safety
from public.bar_cards c
join public.bars b on b.id = c.id
left join public.bar_booking_settings bs on bs.bar_id = b.id;

-- ---------------------------------------------------------------------
-- 3. public_reviews — รีวิวในหน้าร้าน (ไม่เปิด email / birthdate)
-- ---------------------------------------------------------------------
create view public.public_reviews with (security_invoker = true) as
select
  r.id,
  r.bar_id,
  r.rating,
  r.comment,
  r.created_at,
  public.review_author_name(r.user_id) as display_name,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', m.id, 'kind', m.kind, 'storage_path', m.storage_path, 'thumb_path', m.thumb_path,
              'width', m.width, 'height', m.height, 'duration_sec', m.duration_sec) order by m.sort_order, m.created_at)
            from public.review_media m where m.review_id = r.id), '[]'::jsonb) as media
from public.reviews r
join public.bars b on b.id = r.bar_id and b.status = 'APPROVED'
where r.status = 'PUBLISHED';

-- ---------------------------------------------------------------------
-- 4. my_bars — ร้านที่ฉันอยู่ในทีม (ทุกสถานะ)
-- ---------------------------------------------------------------------
create view public.my_bars with (security_invoker = true) as
select
  b.id,
  b.slug,
  b.name,
  b.category,
  b.status,
  b.status_reason,
  b.cover_image_url,
  b.cover_style,
  m.role                                         as staff_role,
  case when d.id is null then null
       else jsonb_build_object('id', d.id, 'slug', d.slug, 'name_th', d.name_th) end as district,
  st.current_stars,
  st.current_tier,
  coalesce(st.is_new, true)                      as is_new,
  st.rating_avg,
  coalesce(st.rating_count, 0)                   as rating_count,
  coalesce(st.checkin_count, 0)                  as checkin_count,
  ls.current_crowd,
  ls.crowd_updated_at,
  b.created_at,
  b.updated_at
from public.bars b
join public.bar_staff m on m.bar_id = b.id and m.user_id = auth.uid() and m.accepted_at is not null and m.revoked_at is null
left join public.districts       d  on d.id = b.district_id
left join public.bar_stats       st on st.bar_id = b.id
left join public.bar_live_status ls on ls.bar_id = b.id;

-- ---------------------------------------------------------------------
-- 5. my_bookings — รายการจองของฉัน
-- ---------------------------------------------------------------------
create view public.my_bookings with (security_invoker = true) as
select
  bk.id,
  bk.code,
  bk.status,
  bk.booking_datetime,
  bk.pax,
  bk.deposit_required,
  bk.auto_cancel_at,
  bk.expires_at,
  case when b.id is null then null else jsonb_build_object(
    'id', b.id, 'slug', b.slug, 'name', b.name,
    'cover_image_url', b.cover_image_url, 'cover_style', b.cover_style) end as bar,
  z.name                     as zone_name,
  t.name                     as table_name,
  bp.title_snapshot          as promotion_title,
  bk.created_at,
  bk.updated_at
from public.bookings bk
left join public.bars               b  on b.id = bk.bar_id
left join public.table_zones        z  on z.id = bk.zone_id
left join public.tables             t  on t.id = bk.table_id
left join public.booking_promotions bp on bp.booking_id = bk.id
where bk.user_id = auth.uid();

-- ---------------------------------------------------------------------
-- 6. booking_detail — รายละเอียดการจอง (ลูกค้าเจ้าของ หรือทีมร้าน) · ไม่มี contact_phone
-- ---------------------------------------------------------------------
create view public.booking_detail with (security_invoker = true) as
select
  bk.id,
  bk.code,
  bk.status,
  bk.user_id,
  (bk.user_id = auth.uid())                                      as is_mine,
  bk.booking_datetime,
  bk.reserved_from,
  bk.reserved_until,
  bk.pax,
  bk.customer_note,
  bk.request_pr,
  bk.deposit_required,
  bk.deposit_policy_snapshot,
  bk.grace_minutes,
  bk.auto_cancel_at,
  bk.expires_at,
  bk.confirmed_at,
  bk.checked_in_at,
  bk.completed_at,
  bk.cancelled_at,
  bk.cancel_reason,
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
  bk.updated_at
from public.bookings bk
left join public.bars                      b  on b.id  = bk.bar_id
left join public.table_zones               z  on z.id  = bk.zone_id
left join public.tables                    t  on t.id  = bk.table_id
left join public.booking_promotions        bp on bp.booking_id = bk.id
left join public.booking_price_snapshots   ps on ps.booking_id = bk.id
left join public.booking_package_snapshots pk on pk.booking_id = bk.id
left join public.checkins                  ci on ci.booking_id = bk.id;

-- ---------------------------------------------------------------------
-- 7. my_favorites — ร้านโปรด (รูปแบบ bar_cards + favorited_at)
-- ---------------------------------------------------------------------
create view public.my_favorites with (security_invoker = true) as
select c.*, f.created_at as favorited_at
from public.favorites f
join public.bar_cards c on c.id = f.bar_id
where f.user_id = auth.uid();

-- ---------------------------------------------------------------------
-- RPC: search_bars / nearby_bars (รูปแบบ bar_cards)
-- ---------------------------------------------------------------------
create or replace function public.search_bars(
  p_keyword     text               default null,
  p_district_id uuid               default null,
  p_category    public.bar_category default null,
  p_style_ids   uuid[]             default null,
  p_pr_gender   public.pr_gender   default null,
  p_limit       integer            default 20,
  p_offset      integer            default 0
) returns setof public.bar_cards
language sql stable set search_path = '' as $$
  select c.*
  from public.bar_cards c
  join public.bars b on b.id = c.id
  where (nullif(trim(p_keyword), '') is null or b.name ilike '%' || trim(p_keyword) || '%')
    and (p_district_id is null or b.district_id = p_district_id)
    and (p_category    is null or b.category = p_category)
    and (coalesce(cardinality(p_style_ids), 0) = 0 or not exists (
          select unnest(p_style_ids) except select bs.style_id from public.bar_styles bs where bs.bar_id = b.id))
    and (p_pr_gender   is null or exists (
          select 1 from public.bar_pr_counts p where p.bar_id = b.id and p.gender = p_pr_gender))
  order by c.is_promoted desc, c.score desc nulls last, c.name, c.id
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

create or replace function public.nearby_bars(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m double precision default 3000
) returns table (
  id uuid, slug extensions.citext, name text, category public.bar_category, lat numeric, lng numeric,
  cover_image_url text, cover_style text, district jsonb, styles jsonb, has_pr boolean, pr_counts jsonb,
  current_stars smallint, current_tier public.tier_letter, is_new boolean, rating_avg numeric,
  rating_count integer, checkin_count integer, avg_price_per_person numeric, safety_score smallint, score numeric,
  current_crowd public.crowd_status, crowd_updated_at timestamptz, is_editor_pick boolean, is_promoted boolean,
  distance_m double precision
)
language sql stable set search_path = '' as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  )
  select c.*, extensions.st_distance(b.location, o.g) as distance_m
  from public.bar_cards c
  join public.bars b on b.id = c.id
  cross join origin o
  where extensions.st_dwithin(b.location, o.g, least(greatest(coalesce(p_radius_m, 3000), 100), 50000))
  order by distance_m, c.id
  limit 200
$$;

-- ---------------------------------------------------------------------
-- RLS — เปิดทุกตาราง · มีแค่ policy SELECT (การเขียนทั้งหมดผ่าน NestJS/service role)
-- ---------------------------------------------------------------------
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- master (สาธารณะ)
create policy districts_read       on public.districts       for select using (active);
create policy styles_read          on public.styles          for select using (active);
create policy safety_features_read on public.safety_features for select using (true);
create policy legal_documents_read on public.legal_documents for select using (true);
create policy platform_settings_read on public.platform_settings for select
  using (key in ('deposit_promptpay', 'promotion_promptpay'));

-- ร้าน: สาธารณะเมื่อ APPROVED · ทีมร้านเห็นทุกสถานะ
create policy bars_read                 on public.bars                 for select using (status = 'APPROVED' or public.is_bar_member(id));
create policy bar_booking_settings_read on public.bar_booking_settings for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_stats_read            on public.bar_stats            for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_live_status_read      on public.bar_live_status      for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_pr_counts_read        on public.bar_pr_counts        for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_hours_read            on public.bar_hours            for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_special_hours_read    on public.bar_special_hours    for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_styles_read           on public.bar_styles           for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_media_read            on public.bar_media            for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_links_read            on public.bar_links            for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_safety_features_read  on public.bar_safety_features  for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_staff_read            on public.bar_staff            for select using (user_id = auth.uid() or public.is_bar_member(bar_id));
create policy bar_verifications_read    on public.bar_verifications    for select using (public.is_bar_member(bar_id));
create policy bar_payout_accounts_read  on public.bar_payout_accounts  for select using (public.is_bar_member(bar_id));

create policy menu_categories_read on public.menu_categories for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy menu_items_read      on public.menu_items      for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy bar_fees_read        on public.bar_fees        for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy price_packages_read  on public.price_packages  for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy price_package_items_read on public.price_package_items for select using (
  exists (select 1 from public.price_packages p where p.id = package_id and (public.bar_is_public(p.bar_id) or public.is_bar_member(p.bar_id))));
create policy bar_promotions_read  on public.bar_promotions  for select using (
  (public.bar_is_public(bar_id) and active and moderation_status = 'APPROVED') or public.is_bar_member(bar_id));
create policy table_zones_read     on public.table_zones     for select using (public.bar_is_public(bar_id) or public.is_bar_member(bar_id));
create policy tables_read          on public.tables          for select using (
  exists (select 1 from public.table_zones z where z.id = zone_id and (public.bar_is_public(z.bar_id) or public.is_bar_member(z.bar_id))));

-- ผู้ใช้: เห็นเฉพาะของตัวเอง
create policy users_read_own                 on public.users                 for select using (id = auth.uid());
create policy user_preferences_read_own      on public.user_preferences      for select using (user_id = auth.uid());
create policy user_consents_read_own         on public.user_consents         for select using (user_id = auth.uid());
create policy notification_channels_read_own on public.notification_channels for select using (user_id = auth.uid());
create policy notifications_read_own         on public.notifications         for select using (user_id = auth.uid());
create policy favorites_read_own             on public.favorites             for select using (user_id = auth.uid());

-- การจอง: ลูกค้าเจ้าของ หรือทีมร้าน (Realtime ของการจองไม่เปิด — ใช้ polling/แจ้งเตือน)
create policy bookings_read on public.bookings for select using (user_id = auth.uid() or public.is_bar_member(bar_id));
create policy booking_status_history_read on public.booking_status_history for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id))));
create policy booking_price_snapshots_read on public.booking_price_snapshots for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id))));
create policy booking_package_snapshots_read on public.booking_package_snapshots for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id))));
create policy booking_promotions_read on public.booking_promotions for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id))));
create policy checkins_read on public.checkins for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_bar_member(b.bar_id))));

-- รีวิว
create policy reviews_read on public.reviews for select using (
  (status = 'PUBLISHED' and public.bar_is_public(bar_id)) or user_id = auth.uid() or public.is_bar_member(bar_id));
create policy review_media_read on public.review_media for select using (
  exists (select 1 from public.reviews r where r.id = review_id
          and ((r.status = 'PUBLISHED' and public.bar_is_public(r.bar_id)) or r.user_id = auth.uid() or public.is_bar_member(r.bar_id))));
create policy review_reports_read_own on public.review_reports for select using (reporter_id = auth.uid());
-- ไม่มี policy (NestJS เท่านั้น): notification_deliveries, audit_logs, job_runs, booking_qr_tokens, review_moderation_logs

-- ---------------------------------------------------------------------
-- สิทธิ์ระดับคอลัมน์ + ห้ามเขียนจากหน้าบ้าน
-- ---------------------------------------------------------------------
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;

-- เบอร์ติดต่อการจอง: ห้ามอ่านผ่าน API ตรง (ร้านดูผ่าน NestJS เฉพาะการจอง CONFIRMED + มี consent)
revoke select on public.bookings from anon, authenticated;
grant select (id, code, user_id, bar_id, zone_id, table_id, booking_datetime, reserved_from, reserved_until, reserved_period,
              pax, status, customer_note, request_pr, deposit_required, deposit_policy_snapshot, grace_minutes,
              auto_cancel_at, expires_at, confirmed_at, checked_in_at, completed_at, cancelled_at, cancel_reason,
              created_at, updated_at)
  on public.bookings to authenticated;

-- เลขบัญชีร้าน (เข้ารหัส) ไม่ออกทาง API
revoke select on public.bar_payout_accounts from anon, authenticated;
grant select (id, bar_id, bank_code, account_name, account_no_last4, is_default, verified_at, created_at, updated_at)
  on public.bar_payout_accounts to authenticated;

grant select on public.bar_cards, public.bar_detail, public.public_reviews to anon, authenticated;
grant select on public.my_bars, public.my_bookings, public.booking_detail, public.my_favorites to authenticated;
revoke select on public.my_bars, public.my_bookings, public.booking_detail, public.my_favorites from anon;
grant execute on function public.search_bars(text, uuid, public.bar_category, uuid[], public.pr_gender, integer, integer) to anon, authenticated;
grant execute on function public.nearby_bars(double precision, double precision, double precision) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage — path: <bucket>/<owner folder>/<file>
--   bar-media         public read · เขียน: ทีมร้าน (โฟลเดอร์ = bar_id)
--   review-media      private · อ่าน: รีวิวที่ไม่ถูกซ่อน / เจ้าของ · เขียน: เจ้าของรีวิว (โฟลเดอร์ = user_id/review_id)
--   deposit-slips     private · ลูกค้าเจ้าของ (โฟลเดอร์ = user_id) + แอดมิน · ร้านห้ามอ่าน
--   bar-verifications private · ทีมร้าน (โฟลเดอร์ = bar_id) + แอดมิน
--   payout-slips      private · อ่าน: ทีมร้าน + แอดมิน · เขียน: แอดมิน (NestJS)
--   promo-slips       private · ทีมร้าน (โฟลเดอร์ = bar_id) + แอดมิน
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('bar-media',         'bar-media',         true,  15728640, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('review-media',      'review-media',      false, 62914560, array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm']),
  ('deposit-slips',     'deposit-slips',     false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('bar-verifications', 'bar-verifications', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('payout-slips',      'payout-slips',      false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('promo-slips',       'promo-slips',       false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- รีวิวที่ไฟล์นี้สังกัด (<user_id>/<review_id>/<file>) แสดงสาธารณะได้หรือไม่
create or replace function public.review_media_path_is_public(p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_review uuid;
begin
  v_review := (storage.foldername(p_name))[2]::uuid;
  return exists (select 1 from public.reviews r join public.bars b on b.id = r.bar_id
                 where r.id = v_review and r.status = 'PUBLISHED' and b.status = 'APPROVED');
exception when invalid_text_representation then
  return false;
end $$;

create policy "bar-media: team write" on storage.objects for insert to authenticated
  with check (bucket_id = 'bar-media' and public.is_bar_member_path((storage.foldername(name))[1]));
create policy "bar-media: team update" on storage.objects for update to authenticated
  using (bucket_id = 'bar-media' and public.is_bar_member_path((storage.foldername(name))[1]));
create policy "bar-media: team delete" on storage.objects for delete to authenticated
  using (bucket_id = 'bar-media' and public.is_bar_member_path((storage.foldername(name))[1]));

create policy "review-media: public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'review-media' and (public.review_media_path_is_public(name)
         or (storage.foldername(name))[1] = (select auth.uid())::text));
create policy "review-media: owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "review-media: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "deposit-slips: owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'deposit-slips' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.auth_role() = 'ADMIN'));
create policy "deposit-slips: owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'deposit-slips' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "bar-verifications: team or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'bar-verifications' and (public.is_bar_member_path((storage.foldername(name))[1]) or public.auth_role() = 'ADMIN'));
create policy "bar-verifications: team write" on storage.objects for insert to authenticated
  with check (bucket_id = 'bar-verifications' and public.is_bar_member_path((storage.foldername(name))[1]));

create policy "payout-slips: team or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'payout-slips' and (public.is_bar_member_path((storage.foldername(name))[1]) or public.auth_role() = 'ADMIN'));

create policy "promo-slips: team or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'promo-slips' and (public.is_bar_member_path((storage.foldername(name))[1]) or public.auth_role() = 'ADMIN'));
create policy "promo-slips: team write" on storage.objects for insert to authenticated
  with check (bucket_id = 'promo-slips' and public.is_bar_member_path((storage.foldername(name))[1]));

-- ---------------------------------------------------------------------
-- Realtime: เปิดเฉพาะ bar_live_status (ห้ามเปิดที่ bars)
-- ---------------------------------------------------------------------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.bar_live_status;
  end if;
end $$;
