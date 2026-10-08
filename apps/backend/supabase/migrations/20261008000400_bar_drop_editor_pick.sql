-- =====================================================================
-- NightOut · bar — เอา Editor's Pick ออกทั้งระบบ (ตัดออกจากสเปค 2026-10-08)
--   - ลบคอลัมน์ bar_stats.is_editor_pick · ตาราง editor_picks · ฟังก์ชัน admin_set_editor_pick
--   - view / RPC ที่อ้างคอลัมน์นี้ต้อง drop แล้วสร้างใหม่ (Postgres ลบคอลัมน์ของ view ด้วย create or replace ไม่ได้)
--     bar_cards → bar_detail · my_favorites · search_bars (setof bar_cards) · nearby_bars
--     my_bar_detail · admin_bars (อ้าง bar_stats ตรง)
--   - นิยามใหม่ = ตัวเดิม (…000800 / …001600 / …001700) ตัด is_editor_pick ออก · สิทธิ์เหมือนเดิม
--   - admin_bars + promoted_until (วันหมดของโปรโมทที่กำลังแสดง) สำหรับป้าย "แนะนำ" แบบดูอย่างเดียวในหน้า /bars
-- =====================================================================
set search_path = public, extensions;

drop function public.search_bars(text, uuid, public.bar_category, uuid[], public.pr_gender, integer, integer);
drop function public.nearby_bars(double precision, double precision, double precision);
drop view public.my_favorites;
drop view public.bar_detail;
drop view public.bar_cards;
drop view public.my_bar_detail;
drop view public.admin_bars;
drop function public.admin_set_editor_pick(uuid, uuid, boolean);
drop table public.editor_picks;
alter table public.bar_stats drop column is_editor_pick;

-- ---------------------------------------------------------------------
-- bar_cards — ลิสต์ร้าน / แผนที่ / ranking
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
  public.bar_is_promoted(b.id)                                                                       as is_promoted
from public.bars b
left join public.districts       d  on d.id = b.district_id
left join public.bar_stats       st on st.bar_id = b.id
left join public.bar_live_status ls on ls.bar_id = b.id
where b.status = 'APPROVED';

-- ---------------------------------------------------------------------
-- bar_detail — หน้ารายละเอียดร้าน
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
-- my_favorites — ร้านโปรด (รูปแบบ bar_cards + favorited_at)
-- ---------------------------------------------------------------------
create view public.my_favorites with (security_invoker = true) as
select c.*, f.created_at as favorited_at
from public.favorites f
join public.bar_cards c on c.id = f.bar_id
where f.user_id = auth.uid();

-- ---------------------------------------------------------------------
-- RPC: search_bars / nearby_bars (รูปแบบ bar_cards)
-- ---------------------------------------------------------------------
create function public.search_bars(
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

create function public.nearby_bars(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m double precision default 3000
) returns table (
  id uuid, slug extensions.citext, name text, category public.bar_category, lat numeric, lng numeric,
  cover_image_url text, cover_style text, district jsonb, styles jsonb, has_pr boolean, pr_counts jsonb,
  current_stars smallint, current_tier public.tier_letter, is_new boolean, rating_avg numeric,
  rating_count integer, checkin_count integer, avg_price_per_person numeric, safety_score smallint, score numeric,
  current_crowd public.crowd_status, crowd_updated_at timestamptz, is_promoted boolean,
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
-- my_bar_detail — ร้านของฉัน (ทุกสถานะ)
-- ---------------------------------------------------------------------
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
  public.bar_is_promoted(b.id) as is_promoted,
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

-- ---------------------------------------------------------------------
-- admin_bars — Backoffice "จัดการร้าน"
-- ---------------------------------------------------------------------
create view public.admin_bars with (security_invoker = true) as
select
  b.id, b.slug, b.name, b.category, b.status, b.status_reason, b.address, b.created_at, b.approved_at,
  case when d.id is null then null else jsonb_build_object('id', d.id, 'slug', d.slug, 'name_th', d.name_th) end as district,
  case when o.id is null then null else jsonb_build_object('id', o.id, 'email', o.email, 'display_name', o.display_name) end as owner,
  st.current_stars, st.current_tier, coalesce(st.is_new, true) as is_new, st.score, st.rating_avg,
  coalesce(st.rating_count, 0) as rating_count, coalesce(st.checkin_count, 0) as checkin_count,
  st.safety_score,
  public.bar_is_promoted(b.id) as is_promoted,
  -- วันหมดของแพ็กเกจโปรโมทที่กำลังแสดงอยู่ (ป้าย "แนะนำ" ในหน้า /bars · จัดการที่ /promotions)
  (select max(p.ends_at) from public.promoted_listings p
   where p.bar_id = b.id and p.status = 'ACTIVE' and now() >= p.starts_at and now() < p.ends_at) as promoted_until
from public.bars b
left join public.districts d on d.id = b.district_id
left join public.users     o on o.id = b.owner_id
left join public.bar_stats st on st.bar_id = b.id
where public.is_admin();

-- ---------------------------------------------------------------------
-- สิทธิ์ (เหมือนเดิม)
-- ---------------------------------------------------------------------
grant select on public.bar_cards, public.bar_detail to anon, authenticated;
grant select on public.my_favorites, public.my_bar_detail to authenticated;
revoke select on public.my_favorites, public.my_bar_detail from anon;
revoke all on public.admin_bars from anon;
grant select on public.admin_bars to authenticated;
grant execute on function public.search_bars(text, uuid, public.bar_category, uuid[], public.pr_gender, integer, integer) to anon, authenticated;
grant execute on function public.nearby_bars(double precision, double precision, double precision) to anon, authenticated;
