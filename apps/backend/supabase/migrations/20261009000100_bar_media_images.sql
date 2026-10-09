-- =====================================================================
-- bar · รูปร้าน (ปก + แกลเลอรี) และรูปเมนู — ร้านจัดการเอง + Backoffice จัดการแทนได้
--   - ไฟล์อยู่ bucket bar-media (public · …000800) : <bar_id>/gallery/<ไฟล์> · <bar_id>/menu/<ไฟล์>
--   - ปกร้าน = รูปหนึ่งในแกลเลอรี · bars.cover_image_url เก็บ URL เต็ม (NestJS สร้างจาก path) ให้ view เดิมใช้ต่อได้เลย
--   - bar_media_save / menu_image_check — ตัวกลางที่ app_* และ admin_* ใช้ร่วมกัน (service_role เท่านั้น)
--   - app_set_bar_media (เจ้าของ/ผู้จัดการ) · admin_set_bar_media · admin_set_menu_item_image (แอดมิน + audit + แจ้งทีมร้าน)
--   - app_set_menu ตัวใหม่: รับ image_path ต่อรายการ (ไม่ส่ง key = คงรูปเดิม · null = ลบรูป)
--   - ทุกฟังก์ชันเขียนคืน removed_paths = ไฟล์ที่ไม่มีแถวไหนอ้างแล้ว → NestJS ลบออกจาก Storage
--   - my_bar_detail + คอลัมน์ media (ท้ายสุด) · view ใหม่ admin_bar_media
--   - Storage policy ให้แอดมิน (MFA) เขียน bar-media ได้ (อัปโหลดแทนร้าน)
-- =====================================================================
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- Storage — แอดมินอัปโหลด/ลบรูปของทุกร้าน (ทีมร้านใช้ policy "bar-media: team *" เดิม)
-- ---------------------------------------------------------------------
create policy "bar-media: admin write" on storage.objects for insert to authenticated
  with check (bucket_id = 'bar-media' and public.is_admin());
create policy "bar-media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'bar-media' and public.is_admin());
create policy "bar-media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'bar-media' and public.is_admin());

-- ---------------------------------------------------------------------
-- path ของรูปต้องอยู่ในโฟลเดอร์ของร้านนั้น และอัปโหลดขึ้น Storage แล้วจริง
-- ---------------------------------------------------------------------
create or replace function public.bar_media_path_ok(p_bar uuid, p_folder text, p_path text) returns boolean
language sql stable set search_path = '' as $$
  select p_path is not null
     and p_path ~ ('^' || p_bar::text || '/' || p_folder || '/[A-Za-z0-9][A-Za-z0-9._-]{0,120}$')
     and exists (select 1 from storage.objects o where o.bucket_id = 'bar-media' and o.name = p_path)
$$;

-- ไฟล์ของร้านที่ไม่มีแถวไหนอ้างแล้ว (จากรายการ path เดิม) — ลบออกจาก Storage ได้
create or replace function public.bar_media_unused(p_bar uuid, p_paths text[]) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(distinct x), '[]'::jsonb)
  from unnest(coalesce(p_paths, '{}')) x
  where x is not null
    and not exists (select 1 from public.bar_media m where m.bar_id = p_bar and m.storage_path = x)
    and not exists (select 1 from public.menu_items mi where mi.bar_id = p_bar and mi.image_path = x)
$$;

-- แกลเลอรีทั้งชุด (เรียงตามลำดับที่ส่งมา · สูงสุด 10 รูป) + ปก (path ในแกลเลอรี หรือ null)
-- p_cover_url = URL public ของ p_cover_path ที่ NestJS สร้าง (DB ไม่รู้โดเมน Storage) — ต้องลงท้ายด้วย path นั้น
create or replace function public.bar_media_save(p_bar uuid, p_paths text[], p_cover_path text, p_cover_url text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  paths text[] := coalesce(p_paths, '{}');
  old_paths text[];
  v_cover text;
begin
  if not exists (select 1 from public.bars where id = p_bar) then
    raise exception 'BAR_NOT_FOUND' using errcode = 'P0002';
  end if;
  if cardinality(paths) > 10
     or array_position(paths, null) is not null
     or cardinality(paths) <> (select count(distinct x) from unnest(paths) x)
     or exists (select 1 from unnest(paths) x where not public.bar_media_path_ok(p_bar, 'gallery', x)) then
    raise exception 'INVALID_BAR_MEDIA' using errcode = '22023';
  end if;
  if p_cover_path is not null and (
       not (p_cover_path = any (paths))
       or p_cover_url is null
       or p_cover_url !~ '^https?://'
       or right(p_cover_url, char_length('/bar-media/' || p_cover_path)) <> '/bar-media/' || p_cover_path) then
    raise exception 'INVALID_BAR_MEDIA' using errcode = '22023', detail = 'cover';
  end if;

  select coalesce(array_agg(storage_path), '{}') into old_paths from public.bar_media where bar_id = p_bar;
  delete from public.bar_media where bar_id = p_bar;
  insert into public.bar_media (bar_id, kind, storage_path, sort_order)
  select p_bar, 'IMAGE', x, (o * 10)::integer from unnest(paths) with ordinality as t(x, o);

  v_cover := case when p_cover_path is null then null else p_cover_url end;
  update public.bars set cover_image_url = v_cover where id = p_bar;

  return jsonb_build_object(
    'bar_id', p_bar,
    'count', cardinality(paths),
    'cover_image_url', v_cover,
    'paths', to_jsonb(paths),
    'removed_paths', public.bar_media_unused(p_bar, old_paths));
end $$;

-- รูปเมนู 1 รายการ: null = ไม่มีรูป · ไม่งั้นต้องเป็นไฟล์ในโฟลเดอร์ menu ของร้าน
create or replace function public.menu_image_check(p_bar uuid, p_path text) returns text
language plpgsql stable set search_path = '' as $$
begin
  if p_path is null then return null; end if;
  if not public.bar_media_path_ok(p_bar, 'menu', p_path) then
    raise exception 'INVALID_MENU_IMAGE' using errcode = '22023';
  end if;
  return p_path;
end $$;

-- ---------------------------------------------------------------------
-- ทีมร้าน (เจ้าของ/ผู้จัดการ)
-- ---------------------------------------------------------------------
create or replace function public.app_set_bar_media(p_actor uuid, p_bar uuid, p_paths text[], p_cover_path text, p_cover_url text)
returns jsonb language plpgsql set search_path = '' as $$
declare r jsonb;
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  r := public.bar_media_save(p_bar, p_paths, p_cover_path, p_cover_url);
  perform public.app_audit(p_actor, 'bar.media.update', 'bars', p_bar, r - 'removed_paths');
  return r;
end $$;

-- เมนูทั้งชุด [{id?, category, name, price, available, image_path?}] — รายการที่ไม่ส่งมาถูกลบ
-- image_path: ไม่ส่ง key = คงรูปเดิม · null = ไม่มีรูป · path = ไฟล์ใน bar-media/<bar_id>/menu/
create or replace function public.app_set_menu(p_actor uuid, p_bar uuid, p_items jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare it jsonb; v_cat uuid; v_id uuid; v_img text; i integer := 0; keep uuid[] := '{}'; old_imgs text[];
begin
  perform public.app_assert_user(p_actor);
  perform public.app_assert_manager(p_actor, p_bar);
  select coalesce(array_agg(image_path) filter (where image_path is not null), '{}') into old_imgs
  from public.menu_items where bar_id = p_bar;
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if coalesce(trim(it->>'name'), '') = '' or (it->>'price')::numeric < 0 then raise exception 'INVALID_MENU_ITEM' using errcode = '22023'; end if;
    v_img := case when it ? 'image_path' then public.menu_image_check(p_bar, nullif(it->>'image_path', '')) end;
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
             is_available = coalesce((it->>'available')::boolean, true), sort_order = i,
             image_path = case when it ? 'image_path' then v_img else image_path end
       where id = (it->>'id')::uuid and bar_id = p_bar returning id into v_id;
    end if;
    if v_id is null then
      insert into public.menu_items (bar_id, category_id, name, price, is_available, sort_order, image_path)
      values (p_bar, v_cat, trim(it->>'name'), (it->>'price')::numeric, coalesce((it->>'available')::boolean, true), i, v_img)
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
  return jsonb_build_object('bar_id', p_bar, 'count', i, 'removed_paths', public.bar_media_unused(p_bar, old_imgs));
end $$;

-- ---------------------------------------------------------------------
-- Backoffice (ADMIN / SUPER_ADMIN + MFA ตรวจที่ NestJS) — audit + แจ้งทีมร้าน
-- ---------------------------------------------------------------------
create or replace function public.admin_set_bar_media(p_actor uuid, p_bar uuid, p_paths text[], p_cover_path text, p_cover_url text)
returns jsonb language plpgsql set search_path = '' as $$
declare before jsonb; r jsonb;
begin
  perform public.admin_assert(p_actor);
  select jsonb_build_object(
           'paths', coalesce((select jsonb_agg(m.storage_path order by m.sort_order, m.created_at)
                              from public.bar_media m where m.bar_id = b.id), '[]'::jsonb),
           'cover_image_url', b.cover_image_url)
    into before from public.bars b where b.id = p_bar;
  r := public.bar_media_save(p_bar, p_paths, p_cover_path, p_cover_url);
  perform public.admin_audit(p_actor, 'bar.media.update', 'bars', p_bar, before,
                             jsonb_build_object('paths', r->'paths', 'cover_image_url', r->'cover_image_url'));
  perform public.app_notify_team(p_bar, 'BAR_MEDIA_UPDATED', 'ทีม NightOut แก้รูปร้านของคุณ',
    'ตรวจรูปปกและแกลเลอรีได้ที่หน้าข้อมูลร้าน', '/merchant/store');
  return r;
end $$;

create or replace function public.admin_set_menu_item_image(p_actor uuid, p_item uuid, p_path text)
returns jsonb language plpgsql set search_path = '' as $$
declare v_item public.menu_items; v_img text;
begin
  perform public.admin_assert(p_actor);
  select * into v_item from public.menu_items where id = p_item;
  if v_item.id is null then raise exception 'MENU_ITEM_NOT_FOUND' using errcode = 'P0002'; end if;
  v_img := public.menu_image_check(v_item.bar_id, nullif(p_path, ''));
  update public.menu_items set image_path = v_img where id = p_item;
  perform public.admin_audit(p_actor, 'menu_item.image', 'menu_items', p_item,
                             jsonb_build_object('image_path', v_item.image_path), jsonb_build_object('image_path', v_img));
  perform public.app_notify_team(v_item.bar_id, 'BAR_MEDIA_UPDATED', 'ทีม NightOut แก้รูปเมนูของคุณ',
    v_item.name, '/merchant/menu');
  return jsonb_build_object(
    'id', p_item, 'bar_id', v_item.bar_id, 'image_path', v_img,
    'removed_paths', case when v_item.image_path is distinct from v_img
                          then public.bar_media_unused(v_item.bar_id, array[v_item.image_path]) else '[]'::jsonb end);
end $$;

-- ---------------------------------------------------------------------
-- view — my_bar_detail + media (คอลัมน์ท้ายสุด · create or replace ได้ สิทธิ์เดิมคงอยู่)
-- ---------------------------------------------------------------------
create or replace view public.my_bar_detail with (security_invoker = true) as
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
  b.created_at, b.updated_at,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', md.id, 'kind', md.kind, 'storage_path', md.storage_path, 'caption', md.caption,
              'width', md.width, 'height', md.height, 'duration_sec', md.duration_sec) order by md.sort_order, md.created_at)
            from public.bar_media md where md.bar_id = b.id), '[]'::jsonb) as media
from public.bars b
join public.bar_staff m on m.bar_id = b.id and m.user_id = auth.uid() and m.accepted_at is not null and m.revoked_at is null
left join public.districts            d  on d.id = b.district_id
left join public.bar_stats            st on st.bar_id = b.id
left join public.bar_live_status      ls on ls.bar_id = b.id
left join public.bar_booking_settings bs on bs.bar_id = b.id;

-- ---------------------------------------------------------------------
-- admin_bar_media — Backoffice "รูปร้าน" (1 แถวต่อร้าน · ทุกสถานะ)
-- ---------------------------------------------------------------------
create view public.admin_bar_media with (security_invoker = true) as
select
  b.id, b.slug, b.name, b.status, b.cover_image_url,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', md.id, 'storage_path', md.storage_path, 'created_at', md.created_at) order by md.sort_order, md.created_at)
            from public.bar_media md where md.bar_id = b.id and md.kind = 'IMAGE'), '[]'::jsonb) as media,
  coalesce((select jsonb_agg(jsonb_build_object(
              'id', mi.id, 'category', mc.name, 'name', mi.name, 'image_path', mi.image_path)
            order by mc.sort_order nulls last, mi.sort_order, mi.name)
            from public.menu_items mi left join public.menu_categories mc on mc.id = mi.category_id
            where mi.bar_id = b.id), '[]'::jsonb) as menu,
  (select count(*) from public.bar_media md where md.bar_id = b.id and md.kind = 'IMAGE')::integer as media_count,
  (select count(*) from public.menu_items mi where mi.bar_id = b.id and mi.image_path is not null)::integer as menu_image_count,
  b.updated_at
from public.bars b
where public.is_admin();

revoke all on public.admin_bar_media from anon;
grant select on public.admin_bar_media to authenticated;

-- ---------------------------------------------------------------------
-- สิทธิ์ฟังก์ชัน — เรียกผ่าน NestJS (service_role) เท่านั้น
-- ---------------------------------------------------------------------
revoke all on function public.bar_media_path_ok(uuid, text, text) from public, anon, authenticated;
revoke all on function public.bar_media_unused(uuid, text[]) from public, anon, authenticated;
revoke all on function public.bar_media_save(uuid, text[], text, text) from public, anon, authenticated;
revoke all on function public.menu_image_check(uuid, text) from public, anon, authenticated;
revoke all on function public.app_set_bar_media(uuid, uuid, text[], text, text) from public, anon, authenticated;
revoke all on function public.app_set_menu(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_set_bar_media(uuid, uuid, text[], text, text) from public, anon, authenticated;
revoke all on function public.admin_set_menu_item_image(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.bar_media_path_ok(uuid, text, text) to service_role;
grant execute on function public.bar_media_unused(uuid, text[]) to service_role;
grant execute on function public.bar_media_save(uuid, text[], text, text) to service_role;
grant execute on function public.menu_image_check(uuid, text) to service_role;
grant execute on function public.app_set_bar_media(uuid, uuid, text[], text, text) to service_role;
grant execute on function public.app_set_menu(uuid, uuid, jsonb) to service_role;
grant execute on function public.admin_set_bar_media(uuid, uuid, text[], text, text) to service_role;
grant execute on function public.admin_set_menu_item_image(uuid, uuid, text) to service_role;
