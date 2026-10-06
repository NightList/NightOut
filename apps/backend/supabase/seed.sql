-- =====================================================================
-- Seed: master data + ร้านเดโม 16 ร้าน (ชื่อสมมติทั้งหมด) — สร้างอัตโนมัติ ห้ามแก้มือ
-- แก้ master data ที่ MASTER_SQL ใน apps/backend/scripts/seed-from-mock.ts
-- สร้างใหม่: pnpm --filter @nightout/backend db:seed:gen
-- ใช้กับ: supabase db reset (local) หรือ supabase db reset --linked (project จริง)
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- master data
-- ---------------------------------------------------------------------
insert into districts (slug, name_th, sort_order) values
  ('thonglor','ทองหล่อ',1), ('ekkamai','เอกมัย',2), ('ari','อารีย์',3), ('silom','สีลม',4), ('sathorn','สาทร',5),
  ('ratchada','รัชดา',6), ('ladprao','ลาดพร้าว',7), ('riverside','ริมแม่น้ำ',8), ('rama9','พระราม 9',9), ('sukhumvit','สุขุมวิท',10);

insert into styles (key, name_th, icon, sort_order) values
  ('LIVE_MUSIC','Live Music','MusicNotes',1), ('CHILL','Chill','Coffee',2), ('PUB_DANCE','Pub/Dance','Disc',3),
  ('ROOFTOP','Rooftop','BuildingOffice',4), ('FOOD_FOCUSED','Food-focused','ForkKnife',5), ('QUIET','Quiet','SpeakerSimpleNone',6),
  ('OUTDOOR','Outdoor','Tree',7), ('PRIVATE_ROOM','Private Room','Door',8), ('BUFFET','Buffet','BowlFood',9);

-- checklist 9 ข้อตามหน้าเว็บ (weight รวม 100)
insert into safety_features (key, name_th, icon, weight, sort_order) values
  ('SECURITY','รปภ. / การ์ด','ShieldCheck',12,1), ('CCTV','กล้อง CCTV','VideoCamera',11,2),
  ('FIRE_EXIT','ทางหนีไฟ + ถังดับเพลิง','FireExtinguisher',11,3), ('FIRST_AID','ชุดปฐมพยาบาล','FirstAidKit',11,4),
  ('ID_CHECK','ตรวจบัตร 20+','IdentificationCard',11,5), ('PARKING_RIDE','ที่จอดรถ / เรียกรถกลับบ้าน','Car',11,6),
  ('FEMALE_STAFF','พนักงานหญิงช่วยดูแล','GenderFemale',11,7), ('LIGHTING','ทางเข้า/ที่จอดสว่าง','Lightbulb',11,8),
  ('EMERGENCY_CONTACT','ช่องทางแจ้งเหตุฉุกเฉิน','Phone',11,9);

-- ⚠️ แก้ PromptPay เป็นของจริงใน Table Editor ก่อนเปิดรับเงิน (และรอคำตอบข้อ 10.3)
insert into platform_settings (key, value) values
  ('deposit_promptpay',            '{"name":"NightOut Co., Ltd.","promptpay_id":"0812345678"}'),
  ('promotion_promptpay',          '{"name":"NightOut Co., Ltd.","promptpay_id":"0812345678"}'),
  ('slip_retention_days',          '90'),
  ('account_retention_days',       '30'),
  ('contact_phone_retention_days', '90'),
  ('min_safety_score_for_promo',   '50');

insert into legal_documents (doc_type, version, content_url, is_current) values
  ('TERMS','v1','/terms',true), ('PRIVACY','v1','/privacy',true), ('COOKIE','v1','/privacy#cookie',true),
  ('AGE_CONFIRMATION','v1','/terms#age',true);

insert into promotion_packages (name, placement, duration_days, price) values
  ('ร้านแนะนำหน้าแรก','HOME_RECOMMENDED',7,1590), ('ร้านแนะนำหน้าแรก','HOME_RECOMMENDED',14,2900),
  ('Home Banner','HOME_BANNER',7,3500), ('อันดับต้นในผลค้นหา','SEARCH_TOP',7,1500), ('อันดับต้นในผลค้นหา','SEARCH_TOP',30,4900);

-- ---------------------------------------------------------------------
-- ร้านเดโม
-- ---------------------------------------------------------------------

-- Moonlit Cellar (bar-1)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', null, 'moonlit-cellar', 'Moonlit Cellar', 'PUB_BAR', 'Moonlit Cellar · ผับ / บาร์ ย่านทองหล่อ บรรยากาศ Private Room · Pub/Dance · Rooftop เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '100 ซอยสมมติ 1 เขตทองหล่อ กรุงเทพฯ',
  (select id from districts where name_th = 'ทองหล่อ'), 13.770409, 100.592180,
  null, 'linear-gradient(135deg,#2E1065 0%,#A738F5 55%,#E8B64C 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 500, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 15
where bar_id = '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d';
update bar_stats set avg_price_per_person = 770, safety_score = 78, score = 94,
  current_stars = 5, current_tier = 'S', is_new = false,
  rating_avg = 4.8, rating_count = 978, is_editor_pick = false
where bar_id = '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d';
update bar_live_status set current_crowd = 'ALMOST_FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'MALE', 3), ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'FEMALE', 4);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 0, '18:00', '02:00', false),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 1, '18:00', '02:00', true),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 2, '18:00', '02:00', false),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 3, '18:00', '02:00', false),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 4, '18:00', '02:00', false),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 5, '18:00', '02:00', false),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', id from styles where key in ('PRIVATE_ROOM', 'PUB_DANCE', 'ROOFTOP');
insert into bar_links (bar_id, type, url, sort_order) values
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'INSTAGRAM', 'https://instagram.com/moonlitcellar', 0),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'TIKTOK', 'https://tiktok.com/@moonlitcellar', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'VAT', 'VAT', 'PERCENTAGE', 7, 2),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'OTHER', 'ค่าบริการอื่น (ต่อโต๊ะ)', 'FIXED_PER_TABLE', 200, 3);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('a395e964-4152-5ec3-ab83-fa23793b5bd3', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'เครื่องดื่ม', 0),
  ('d0143ad3-88ba-52e8-9742-4c6d01f967ea', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'มิกเซอร์', 1),
  ('9e5faf34-6352-5d6c-949d-6b9fda54f2f7', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'อาหาร', 2),
  ('ca82f5d5-0b27-5e4f-adac-80c4142ada4c', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('4b5bc1bb-7b62-527c-b33f-b6cdb8d7a67a', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'a395e964-4152-5ec3-ab83-fa23793b5bd3', 'เซ็ตขวด 700ml', 1180, true, 0),
  ('1f6fb3d7-4562-5be7-92ac-462ccd86e648', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'a395e964-4152-5ec3-ab83-fa23793b5bd3', 'เซ็ตขวด 1L', 1620, true, 1),
  ('1a556bd5-0277-5957-b642-8569a1097406', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'a395e964-4152-5ec3-ab83-fa23793b5bd3', 'ทาวเวอร์ 3L', 870, true, 2),
  ('8604123d-e41a-5c76-b77c-9b65261f7f01', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'a395e964-4152-5ec3-ab83-fa23793b5bd3', 'ค็อกเทลประจำร้าน', 310, true, 3),
  ('43486e21-67ad-5171-9980-7658b63daa7d', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'd0143ad3-88ba-52e8-9742-4c6d01f967ea', 'โซดา', 30, true, 4),
  ('7a788b4c-71d9-52ed-a784-3ad9ed798b56', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'd0143ad3-88ba-52e8-9742-4c6d01f967ea', 'น้ำแข็ง (ถัง)', 40, true, 5),
  ('9e7fc9d2-e205-5d3b-9893-6e68cdb49af5', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'd0143ad3-88ba-52e8-9742-4c6d01f967ea', 'โค้ก / สไปรท์', 30, true, 6),
  ('1182274c-83ab-5cab-8da5-10baf89ba0b5', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'd0143ad3-88ba-52e8-9742-4c6d01f967ea', 'น้ำเปล่า', 20, true, 7),
  ('b60d1b6e-4b81-5ee1-843d-c167eef69017', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', '9e5faf34-6352-5d6c-949d-6b9fda54f2f7', 'ยำรวมมิตร', 220, true, 8),
  ('876cf60f-2f7e-5246-8715-1de9d272faf7', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', '9e5faf34-6352-5d6c-949d-6b9fda54f2f7', 'ข้าวผัดต้มยำ', 180, true, 9),
  ('e7a0af46-2322-5837-b9db-f8268d7641cc', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'ca82f5d5-0b27-5e4f-adac-80c4142ada4c', 'เฟรนช์ฟรายส์', 150, true, 10),
  ('ad7f2e78-4e40-5a9f-9c46-fafb1ede2d31', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'ca82f5d5-0b27-5e4f-adac-80c4142ada4c', 'ปีกไก่ทอดน้ำปลา', 190, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('1d1f8446-f1e1-5d20-a393-2583eda1d383', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1463);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('1d1f8446-f1e1-5d20-a393-2583eda1d383', '4b5bc1bb-7b62-527c-b33f-b6cdb8d7a67a', 'เซ็ตขวด 700ml', 1, 1180, 0),
  ('1d1f8446-f1e1-5d20-a393-2583eda1d383', '43486e21-67ad-5171-9980-7658b63daa7d', 'โซดา', 6, 30, 1),
  ('1d1f8446-f1e1-5d20-a393-2583eda1d383', '7a788b4c-71d9-52ed-a784-3ad9ed798b56', 'น้ำแข็ง (ถัง)', 2, 40, 2),
  ('1d1f8446-f1e1-5d20-a393-2583eda1d383', 'e7a0af46-2322-5837-b9db-f8268d7641cc', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('1a60e5d9-0041-508a-9eb1-531bd3e0c243', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2696);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('1a60e5d9-0041-508a-9eb1-531bd3e0c243', '4b5bc1bb-7b62-527c-b33f-b6cdb8d7a67a', 'เซ็ตขวด 700ml', 2, 1180, 0),
  ('1a60e5d9-0041-508a-9eb1-531bd3e0c243', '43486e21-67ad-5171-9980-7658b63daa7d', 'โซดา', 10, 30, 1),
  ('1a60e5d9-0041-508a-9eb1-531bd3e0c243', '7a788b4c-71d9-52ed-a784-3ad9ed798b56', 'น้ำแข็ง (ถัง)', 3, 40, 2),
  ('1a60e5d9-0041-508a-9eb1-531bd3e0c243', 'e7a0af46-2322-5837-b9db-f8268d7641cc', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('f0c4c1ae-8c7b-579b-baaa-b87bc5ef7301', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4158);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('f0c4c1ae-8c7b-579b-baaa-b87bc5ef7301', '4b5bc1bb-7b62-527c-b33f-b6cdb8d7a67a', 'เซ็ตขวด 700ml', 3, 1180, 0),
  ('f0c4c1ae-8c7b-579b-baaa-b87bc5ef7301', '43486e21-67ad-5171-9980-7658b63daa7d', 'โซดา', 16, 30, 1),
  ('f0c4c1ae-8c7b-579b-baaa-b87bc5ef7301', '7a788b4c-71d9-52ed-a784-3ad9ed798b56', 'น้ำแข็ง (ถัง)', 5, 40, 2),
  ('f0c4c1ae-8c7b-579b-baaa-b87bc5ef7301', 'e7a0af46-2322-5837-b9db-f8268d7641cc', 'เฟรนช์ฟรายส์', 2, 150, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('85c66737-b561-5cdc-a815-2efbcc8db3ae', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('76c6d972-0df6-5344-a9b5-62585f7f68ff', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'Ladies Night พุธ', 'ค็อกเทลแก้วแรกฟรีสำหรับสุภาพสตรี ทุกวันพุธ', 'OTHER', '{3}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('786b8848-090f-50da-b21a-90cc60073677', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'โซนหน้าเวที', 20, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('6c202aef-721b-58e5-a18b-9f9a12630c54', '786b8848-090f-50da-b21a-90cc60073677', 'A1', 4),
  ('37faab92-a658-52c4-a014-09c80efb8316', '786b8848-090f-50da-b21a-90cc60073677', 'A2', 4),
  ('deb3e47f-ca6b-54c7-9640-772a4ebd9a4e', '786b8848-090f-50da-b21a-90cc60073677', 'A3', 4),
  ('0261093b-681a-5ab1-b164-800ff99526a0', '786b8848-090f-50da-b21a-90cc60073677', 'A4', 4),
  ('370064ce-2a5e-5396-9ae2-98da25d5c832', '786b8848-090f-50da-b21a-90cc60073677', 'A5', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('e1ce46c9-8179-5628-9398-c4f4355bfb99', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'โซนนั่งชิล', 30, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('5156b6d8-329e-5e74-be33-1a001f0e0751', 'e1ce46c9-8179-5628-9398-c4f4355bfb99', 'B1', 6),
  ('dedebd09-6fc2-5627-a2e0-d64ea4ec656c', 'e1ce46c9-8179-5628-9398-c4f4355bfb99', 'B2', 6),
  ('f9562c02-831d-5d88-85ed-c54a3e5ea639', 'e1ce46c9-8179-5628-9398-c4f4355bfb99', 'B3', 6),
  ('a2da63d9-3b85-54c6-bd1b-65c63edf32a2', 'e1ce46c9-8179-5628-9398-c4f4355bfb99', 'B4', 6),
  ('0b909151-5306-5e59-998c-836484faa71c', 'e1ce46c9-8179-5628-9398-c4f4355bfb99', 'B5', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('26d911f1-d55e-5bed-bb80-171fcc3f4dc6', '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('f68a2f8e-f1e5-56e4-8f7a-36158f6ca239', '26d911f1-d55e-5bed-bb80-171fcc3f4dc6', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'SECURITY', 'YES', 'SELF_DECLARED', null),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'FIRE_EXIT', 'UNKNOWN', 'SELF_DECLARED', null),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'FIRST_AID', 'YES', 'SELF_DECLARED', null),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'ID_CHECK', 'YES', 'ADMIN_VERIFIED', now()),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'PARKING_RIDE', 'YES', 'SELF_DECLARED', null),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'FEMALE_STAFF', 'NO', 'SELF_DECLARED', null),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'LIGHTING', 'YES', 'SELF_DECLARED', null),
  ('96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);
insert into promoted_listings (bar_id, package_id, placement, price_paid, starts_at, ends_at, status, approved_at)
select '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d', id, placement, price, now() - interval '1 day', now() + interval '30 days', 'ACTIVE', now()
from promotion_packages where placement = 'HOME_RECOMMENDED' and duration_days = 7 limit 1;

-- Velvet Hour (bar-2)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('0cccc294-d9b5-501e-bf33-a900f1188f90', null, 'velvet-hour', 'Velvet Hour', 'CHILL', 'Velvet Hour · ร้านนั่งชิล ย่านเอกมัย บรรยากาศ Outdoor · Live Music · Pub/Dance เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '107 ซอยสมมติ 2 เขตเอกมัย กรุงเทพฯ',
  (select id from districts where name_th = 'เอกมัย'), 13.793190, 100.596551,
  null, 'linear-gradient(135deg,#0B1026 0%,#5869C8 60%,#A738F5 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 30
where bar_id = '0cccc294-d9b5-501e-bf33-a900f1188f90';
update bar_stats set avg_price_per_person = 960, safety_score = 89, score = 49,
  current_stars = 2, current_tier = 'C', is_new = false,
  rating_avg = 3.1, rating_count = 61, is_editor_pick = false
where bar_id = '0cccc294-d9b5-501e-bf33-a900f1188f90';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '0cccc294-d9b5-501e-bf33-a900f1188f90';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 0, '18:00', '02:00', false),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 1, '18:00', '02:00', false),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 2, '18:00', '02:00', false),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 3, '18:00', '02:00', false),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 4, '18:00', '02:00', false),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 5, '18:00', '02:00', false),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '0cccc294-d9b5-501e-bf33-a900f1188f90', id from styles where key in ('OUTDOOR', 'LIVE_MUSIC', 'PUB_DANCE');
insert into bar_links (bar_id, type, url, sort_order) values
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'INSTAGRAM', 'https://instagram.com/velvethour', 0),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'TIKTOK', 'https://tiktok.com/@velvethour', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('c8b116a1-01d6-5775-a7b5-fd3cd0486c89', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'เครื่องดื่ม', 0),
  ('13332d64-b7f0-552d-8bd3-8f10194ece16', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'มิกเซอร์', 1),
  ('669e83d6-39f0-5f3e-bc3f-5bb8030333ed', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'อาหาร', 2),
  ('5536210f-bad2-504c-aee0-b43d2481c53a', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('19de9660-6da4-5f9a-a503-5ec0b8c432c4', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'c8b116a1-01d6-5775-a7b5-fd3cd0486c89', 'เซ็ตขวด 700ml', 1460, true, 0),
  ('a60007e4-ac89-5c6e-a61a-b4dc8d6b501f', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'c8b116a1-01d6-5775-a7b5-fd3cd0486c89', 'เซ็ตขวด 1L', 2000, true, 1),
  ('6aeaf4a2-5e5c-5800-8ee2-34f6cf259643', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'c8b116a1-01d6-5775-a7b5-fd3cd0486c89', 'ทาวเวอร์ 3L', 1080, true, 2),
  ('e73528cd-42e9-5001-ba5c-56137315f033', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'c8b116a1-01d6-5775-a7b5-fd3cd0486c89', 'ค็อกเทลประจำร้าน', 390, true, 3),
  ('34ad9747-b102-5150-ad3f-efa6e47c366a', '0cccc294-d9b5-501e-bf33-a900f1188f90', '13332d64-b7f0-552d-8bd3-8f10194ece16', 'โซดา', 40, true, 4),
  ('6ddd3be5-05cf-5eec-bd02-85039ccd99b5', '0cccc294-d9b5-501e-bf33-a900f1188f90', '13332d64-b7f0-552d-8bd3-8f10194ece16', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('af2c3a77-9a0d-5579-b218-98b92d188558', '0cccc294-d9b5-501e-bf33-a900f1188f90', '13332d64-b7f0-552d-8bd3-8f10194ece16', 'โค้ก / สไปรท์', 40, true, 6),
  ('37623072-7027-5306-8052-9dfc3e01b106', '0cccc294-d9b5-501e-bf33-a900f1188f90', '13332d64-b7f0-552d-8bd3-8f10194ece16', 'น้ำเปล่า', 30, true, 7),
  ('35608d96-abff-5ef0-a02c-0289e0991e27', '0cccc294-d9b5-501e-bf33-a900f1188f90', '669e83d6-39f0-5f3e-bc3f-5bb8030333ed', 'ยำรวมมิตร', 270, true, 8),
  ('d2cb8b45-4d77-5518-a6a1-02f77d6ab860', '0cccc294-d9b5-501e-bf33-a900f1188f90', '669e83d6-39f0-5f3e-bc3f-5bb8030333ed', 'ข้าวผัดต้มยำ', 220, true, 9),
  ('f532718a-3975-5f65-b202-58974f26f147', '0cccc294-d9b5-501e-bf33-a900f1188f90', '5536210f-bad2-504c-aee0-b43d2481c53a', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('d1c6550b-b594-52ed-9aa7-c1e93ae4ffb2', '0cccc294-d9b5-501e-bf33-a900f1188f90', '5536210f-bad2-504c-aee0-b43d2481c53a', 'ปีกไก่ทอดน้ำปลา', 230, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('fbdf1ddb-7fed-51e0-9a2a-2e18b613de04', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1822);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('fbdf1ddb-7fed-51e0-9a2a-2e18b613de04', '19de9660-6da4-5f9a-a503-5ec0b8c432c4', 'เซ็ตขวด 700ml', 1, 1460, 0),
  ('fbdf1ddb-7fed-51e0-9a2a-2e18b613de04', '34ad9747-b102-5150-ad3f-efa6e47c366a', 'โซดา', 6, 40, 1),
  ('fbdf1ddb-7fed-51e0-9a2a-2e18b613de04', '6ddd3be5-05cf-5eec-bd02-85039ccd99b5', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('fbdf1ddb-7fed-51e0-9a2a-2e18b613de04', 'f532718a-3975-5f65-b202-58974f26f147', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('abd15af1-3a90-58b9-8a33-d1c8cf0cb1f6', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3358);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('abd15af1-3a90-58b9-8a33-d1c8cf0cb1f6', '19de9660-6da4-5f9a-a503-5ec0b8c432c4', 'เซ็ตขวด 700ml', 2, 1460, 0),
  ('abd15af1-3a90-58b9-8a33-d1c8cf0cb1f6', '34ad9747-b102-5150-ad3f-efa6e47c366a', 'โซดา', 10, 40, 1),
  ('abd15af1-3a90-58b9-8a33-d1c8cf0cb1f6', '6ddd3be5-05cf-5eec-bd02-85039ccd99b5', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('abd15af1-3a90-58b9-8a33-d1c8cf0cb1f6', 'f532718a-3975-5f65-b202-58974f26f147', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('8ad1cc11-cf0b-54e2-91b9-e5c6518b8599', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5180);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('8ad1cc11-cf0b-54e2-91b9-e5c6518b8599', '19de9660-6da4-5f9a-a503-5ec0b8c432c4', 'เซ็ตขวด 700ml', 3, 1460, 0),
  ('8ad1cc11-cf0b-54e2-91b9-e5c6518b8599', '34ad9747-b102-5150-ad3f-efa6e47c366a', 'โซดา', 16, 40, 1),
  ('8ad1cc11-cf0b-54e2-91b9-e5c6518b8599', '6ddd3be5-05cf-5eec-bd02-85039ccd99b5', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('8ad1cc11-cf0b-54e2-91b9-e5c6518b8599', 'f532718a-3975-5f65-b202-58974f26f147', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('d289c411-ae57-5cdc-8ad0-bd909fe55b4e', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('58f7fbec-2b77-5664-90dd-96bb881c4aa8', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'มา 6 คนขึ้นไป ฟรีของทานเล่น 1 จาน', 'จองผ่าน NightOut และเช็กอินครบตามจำนวน', 'FREE_APPETIZER', '{0,1,2,3,4,5,6}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('0169e01a-fbfe-5a2a-89bf-9a56ec69d8ec', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'โซนหน้าเวที', 16, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('c7ad4c76-bbbb-5e07-8e99-7758f0e4b69f', '0169e01a-fbfe-5a2a-89bf-9a56ec69d8ec', 'A1', 4),
  ('02148cf1-e04f-549e-a499-e8d240355b0c', '0169e01a-fbfe-5a2a-89bf-9a56ec69d8ec', 'A2', 4),
  ('a2d35a84-6229-5545-93af-9e82615d34d3', '0169e01a-fbfe-5a2a-89bf-9a56ec69d8ec', 'A3', 4),
  ('e40a53fa-22ef-5dfa-85e8-7019327f5138', '0169e01a-fbfe-5a2a-89bf-9a56ec69d8ec', 'A4', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('b8c675be-dc2f-500a-aa49-23681b42f418', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'โซนนั่งชิล', 24, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('38abc9ad-e0a0-560a-ba09-a393e756a089', 'b8c675be-dc2f-500a-aa49-23681b42f418', 'B1', 6),
  ('7ab11813-f2fd-5ed3-9ea1-3d3760862087', 'b8c675be-dc2f-500a-aa49-23681b42f418', 'B2', 6),
  ('0d3e3630-0308-5271-b6ec-bb70a74b70a5', 'b8c675be-dc2f-500a-aa49-23681b42f418', 'B3', 6),
  ('5eccf372-e718-58bc-b780-5021c0cd81a0', 'b8c675be-dc2f-500a-aa49-23681b42f418', 'B4', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('bc037772-97f1-5115-ab66-6e2161ad2ada', '0cccc294-d9b5-501e-bf33-a900f1188f90', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('19cebaf1-1686-582e-af4c-6b69700d0034', 'bc037772-97f1-5115-ab66-6e2161ad2ada', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'CCTV', 'YES', 'SELF_DECLARED', null),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'FIRST_AID', 'YES', 'SELF_DECLARED', null),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'ID_CHECK', 'YES', 'SELF_DECLARED', null),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'PARKING_RIDE', 'YES', 'ADMIN_VERIFIED', now()),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'FEMALE_STAFF', 'NO', 'ADMIN_VERIFIED', now()),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'LIGHTING', 'YES', 'SELF_DECLARED', null),
  ('0cccc294-d9b5-501e-bf33-a900f1188f90', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);

-- Amber Alley (bar-3)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', null, 'amber-alley', 'Amber Alley', 'RESTAURANT', 'Amber Alley · ร้านอาหารมีเครื่องดื่ม ย่านอารีย์ บรรยากาศ Food-focused · Private Room เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '114 ซอยสมมติ 3 เขตอารีย์ กรุงเทพฯ',
  (select id from districts where name_th = 'อารีย์'), 13.817413, 100.589900,
  null, 'linear-gradient(135deg,#1A0B2E 0%,#963BE8 50%,#FFD77A 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 60
where bar_id = 'fdbadfd4-d389-5cef-aee5-e622cc607bdf';
update bar_stats set avg_price_per_person = 770, safety_score = 67, score = 45,
  current_stars = 2, current_tier = 'C', is_new = false,
  rating_avg = 2.9, rating_count = 1022, is_editor_pick = false
where bar_id = 'fdbadfd4-d389-5cef-aee5-e622cc607bdf';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = 'fdbadfd4-d389-5cef-aee5-e622cc607bdf';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 0, '18:00', '02:00', false),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 1, '18:00', '02:00', false),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 2, '18:00', '02:00', false),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 3, '18:00', '02:00', false),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 4, '18:00', '02:00', false),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 5, '18:00', '02:00', false),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', id from styles where key in ('FOOD_FOCUSED', 'PRIVATE_ROOM');
insert into bar_links (bar_id, type, url, sort_order) values
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'INSTAGRAM', 'https://instagram.com/amberalley', 0),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'TIKTOK', 'https://tiktok.com/@amberalley', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('80b85864-81ba-577f-9518-b92cb4313a88', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'เครื่องดื่ม', 0),
  ('bf956250-030a-56a7-9690-e77d6eedf08e', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'มิกเซอร์', 1),
  ('2711261b-78c2-50b5-8cf1-597e5441de6b', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'อาหาร', 2),
  ('cb537754-f426-5a88-84d8-5f1871ed8fd2', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('5be6e687-efc9-5a1b-86d9-b09f90bf5d12', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', '80b85864-81ba-577f-9518-b92cb4313a88', 'เซ็ตขวด 700ml', 1180, true, 0),
  ('c908f09b-213d-5ec2-9ed6-4d1f499b2302', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', '80b85864-81ba-577f-9518-b92cb4313a88', 'เซ็ตขวด 1L', 1620, true, 1),
  ('177d9732-5006-585d-b773-8e338f6e0537', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', '80b85864-81ba-577f-9518-b92cb4313a88', 'ทาวเวอร์ 3L', 880, true, 2),
  ('5e725f45-1450-5606-bc96-ea2e89845d4c', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', '80b85864-81ba-577f-9518-b92cb4313a88', 'ค็อกเทลประจำร้าน', 310, true, 3),
  ('3c2b1890-098c-51d0-a949-f0f9cdad97e3', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'bf956250-030a-56a7-9690-e77d6eedf08e', 'โซดา', 30, true, 4),
  ('f34d250e-a061-5e39-bd93-9d395986ce5d', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'bf956250-030a-56a7-9690-e77d6eedf08e', 'น้ำแข็ง (ถัง)', 40, true, 5),
  ('e901663b-db76-502b-b9fe-555c93cb29e4', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'bf956250-030a-56a7-9690-e77d6eedf08e', 'โค้ก / สไปรท์', 30, true, 6),
  ('6d2fb0b2-7135-52e8-a88a-15a2822727f3', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'bf956250-030a-56a7-9690-e77d6eedf08e', 'น้ำเปล่า', 20, true, 7),
  ('b55dd901-f06f-5c5b-8bd2-b901e22097ab', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', '2711261b-78c2-50b5-8cf1-597e5441de6b', 'ยำรวมมิตร', 220, true, 8),
  ('117fbaff-cda9-53d1-b052-52f3ee91d7b5', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', '2711261b-78c2-50b5-8cf1-597e5441de6b', 'ข้าวผัดต้มยำ', 180, true, 9),
  ('4e27718f-4933-5397-b103-c6b91a1334cb', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'cb537754-f426-5a88-84d8-5f1871ed8fd2', 'เฟรนช์ฟรายส์', 150, true, 10),
  ('25afb6be-9690-58b5-af85-4915af3200c6', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'cb537754-f426-5a88-84d8-5f1871ed8fd2', 'ปีกไก่ทอดน้ำปลา', 190, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('256ff977-fc20-570e-85d8-31dadf6836a5', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1463);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('256ff977-fc20-570e-85d8-31dadf6836a5', '5be6e687-efc9-5a1b-86d9-b09f90bf5d12', 'เซ็ตขวด 700ml', 1, 1180, 0),
  ('256ff977-fc20-570e-85d8-31dadf6836a5', '3c2b1890-098c-51d0-a949-f0f9cdad97e3', 'โซดา', 6, 30, 1),
  ('256ff977-fc20-570e-85d8-31dadf6836a5', 'f34d250e-a061-5e39-bd93-9d395986ce5d', 'น้ำแข็ง (ถัง)', 2, 40, 2),
  ('256ff977-fc20-570e-85d8-31dadf6836a5', '4e27718f-4933-5397-b103-c6b91a1334cb', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('8fa20d4b-89bf-5175-9f32-8c607f6e1d60', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2696);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('8fa20d4b-89bf-5175-9f32-8c607f6e1d60', '5be6e687-efc9-5a1b-86d9-b09f90bf5d12', 'เซ็ตขวด 700ml', 2, 1180, 0),
  ('8fa20d4b-89bf-5175-9f32-8c607f6e1d60', '3c2b1890-098c-51d0-a949-f0f9cdad97e3', 'โซดา', 10, 30, 1),
  ('8fa20d4b-89bf-5175-9f32-8c607f6e1d60', 'f34d250e-a061-5e39-bd93-9d395986ce5d', 'น้ำแข็ง (ถัง)', 3, 40, 2),
  ('8fa20d4b-89bf-5175-9f32-8c607f6e1d60', '4e27718f-4933-5397-b103-c6b91a1334cb', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('596a448d-e374-55f4-8558-0f80b4fe5db1', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4158);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('596a448d-e374-55f4-8558-0f80b4fe5db1', '5be6e687-efc9-5a1b-86d9-b09f90bf5d12', 'เซ็ตขวด 700ml', 3, 1180, 0),
  ('596a448d-e374-55f4-8558-0f80b4fe5db1', '3c2b1890-098c-51d0-a949-f0f9cdad97e3', 'โซดา', 16, 30, 1),
  ('596a448d-e374-55f4-8558-0f80b4fe5db1', 'f34d250e-a061-5e39-bd93-9d395986ce5d', 'น้ำแข็ง (ถัง)', 5, 40, 2),
  ('596a448d-e374-55f4-8558-0f80b4fe5db1', '4e27718f-4933-5397-b103-c6b91a1334cb', 'เฟรนช์ฟรายส์', 2, 150, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('2c6eaeaf-5000-51e2-9710-7ed0ac0a309f', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('3277d9ca-2d11-53e8-b492-f28175212ba1', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'โซนหน้าเวที', 20, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('3ccbe2af-48e0-5bbc-9afe-59fdcbf2f50e', '3277d9ca-2d11-53e8-b492-f28175212ba1', 'A1', 4),
  ('52e2931e-5318-570f-bb8c-27e1e64a3511', '3277d9ca-2d11-53e8-b492-f28175212ba1', 'A2', 4),
  ('c4b38cc4-9e35-50d9-bcfb-6c2fd81798f8', '3277d9ca-2d11-53e8-b492-f28175212ba1', 'A3', 4),
  ('4eefd468-babd-5eda-8f34-5a9051ba4642', '3277d9ca-2d11-53e8-b492-f28175212ba1', 'A4', 4),
  ('a06bac29-c000-5134-9adc-74f2d9d01313', '3277d9ca-2d11-53e8-b492-f28175212ba1', 'A5', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('7f2d1098-0b01-5da0-9e26-450e970eb84d', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'โซนนั่งชิล', 30, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('bdb66b90-00ba-5f6f-ad5f-1e9c2dbad3b8', '7f2d1098-0b01-5da0-9e26-450e970eb84d', 'B1', 6),
  ('4962b676-d6ac-5137-b606-95d1b50c298b', '7f2d1098-0b01-5da0-9e26-450e970eb84d', 'B2', 6),
  ('33c76e30-40ed-52fb-b63f-2e2995383e53', '7f2d1098-0b01-5da0-9e26-450e970eb84d', 'B3', 6),
  ('341db696-a1c4-5535-a3d8-23c8981306d8', '7f2d1098-0b01-5da0-9e26-450e970eb84d', 'B4', 6),
  ('900e3d19-a5a9-5c39-b060-d1f3bdfc2c53', '7f2d1098-0b01-5da0-9e26-450e970eb84d', 'B5', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('f9993107-e4bd-5fbc-b299-6a4ae98dae96', 'fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('d3b8efbc-1b90-559d-b0b9-24db1aee97f4', 'f9993107-e4bd-5fbc-b299-6a4ae98dae96', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'CCTV', 'NO', 'ADMIN_VERIFIED', now()),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'FIRST_AID', 'YES', 'SELF_DECLARED', null),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'ID_CHECK', 'YES', 'ADMIN_VERIFIED', now()),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'PARKING_RIDE', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'FEMALE_STAFF', 'YES', 'SELF_DECLARED', null),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'LIGHTING', 'NO', 'ADMIN_VERIFIED', now()),
  ('fdbadfd4-d389-5cef-aee5-e622cc607bdf', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());

-- Neon Orchid (bar-4)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('f19f3694-3757-500b-a54a-71bd7bd1d616', null, 'neon-orchid', 'Neon Orchid', 'PUB_BAR', 'Neon Orchid · ผับ / บาร์ ย่านสีลม บรรยากาศ Pub/Dance · Chill · Quiet เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '121 ซอยสมมติ 4 เขตสีลม กรุงเทพฯ',
  (select id from districts where name_th = 'สีลม'), 13.816015, 100.590256,
  null, 'linear-gradient(135deg,#07070D 0%,#34283F 40%,#E8B64C 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 500, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 15
where bar_id = 'f19f3694-3757-500b-a54a-71bd7bd1d616';
update bar_stats set avg_price_per_person = 680, safety_score = 78, score = 63,
  current_stars = 3, current_tier = 'B', is_new = false,
  rating_avg = 3.6, rating_count = 410, is_editor_pick = false
where bar_id = 'f19f3694-3757-500b-a54a-71bd7bd1d616';
update bar_live_status set current_crowd = 'ALMOST_FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = 'f19f3694-3757-500b-a54a-71bd7bd1d616';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'MALE', 1), ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'FEMALE', 2);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 0, '18:00', '02:00', false),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 1, '18:00', '02:00', false),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 2, '18:00', '02:00', false),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 3, '18:00', '02:00', false),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 4, '18:00', '02:00', false),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 5, '18:00', '02:00', false),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select 'f19f3694-3757-500b-a54a-71bd7bd1d616', id from styles where key in ('PUB_DANCE', 'CHILL', 'QUIET');
insert into bar_links (bar_id, type, url, sort_order) values
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'INSTAGRAM', 'https://instagram.com/neonorchid', 0),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'TIKTOK', 'https://tiktok.com/@neonorchid', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'VAT', 'VAT', 'PERCENTAGE', 7, 2),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'OTHER', 'ค่าบริการอื่น (ต่อโต๊ะ)', 'FIXED_PER_TABLE', 200, 3);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('a368f37c-dde4-5ffb-a179-0d18df7b0f93', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'เครื่องดื่ม', 0),
  ('faa5f21e-20f9-547e-a3b9-c145cf77eea9', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'มิกเซอร์', 1),
  ('ccb9e050-2a04-5205-938b-8670c9e83f00', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'อาหาร', 2),
  ('c62cbf95-bf62-50da-b39b-d7d58d0fd680', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('fc350dc6-6d82-54d0-9421-f5baed16a856', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'a368f37c-dde4-5ffb-a179-0d18df7b0f93', 'เซ็ตขวด 700ml', 1030, true, 0),
  ('dda711f5-87e7-597e-97e0-b590753f32e0', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'a368f37c-dde4-5ffb-a179-0d18df7b0f93', 'เซ็ตขวด 1L', 1420, true, 1),
  ('ca3b8835-8497-5ceb-ab3f-c637a7439108', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'a368f37c-dde4-5ffb-a179-0d18df7b0f93', 'ทาวเวอร์ 3L', 770, true, 2),
  ('50b6fc1b-c32c-5c23-b672-f3c96d7d9448', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'a368f37c-dde4-5ffb-a179-0d18df7b0f93', 'ค็อกเทลประจำร้าน', 280, true, 3),
  ('07e8223b-a2d5-5f77-9249-1b093fa8a436', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'faa5f21e-20f9-547e-a3b9-c145cf77eea9', 'โซดา', 30, true, 4),
  ('74a4fb3c-af72-5048-835c-a20cd33de2c3', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'faa5f21e-20f9-547e-a3b9-c145cf77eea9', 'น้ำแข็ง (ถัง)', 30, true, 5),
  ('a7c03d86-4a5b-50c0-9f95-1b847ee043d6', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'faa5f21e-20f9-547e-a3b9-c145cf77eea9', 'โค้ก / สไปรท์', 30, true, 6),
  ('3a377dd1-3d95-5674-985a-4008170c368b', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'faa5f21e-20f9-547e-a3b9-c145cf77eea9', 'น้ำเปล่า', 20, true, 7),
  ('24b56563-bcc1-5eba-af90-af012a0a9be7', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'ccb9e050-2a04-5205-938b-8670c9e83f00', 'ยำรวมมิตร', 190, true, 8),
  ('53d34dcf-290a-5404-abcd-d1e28e619e08', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'ccb9e050-2a04-5205-938b-8670c9e83f00', 'ข้าวผัดต้มยำ', 150, true, 9),
  ('a5d0c9ab-f746-5353-a525-c9cc3820ee72', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'c62cbf95-bf62-50da-b39b-d7d58d0fd680', 'เฟรนช์ฟรายส์', 130, true, 10),
  ('f50ba6a8-2b9f-5a4c-afe3-ebd71bab986f', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'c62cbf95-bf62-50da-b39b-d7d58d0fd680', 'ปีกไก่ทอดน้ำปลา', 160, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('23b7e52f-a022-5571-9db6-6d656d34aa13', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1288);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('23b7e52f-a022-5571-9db6-6d656d34aa13', 'fc350dc6-6d82-54d0-9421-f5baed16a856', 'เซ็ตขวด 700ml', 1, 1030, 0),
  ('23b7e52f-a022-5571-9db6-6d656d34aa13', '07e8223b-a2d5-5f77-9249-1b093fa8a436', 'โซดา', 6, 30, 1),
  ('23b7e52f-a022-5571-9db6-6d656d34aa13', '74a4fb3c-af72-5048-835c-a20cd33de2c3', 'น้ำแข็ง (ถัง)', 2, 30, 2),
  ('23b7e52f-a022-5571-9db6-6d656d34aa13', 'a5d0c9ab-f746-5353-a525-c9cc3820ee72', 'เฟรนช์ฟรายส์', 1, 130, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('0fec306a-8e2f-5f48-8b0f-1505423bda6c', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2374);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('0fec306a-8e2f-5f48-8b0f-1505423bda6c', 'fc350dc6-6d82-54d0-9421-f5baed16a856', 'เซ็ตขวด 700ml', 2, 1030, 0),
  ('0fec306a-8e2f-5f48-8b0f-1505423bda6c', '07e8223b-a2d5-5f77-9249-1b093fa8a436', 'โซดา', 10, 30, 1),
  ('0fec306a-8e2f-5f48-8b0f-1505423bda6c', '74a4fb3c-af72-5048-835c-a20cd33de2c3', 'น้ำแข็ง (ถัง)', 3, 30, 2),
  ('0fec306a-8e2f-5f48-8b0f-1505423bda6c', 'a5d0c9ab-f746-5353-a525-c9cc3820ee72', 'เฟรนช์ฟรายส์', 1, 130, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('4d95e9a5-4bd6-5d6d-9e8c-a2f8073b23b8', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 3662);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('4d95e9a5-4bd6-5d6d-9e8c-a2f8073b23b8', 'fc350dc6-6d82-54d0-9421-f5baed16a856', 'เซ็ตขวด 700ml', 3, 1030, 0),
  ('4d95e9a5-4bd6-5d6d-9e8c-a2f8073b23b8', '07e8223b-a2d5-5f77-9249-1b093fa8a436', 'โซดา', 16, 30, 1),
  ('4d95e9a5-4bd6-5d6d-9e8c-a2f8073b23b8', '74a4fb3c-af72-5048-835c-a20cd33de2c3', 'น้ำแข็ง (ถัง)', 5, 30, 2),
  ('4d95e9a5-4bd6-5d6d-9e8c-a2f8073b23b8', 'a5d0c9ab-f746-5353-a525-c9cc3820ee72', 'เฟรนช์ฟรายส์', 2, 130, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('a1140b8e-c157-5333-95bd-fcef0fbc8262', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('66b9705c-d90a-52ba-a19a-4cdccc05b013', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'Ladies Night พุธ', 'ค็อกเทลแก้วแรกฟรีสำหรับสุภาพสตรี ทุกวันพุธ', 'OTHER', '{3}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('5ceb3258-ebef-5ad2-8f7a-02360f116fc9', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'โซนหน้าเวที', 16, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('428d8c36-4c8b-546e-8e01-5a2d882683d7', '5ceb3258-ebef-5ad2-8f7a-02360f116fc9', 'A1', 4),
  ('0de293aa-6d8a-5246-a838-945ef4dd7404', '5ceb3258-ebef-5ad2-8f7a-02360f116fc9', 'A2', 4),
  ('86f7c4c7-6474-5749-aa77-f53a9967b2b0', '5ceb3258-ebef-5ad2-8f7a-02360f116fc9', 'A3', 4),
  ('a9c1e610-63a7-5244-9b43-be3a39a0dec1', '5ceb3258-ebef-5ad2-8f7a-02360f116fc9', 'A4', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('fd36071e-ba25-578a-a140-3f22081bc10b', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'โซนนั่งชิล', 24, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('7d4570e2-bdf8-55e3-960e-1a84be1f2711', 'fd36071e-ba25-578a-a140-3f22081bc10b', 'B1', 6),
  ('fe899507-5e94-5a2c-8cf5-c774dbf6a898', 'fd36071e-ba25-578a-a140-3f22081bc10b', 'B2', 6),
  ('db2d9c77-9e69-5146-806d-9d037ea72caf', 'fd36071e-ba25-578a-a140-3f22081bc10b', 'B3', 6),
  ('4ab5fde5-7b91-5097-8f9c-29cc83ba8f96', 'fd36071e-ba25-578a-a140-3f22081bc10b', 'B4', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('2dfb4e4b-76e9-518a-b909-459e99ba51bd', 'f19f3694-3757-500b-a54a-71bd7bd1d616', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('03a2f5f1-ee62-55b7-a042-6c86843cb317', '2dfb4e4b-76e9-518a-b909-459e99ba51bd', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'FIRE_EXIT', 'YES', 'SELF_DECLARED', null),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'FIRST_AID', 'YES', 'ADMIN_VERIFIED', now()),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'ID_CHECK', 'YES', 'SELF_DECLARED', null),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'PARKING_RIDE', 'NO', 'ADMIN_VERIFIED', now()),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'FEMALE_STAFF', 'YES', 'ADMIN_VERIFIED', now()),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'LIGHTING', 'UNKNOWN', 'SELF_DECLARED', null),
  ('f19f3694-3757-500b-a54a-71bd7bd1d616', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());
insert into promoted_listings (bar_id, package_id, placement, price_paid, starts_at, ends_at, status, approved_at)
select 'f19f3694-3757-500b-a54a-71bd7bd1d616', id, placement, price, now() - interval '1 day', now() + interval '30 days', 'ACTIVE', now()
from promotion_packages where placement = 'HOME_RECOMMENDED' and duration_days = 7 limit 1;

-- The Quiet Barrel (bar-5)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', null, 'the-quiet-barrel', 'The Quiet Barrel', 'CHILL', 'The Quiet Barrel · ร้านนั่งชิล ย่านสาทร บรรยากาศ Quiet · Live Music · Private Room เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '128 ซอยสมมติ 5 เขตสาทร กรุงเทพฯ',
  (select id from districts where name_th = 'สาทร'), 13.812447, 100.603257,
  null, 'linear-gradient(135deg,#140A1F 0%,#7E22CE 60%,#F5C85E 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 30
where bar_id = 'ca9df1a8-3a56-5dc6-849e-ea71be97f004';
update bar_stats set avg_price_per_person = 890, safety_score = 78, score = 74,
  current_stars = 3, current_tier = 'B', is_new = false,
  rating_avg = 4, rating_count = 1221, is_editor_pick = false
where bar_id = 'ca9df1a8-3a56-5dc6-849e-ea71be97f004';
update bar_live_status set current_crowd = 'ALMOST_FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = 'ca9df1a8-3a56-5dc6-849e-ea71be97f004';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'FEMALE', 1);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 0, '18:00', '02:00', false),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 1, '18:00', '02:00', true),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 2, '18:00', '02:00', false),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 3, '18:00', '02:00', false),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 4, '18:00', '02:00', false),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 5, '18:00', '02:00', false),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', id from styles where key in ('QUIET', 'LIVE_MUSIC', 'PRIVATE_ROOM');
insert into bar_links (bar_id, type, url, sort_order) values
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'INSTAGRAM', 'https://instagram.com/thequietbarrel', 0),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'TIKTOK', 'https://tiktok.com/@thequietbarrel', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('f61bd96e-96b2-5717-bbfe-3ac0c419382d', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'เครื่องดื่ม', 0),
  ('7f990271-167e-57c8-8b9a-35928ac36c92', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'มิกเซอร์', 1),
  ('eec97e1b-0c89-5975-a7e1-3dfdff7cb5bd', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'อาหาร', 2),
  ('858bd34a-9db1-5be0-bc9f-1a10e40e14f8', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('1054f70d-c2ed-5bc2-880b-b0575784956f', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'f61bd96e-96b2-5717-bbfe-3ac0c419382d', 'เซ็ตขวด 700ml', 1380, true, 0),
  ('347a8494-f061-5d7a-82c6-5568cca39f4f', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'f61bd96e-96b2-5717-bbfe-3ac0c419382d', 'เซ็ตขวด 1L', 1900, true, 1),
  ('0a8b48b1-505c-5656-8189-576dd8ce9344', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'f61bd96e-96b2-5717-bbfe-3ac0c419382d', 'ทาวเวอร์ 3L', 1020, true, 2),
  ('e2dd8a80-166e-5941-b5fe-bbcd935e2a12', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'f61bd96e-96b2-5717-bbfe-3ac0c419382d', 'ค็อกเทลประจำร้าน', 370, true, 3),
  ('04f29ed5-6ce8-57a3-a8eb-d9458db889a1', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', '7f990271-167e-57c8-8b9a-35928ac36c92', 'โซดา', 30, true, 4),
  ('04c0ebce-64b8-533c-b360-0d6fadf2d9d4', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', '7f990271-167e-57c8-8b9a-35928ac36c92', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('b5e5d572-e663-580c-b746-274396639494', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', '7f990271-167e-57c8-8b9a-35928ac36c92', 'โค้ก / สไปรท์', 40, true, 6),
  ('aac9b76c-8556-584f-b559-d6a42b0111c0', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', '7f990271-167e-57c8-8b9a-35928ac36c92', 'น้ำเปล่า', 30, true, 7),
  ('5a00663e-1f96-5ef9-968a-0d423857b9d5', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'eec97e1b-0c89-5975-a7e1-3dfdff7cb5bd', 'ยำรวมมิตร', 250, true, 8),
  ('25c48153-0454-5279-8a44-ef80f674b145', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'eec97e1b-0c89-5975-a7e1-3dfdff7cb5bd', 'ข้าวผัดต้มยำ', 210, true, 9),
  ('ec7b6553-30fd-5e09-8a37-18016621249a', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', '858bd34a-9db1-5be0-bc9f-1a10e40e14f8', 'เฟรนช์ฟรายส์', 170, true, 10),
  ('c20e15b1-ead0-5244-8b38-0238b7dcda97', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', '858bd34a-9db1-5be0-bc9f-1a10e40e14f8', 'ปีกไก่ทอดน้ำปลา', 220, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('a6e13805-c401-52b8-a2ae-e39a12e0934f', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1684);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('a6e13805-c401-52b8-a2ae-e39a12e0934f', '1054f70d-c2ed-5bc2-880b-b0575784956f', 'เซ็ตขวด 700ml', 1, 1380, 0),
  ('a6e13805-c401-52b8-a2ae-e39a12e0934f', '04f29ed5-6ce8-57a3-a8eb-d9458db889a1', 'โซดา', 6, 30, 1),
  ('a6e13805-c401-52b8-a2ae-e39a12e0934f', '04c0ebce-64b8-533c-b360-0d6fadf2d9d4', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('a6e13805-c401-52b8-a2ae-e39a12e0934f', 'ec7b6553-30fd-5e09-8a37-18016621249a', 'เฟรนช์ฟรายส์', 1, 170, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('683586a3-7390-5122-bd3c-c34f136d8bfb', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3110);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('683586a3-7390-5122-bd3c-c34f136d8bfb', '1054f70d-c2ed-5bc2-880b-b0575784956f', 'เซ็ตขวด 700ml', 2, 1380, 0),
  ('683586a3-7390-5122-bd3c-c34f136d8bfb', '04f29ed5-6ce8-57a3-a8eb-d9458db889a1', 'โซดา', 10, 30, 1),
  ('683586a3-7390-5122-bd3c-c34f136d8bfb', '04c0ebce-64b8-533c-b360-0d6fadf2d9d4', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('683586a3-7390-5122-bd3c-c34f136d8bfb', 'ec7b6553-30fd-5e09-8a37-18016621249a', 'เฟรนช์ฟรายส์', 1, 170, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('98ae48c3-915c-50f0-9257-06143f482499', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4793);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('98ae48c3-915c-50f0-9257-06143f482499', '1054f70d-c2ed-5bc2-880b-b0575784956f', 'เซ็ตขวด 700ml', 3, 1380, 0),
  ('98ae48c3-915c-50f0-9257-06143f482499', '04f29ed5-6ce8-57a3-a8eb-d9458db889a1', 'โซดา', 16, 30, 1),
  ('98ae48c3-915c-50f0-9257-06143f482499', '04c0ebce-64b8-533c-b360-0d6fadf2d9d4', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('98ae48c3-915c-50f0-9257-06143f482499', 'ec7b6553-30fd-5e09-8a37-18016621249a', 'เฟรนช์ฟรายส์', 2, 170, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('c15c68d9-71dd-5d4c-85be-6f70c26608b0', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('f0e458ed-0a9e-521c-b582-912d913ffea5', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'โซนหน้าเวที', 12, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('26621fe6-d9cc-5adc-8961-d1c3a8d6c57c', 'f0e458ed-0a9e-521c-b582-912d913ffea5', 'A1', 4),
  ('ecc50df8-3a0f-5d7d-8a4f-e01a83abecbd', 'f0e458ed-0a9e-521c-b582-912d913ffea5', 'A2', 4),
  ('e90e5180-1e07-5f4d-8cf8-ffa977145c25', 'f0e458ed-0a9e-521c-b582-912d913ffea5', 'A3', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('30f6f0d2-085b-5982-aac2-9b5e57cd7716', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'โซนนั่งชิล', 18, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('83343259-a587-5ffa-a20d-5a5737c82363', '30f6f0d2-085b-5982-aac2-9b5e57cd7716', 'B1', 6),
  ('5ebdceb8-ab79-573c-bc7c-8469a54baca3', '30f6f0d2-085b-5982-aac2-9b5e57cd7716', 'B2', 6),
  ('e7bbd242-0488-587d-8d18-f53187bcc3cb', '30f6f0d2-085b-5982-aac2-9b5e57cd7716', 'B3', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('ccd6db1b-2095-5c6d-94cd-9329510f8b5e', 'ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('876c3794-11e2-50ac-8333-0054998f49aa', 'ccd6db1b-2095-5c6d-94cd-9329510f8b5e', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'SECURITY', 'YES', 'SELF_DECLARED', null),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'FIRE_EXIT', 'YES', 'SELF_DECLARED', null),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'FIRST_AID', 'YES', 'ADMIN_VERIFIED', now()),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'ID_CHECK', 'NO', 'ADMIN_VERIFIED', now()),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'PARKING_RIDE', 'YES', 'SELF_DECLARED', null),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'FEMALE_STAFF', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'LIGHTING', 'YES', 'ADMIN_VERIFIED', now()),
  ('ca9df1a8-3a56-5dc6-849e-ea71be97f004', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());

-- Lantern Lane (bar-6)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', null, 'lantern-lane', 'Lantern Lane', 'RESTAURANT', 'Lantern Lane · ร้านอาหารมีเครื่องดื่ม ย่านรัชดา บรรยากาศ Food-focused · Quiet · Private Room เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '135 ซอยสมมติ 6 เขตรัชดา กรุงเทพฯ',
  (select id from districts where name_th = 'รัชดา'), 13.760789, 100.568940,
  null, 'linear-gradient(135deg,#2E1065 0%,#A738F5 55%,#E8B64C 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 60
where bar_id = '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4';
update bar_stats set avg_price_per_person = 940, safety_score = 78, score = 61,
  current_stars = 3, current_tier = 'B', is_new = false,
  rating_avg = 3.5, rating_count = 1027, is_editor_pick = false
where bar_id = '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 0, '18:00', '02:00', false),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 1, '18:00', '02:00', false),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 2, '18:00', '02:00', false),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 3, '18:00', '02:00', false),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 4, '18:00', '02:00', false),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 5, '18:00', '02:00', false),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', id from styles where key in ('FOOD_FOCUSED', 'QUIET', 'PRIVATE_ROOM');
insert into bar_links (bar_id, type, url, sort_order) values
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'INSTAGRAM', 'https://instagram.com/lanternlane', 0),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'TIKTOK', 'https://tiktok.com/@lanternlane', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('29655d2c-bc20-5690-bf1d-f1da2fa14ff3', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'เครื่องดื่ม', 0),
  ('88b681ca-bec9-5614-912a-5e7cc3d601ad', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'มิกเซอร์', 1),
  ('d3525359-a2d2-59b7-b463-83b82e706c96', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'อาหาร', 2),
  ('2deb0297-0b8f-5886-a839-08443101b33f', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('48b825db-bff3-548f-aaa6-b1f57bd3cdef', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '29655d2c-bc20-5690-bf1d-f1da2fa14ff3', 'เซ็ตขวด 700ml', 1420, true, 0),
  ('2d7020ae-d9b4-5a05-8edf-27bb40cc2fd5', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '29655d2c-bc20-5690-bf1d-f1da2fa14ff3', 'เซ็ตขวด 1L', 1950, true, 1),
  ('ec10e145-5ad9-5aab-9602-aeb8c2c4148b', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '29655d2c-bc20-5690-bf1d-f1da2fa14ff3', 'ทาวเวอร์ 3L', 1050, true, 2),
  ('38c7d4f1-a19c-56a7-aaa5-acb03557c36c', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '29655d2c-bc20-5690-bf1d-f1da2fa14ff3', 'ค็อกเทลประจำร้าน', 380, true, 3),
  ('cb415f5f-e625-5baa-a0f8-2121e893af68', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '88b681ca-bec9-5614-912a-5e7cc3d601ad', 'โซดา', 40, true, 4),
  ('651c57ce-74e6-5d8a-8c10-8ae0bafad666', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '88b681ca-bec9-5614-912a-5e7cc3d601ad', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('38e10812-4045-51ca-a7bc-b5b5c3eaad2a', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '88b681ca-bec9-5614-912a-5e7cc3d601ad', 'โค้ก / สไปรท์', 40, true, 6),
  ('64d62455-3b55-508a-b5f6-83d70b52c4cd', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '88b681ca-bec9-5614-912a-5e7cc3d601ad', 'น้ำเปล่า', 30, true, 7),
  ('97c46ec3-43b0-58e1-8eed-7d0d90231fde', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'd3525359-a2d2-59b7-b463-83b82e706c96', 'ยำรวมมิตร', 260, true, 8),
  ('3004c52c-b4dc-5efb-b93f-548e4b254677', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'd3525359-a2d2-59b7-b463-83b82e706c96', 'ข้าวผัดต้มยำ', 210, true, 9),
  ('0184d419-b40f-500f-8369-278464d8faae', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '2deb0297-0b8f-5886-a839-08443101b33f', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('610966b0-9a32-5bfb-819a-db392993b241', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', '2deb0297-0b8f-5886-a839-08443101b33f', 'ปีกไก่ทอดน้ำปลา', 220, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('2fd700de-b0bf-59ed-a4d2-1e4bb3deca75', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1785);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('2fd700de-b0bf-59ed-a4d2-1e4bb3deca75', '48b825db-bff3-548f-aaa6-b1f57bd3cdef', 'เซ็ตขวด 700ml', 1, 1420, 0),
  ('2fd700de-b0bf-59ed-a4d2-1e4bb3deca75', 'cb415f5f-e625-5baa-a0f8-2121e893af68', 'โซดา', 6, 40, 1),
  ('2fd700de-b0bf-59ed-a4d2-1e4bb3deca75', '651c57ce-74e6-5d8a-8c10-8ae0bafad666', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('2fd700de-b0bf-59ed-a4d2-1e4bb3deca75', '0184d419-b40f-500f-8369-278464d8faae', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('d778ddd5-85a2-5974-baf8-0201e919fa5d', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3284);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('d778ddd5-85a2-5974-baf8-0201e919fa5d', '48b825db-bff3-548f-aaa6-b1f57bd3cdef', 'เซ็ตขวด 700ml', 2, 1420, 0),
  ('d778ddd5-85a2-5974-baf8-0201e919fa5d', 'cb415f5f-e625-5baa-a0f8-2121e893af68', 'โซดา', 10, 40, 1),
  ('d778ddd5-85a2-5974-baf8-0201e919fa5d', '651c57ce-74e6-5d8a-8c10-8ae0bafad666', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('d778ddd5-85a2-5974-baf8-0201e919fa5d', '0184d419-b40f-500f-8369-278464d8faae', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('bdcc7d76-47ca-5e5c-a3dc-23323c35c095', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5069);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('bdcc7d76-47ca-5e5c-a3dc-23323c35c095', '48b825db-bff3-548f-aaa6-b1f57bd3cdef', 'เซ็ตขวด 700ml', 3, 1420, 0),
  ('bdcc7d76-47ca-5e5c-a3dc-23323c35c095', 'cb415f5f-e625-5baa-a0f8-2121e893af68', 'โซดา', 16, 40, 1),
  ('bdcc7d76-47ca-5e5c-a3dc-23323c35c095', '651c57ce-74e6-5d8a-8c10-8ae0bafad666', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('bdcc7d76-47ca-5e5c-a3dc-23323c35c095', '0184d419-b40f-500f-8369-278464d8faae', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('600cd729-1359-5716-a734-f67512162d92', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('0d283975-6f16-5046-b156-3de511b40b8f', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'มา 6 คนขึ้นไป ฟรีของทานเล่น 1 จาน', 'จองผ่าน NightOut และเช็กอินครบตามจำนวน', 'FREE_APPETIZER', '{0,1,2,3,4,5,6}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('ddc289d5-2456-512d-81a8-e9afdc48aef3', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'โซนหน้าเวที', 12, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('ae0d99f9-d4ff-5d14-87ce-3ac5d435c073', 'ddc289d5-2456-512d-81a8-e9afdc48aef3', 'A1', 4),
  ('3f3ee7df-7bf3-51d8-b6d6-e4e18cf8831b', 'ddc289d5-2456-512d-81a8-e9afdc48aef3', 'A2', 4),
  ('714a554a-3fda-56cd-a00e-f4cf76350b10', 'ddc289d5-2456-512d-81a8-e9afdc48aef3', 'A3', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('92858461-ab8c-5eb5-884a-3d81a8309492', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'โซนนั่งชิล', 18, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('f48273ff-7160-55a9-b6a9-5887b56357ea', '92858461-ab8c-5eb5-884a-3d81a8309492', 'B1', 6),
  ('f36d1577-7682-5675-acd3-4a4f0f1ed723', '92858461-ab8c-5eb5-884a-3d81a8309492', 'B2', 6),
  ('a3ec11d5-3fea-5ed3-975e-bc88a1cc911e', '92858461-ab8c-5eb5-884a-3d81a8309492', 'B3', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('063a3d55-bd40-50ed-879a-63674c1f31b4', '98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('0e11daa1-c071-57b1-ab59-386c4094baa7', '063a3d55-bd40-50ed-879a-63674c1f31b4', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'SECURITY', 'NO', 'ADMIN_VERIFIED', now()),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'CCTV', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'FIRST_AID', 'YES', 'SELF_DECLARED', null),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'ID_CHECK', 'YES', 'ADMIN_VERIFIED', now()),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'PARKING_RIDE', 'YES', 'ADMIN_VERIFIED', now()),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'FEMALE_STAFF', 'YES', 'SELF_DECLARED', null),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'LIGHTING', 'YES', 'ADMIN_VERIFIED', now()),
  ('98fd3a61-0a2d-5fea-85d3-8c305d39e6b4', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);

-- Midnight Mango (bar-7)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('2c455e74-6029-52ae-b878-4df21dfc9c16', null, 'midnight-mango', 'Midnight Mango', 'PUB_BAR', 'Midnight Mango · ผับ / บาร์ ย่านลาดพร้าว บรรยากาศ Pub/Dance · Quiet เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '142 ซอยสมมติ 7 เขตลาดพร้าว กรุงเทพฯ',
  (select id from districts where name_th = 'ลาดพร้าว'), 13.776188, 100.549598,
  null, 'linear-gradient(135deg,#0B1026 0%,#5869C8 60%,#A738F5 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 500, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 15
where bar_id = '2c455e74-6029-52ae-b878-4df21dfc9c16';
update bar_stats set avg_price_per_person = 970, safety_score = 78, score = 81,
  current_stars = 4, current_tier = 'A', is_new = false,
  rating_avg = 4.3, rating_count = 999, is_editor_pick = false
where bar_id = '2c455e74-6029-52ae-b878-4df21dfc9c16';
update bar_live_status set current_crowd = 'ALMOST_FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '2c455e74-6029-52ae-b878-4df21dfc9c16';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'MALE', 1), ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'FEMALE', 3);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 0, '18:00', '02:00', false),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 1, '18:00', '02:00', false),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 2, '18:00', '02:00', false),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 3, '18:00', '02:00', false),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 4, '18:00', '02:00', false),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 5, '18:00', '02:00', false),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '2c455e74-6029-52ae-b878-4df21dfc9c16', id from styles where key in ('PUB_DANCE', 'QUIET');
insert into bar_links (bar_id, type, url, sort_order) values
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'INSTAGRAM', 'https://instagram.com/midnightmango', 0),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'TIKTOK', 'https://tiktok.com/@midnightmango', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'VAT', 'VAT', 'PERCENTAGE', 7, 2),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'OTHER', 'ค่าบริการอื่น (ต่อโต๊ะ)', 'FIXED_PER_TABLE', 200, 3);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('a4aff91f-20d6-557e-b62a-62b4f2400801', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'เครื่องดื่ม', 0),
  ('e8d14b6e-d538-5c88-a86d-1775181da573', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'มิกเซอร์', 1),
  ('e20730bc-54ab-5bba-a9ca-cbffed22017b', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'อาหาร', 2),
  ('795611a6-2cb7-5fbd-a828-5d22ad3cdad1', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('a33299c2-c40a-5fc5-840b-3af2f91f9641', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'a4aff91f-20d6-557e-b62a-62b4f2400801', 'เซ็ตขวด 700ml', 1480, true, 0),
  ('937690e0-8c78-58c6-8189-f4ea8da105b4', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'a4aff91f-20d6-557e-b62a-62b4f2400801', 'เซ็ตขวด 1L', 2030, true, 1),
  ('abbffe57-0ea9-570d-94fe-f4baa7b4c409', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'a4aff91f-20d6-557e-b62a-62b4f2400801', 'ทาวเวอร์ 3L', 1100, true, 2),
  ('0b66b2b3-ea25-50e8-9a00-7a230bbf58b0', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'a4aff91f-20d6-557e-b62a-62b4f2400801', 'ค็อกเทลประจำร้าน', 390, true, 3),
  ('1fd81d91-ab3a-5cff-b859-ca72b4dc2583', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'e8d14b6e-d538-5c88-a86d-1775181da573', 'โซดา', 40, true, 4),
  ('5ede4a1e-0413-5ef9-b62e-b2112770a11f', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'e8d14b6e-d538-5c88-a86d-1775181da573', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('129c2698-9dc6-5801-bfda-8ee69352ae18', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'e8d14b6e-d538-5c88-a86d-1775181da573', 'โค้ก / สไปรท์', 40, true, 6),
  ('700e12bb-08c7-5f60-b565-c6031af410d1', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'e8d14b6e-d538-5c88-a86d-1775181da573', 'น้ำเปล่า', 30, true, 7),
  ('f7055e9c-656c-5246-ad37-eb0ac81ade44', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'e20730bc-54ab-5bba-a9ca-cbffed22017b', 'ยำรวมมิตร', 270, true, 8),
  ('ffb8579e-22f8-52f3-b8a2-5e5d3699da7c', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'e20730bc-54ab-5bba-a9ca-cbffed22017b', 'ข้าวผัดต้มยำ', 220, true, 9),
  ('1d755378-934f-5438-b257-63f7373fa666', '2c455e74-6029-52ae-b878-4df21dfc9c16', '795611a6-2cb7-5fbd-a828-5d22ad3cdad1', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('abee650f-cf94-5334-b977-f4c68651012d', '2c455e74-6029-52ae-b878-4df21dfc9c16', '795611a6-2cb7-5fbd-a828-5d22ad3cdad1', 'ปีกไก่ทอดน้ำปลา', 230, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('5fb0f6a4-1459-50b6-9340-844c8e26d710', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1840);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('5fb0f6a4-1459-50b6-9340-844c8e26d710', 'a33299c2-c40a-5fc5-840b-3af2f91f9641', 'เซ็ตขวด 700ml', 1, 1480, 0),
  ('5fb0f6a4-1459-50b6-9340-844c8e26d710', '1fd81d91-ab3a-5cff-b859-ca72b4dc2583', 'โซดา', 6, 40, 1),
  ('5fb0f6a4-1459-50b6-9340-844c8e26d710', '5ede4a1e-0413-5ef9-b62e-b2112770a11f', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('5fb0f6a4-1459-50b6-9340-844c8e26d710', '1d755378-934f-5438-b257-63f7373fa666', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('886849fa-f2f0-5071-a7b7-9fe332d7fc31', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3395);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('886849fa-f2f0-5071-a7b7-9fe332d7fc31', 'a33299c2-c40a-5fc5-840b-3af2f91f9641', 'เซ็ตขวด 700ml', 2, 1480, 0),
  ('886849fa-f2f0-5071-a7b7-9fe332d7fc31', '1fd81d91-ab3a-5cff-b859-ca72b4dc2583', 'โซดา', 10, 40, 1),
  ('886849fa-f2f0-5071-a7b7-9fe332d7fc31', '5ede4a1e-0413-5ef9-b62e-b2112770a11f', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('886849fa-f2f0-5071-a7b7-9fe332d7fc31', '1d755378-934f-5438-b257-63f7373fa666', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('29426d4e-3891-5468-b1aa-283fe0e6be41', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5235);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('29426d4e-3891-5468-b1aa-283fe0e6be41', 'a33299c2-c40a-5fc5-840b-3af2f91f9641', 'เซ็ตขวด 700ml', 3, 1480, 0),
  ('29426d4e-3891-5468-b1aa-283fe0e6be41', '1fd81d91-ab3a-5cff-b859-ca72b4dc2583', 'โซดา', 16, 40, 1),
  ('29426d4e-3891-5468-b1aa-283fe0e6be41', '5ede4a1e-0413-5ef9-b62e-b2112770a11f', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('29426d4e-3891-5468-b1aa-283fe0e6be41', '1d755378-934f-5438-b257-63f7373fa666', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('985ca551-3703-5531-8ac0-690349bed435', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('af8fd4ec-8edb-5f11-853e-5da2bb5040cd', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'Ladies Night พุธ', 'ค็อกเทลแก้วแรกฟรีสำหรับสุภาพสตรี ทุกวันพุธ', 'OTHER', '{3}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('c219f0e4-06c3-5fd4-bba2-da0a502a6b39', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'โซนหน้าเวที', 16, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('322e62eb-a559-57b4-8daa-0f82b7ba1c45', 'c219f0e4-06c3-5fd4-bba2-da0a502a6b39', 'A1', 4),
  ('76db6a43-3319-5561-aa26-2c15ec12801f', 'c219f0e4-06c3-5fd4-bba2-da0a502a6b39', 'A2', 4),
  ('6cc6e499-1935-55f8-958e-c1c5f46c0f7a', 'c219f0e4-06c3-5fd4-bba2-da0a502a6b39', 'A3', 4),
  ('a054da72-c4a4-5baa-b239-8d53adc24f6a', 'c219f0e4-06c3-5fd4-bba2-da0a502a6b39', 'A4', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('b8bfe008-c418-520a-93fc-a4da57ccdd1a', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'โซนนั่งชิล', 24, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('de08c119-2e8d-5e0b-94bd-8067fa3f3761', 'b8bfe008-c418-520a-93fc-a4da57ccdd1a', 'B1', 6),
  ('d565e493-4fac-5f59-af85-0966c8136fd0', 'b8bfe008-c418-520a-93fc-a4da57ccdd1a', 'B2', 6),
  ('1bac866b-d2ab-5f10-ba61-a4ab163eb11c', 'b8bfe008-c418-520a-93fc-a4da57ccdd1a', 'B3', 6),
  ('de98abcf-8fb5-578c-b91e-3173ee5a5de6', 'b8bfe008-c418-520a-93fc-a4da57ccdd1a', 'B4', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('68241e72-e773-50d6-849e-70e65bd791cb', '2c455e74-6029-52ae-b878-4df21dfc9c16', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('73bec0d7-ea5b-5103-af16-d02b64d834ee', '68241e72-e773-50d6-849e-70e65bd791cb', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'CCTV', 'NO', 'ADMIN_VERIFIED', now()),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'FIRST_AID', 'NO', 'ADMIN_VERIFIED', now()),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'ID_CHECK', 'YES', 'SELF_DECLARED', null),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'PARKING_RIDE', 'YES', 'SELF_DECLARED', null),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'FEMALE_STAFF', 'YES', 'ADMIN_VERIFIED', now()),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'LIGHTING', 'YES', 'SELF_DECLARED', null),
  ('2c455e74-6029-52ae-b878-4df21dfc9c16', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());

-- Copper Crane (bar-8)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('772f1a13-43d3-520b-9812-8e9bda5a9b07', null, 'copper-crane', 'Copper Crane', 'CHILL', 'Copper Crane · ร้านนั่งชิล ย่านริมแม่น้ำ บรรยากาศ Food-focused · Live Music เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '149 ซอยสมมติ 8 เขตริมแม่น้ำ กรุงเทพฯ',
  (select id from districts where name_th = 'ริมแม่น้ำ'), 13.720724, 100.524321,
  null, 'linear-gradient(135deg,#1A0B2E 0%,#963BE8 50%,#FFD77A 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 30
where bar_id = '772f1a13-43d3-520b-9812-8e9bda5a9b07';
update bar_stats set avg_price_per_person = 790, safety_score = 67, score = 66,
  current_stars = 3, current_tier = 'B', is_new = false,
  rating_avg = 3.7, rating_count = 1182, is_editor_pick = false
where bar_id = '772f1a13-43d3-520b-9812-8e9bda5a9b07';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '772f1a13-43d3-520b-9812-8e9bda5a9b07';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 0, '18:00', '02:00', false),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 1, '18:00', '02:00', false),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 2, '18:00', '02:00', false),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 3, '18:00', '02:00', false),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 4, '18:00', '02:00', false),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 5, '18:00', '02:00', false),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '772f1a13-43d3-520b-9812-8e9bda5a9b07', id from styles where key in ('FOOD_FOCUSED', 'LIVE_MUSIC');
insert into bar_links (bar_id, type, url, sort_order) values
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'INSTAGRAM', 'https://instagram.com/coppercrane', 0),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'TIKTOK', 'https://tiktok.com/@coppercrane', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('97b7c061-f3ee-515f-b016-627c10d17a25', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'เครื่องดื่ม', 0),
  ('fea978fd-72da-555e-8a15-ac4355a87e5e', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'มิกเซอร์', 1),
  ('59738d66-42ca-5c35-8705-2bd980d2feb8', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'อาหาร', 2),
  ('3796457b-f19a-52a6-999c-283b29bd2af5', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('c207072c-a735-5679-aca1-3eca8ea8bef5', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '97b7c061-f3ee-515f-b016-627c10d17a25', 'เซ็ตขวด 700ml', 1220, true, 0),
  ('da3be993-f21c-5e28-a81f-ba6800274d2f', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '97b7c061-f3ee-515f-b016-627c10d17a25', 'เซ็ตขวด 1L', 1680, true, 1),
  ('10157bc7-77f4-5367-ab89-1ba1f7022aec', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '97b7c061-f3ee-515f-b016-627c10d17a25', 'ทาวเวอร์ 3L', 910, true, 2),
  ('9f15c6d5-0931-588e-a438-9fd984f5a745', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '97b7c061-f3ee-515f-b016-627c10d17a25', 'ค็อกเทลประจำร้าน', 330, true, 3),
  ('34849335-be1c-5d40-ae38-157aa7295bda', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'fea978fd-72da-555e-8a15-ac4355a87e5e', 'โซดา', 30, true, 4),
  ('119b21f0-48f0-5da8-9cc3-cef9f39cdf7b', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'fea978fd-72da-555e-8a15-ac4355a87e5e', 'น้ำแข็ง (ถัง)', 40, true, 5),
  ('957b6a6d-5acb-5e1a-bf02-b0bdfff8f972', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'fea978fd-72da-555e-8a15-ac4355a87e5e', 'โค้ก / สไปรท์', 40, true, 6),
  ('abe1c3d0-e3c9-5d0e-a4c6-6663623392a2', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'fea978fd-72da-555e-8a15-ac4355a87e5e', 'น้ำเปล่า', 30, true, 7),
  ('8fefb42b-a95e-5848-99f7-f1097bb26f6e', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '59738d66-42ca-5c35-8705-2bd980d2feb8', 'ยำรวมมิตร', 220, true, 8),
  ('a5abec73-a04a-5363-a407-8658fe7a9f2b', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '59738d66-42ca-5c35-8705-2bd980d2feb8', 'ข้าวผัดต้มยำ', 180, true, 9),
  ('175f35cb-e601-5c25-bebb-010e0cc2f15b', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '3796457b-f19a-52a6-999c-283b29bd2af5', 'เฟรนช์ฟรายส์', 150, true, 10),
  ('3b320c8a-ebc9-5a77-9d58-7a8c9473dd0d', '772f1a13-43d3-520b-9812-8e9bda5a9b07', '3796457b-f19a-52a6-999c-283b29bd2af5', 'ปีกไก่ทอดน้ำปลา', 190, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('d27a09e4-81d7-5091-9444-6a19210fec52', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1500);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('d27a09e4-81d7-5091-9444-6a19210fec52', 'c207072c-a735-5679-aca1-3eca8ea8bef5', 'เซ็ตขวด 700ml', 1, 1220, 0),
  ('d27a09e4-81d7-5091-9444-6a19210fec52', '34849335-be1c-5d40-ae38-157aa7295bda', 'โซดา', 6, 30, 1),
  ('d27a09e4-81d7-5091-9444-6a19210fec52', '119b21f0-48f0-5da8-9cc3-cef9f39cdf7b', 'น้ำแข็ง (ถัง)', 2, 40, 2),
  ('d27a09e4-81d7-5091-9444-6a19210fec52', '175f35cb-e601-5c25-bebb-010e0cc2f15b', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('b15312c6-76ed-507d-b356-030080ed659a', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2769);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('b15312c6-76ed-507d-b356-030080ed659a', 'c207072c-a735-5679-aca1-3eca8ea8bef5', 'เซ็ตขวด 700ml', 2, 1220, 0),
  ('b15312c6-76ed-507d-b356-030080ed659a', '34849335-be1c-5d40-ae38-157aa7295bda', 'โซดา', 10, 30, 1),
  ('b15312c6-76ed-507d-b356-030080ed659a', '119b21f0-48f0-5da8-9cc3-cef9f39cdf7b', 'น้ำแข็ง (ถัง)', 3, 40, 2),
  ('b15312c6-76ed-507d-b356-030080ed659a', '175f35cb-e601-5c25-bebb-010e0cc2f15b', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('784b7968-74b6-5946-841d-f0eb19ce07c8', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4269);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('784b7968-74b6-5946-841d-f0eb19ce07c8', 'c207072c-a735-5679-aca1-3eca8ea8bef5', 'เซ็ตขวด 700ml', 3, 1220, 0),
  ('784b7968-74b6-5946-841d-f0eb19ce07c8', '34849335-be1c-5d40-ae38-157aa7295bda', 'โซดา', 16, 30, 1),
  ('784b7968-74b6-5946-841d-f0eb19ce07c8', '119b21f0-48f0-5da8-9cc3-cef9f39cdf7b', 'น้ำแข็ง (ถัง)', 5, 40, 2),
  ('784b7968-74b6-5946-841d-f0eb19ce07c8', '175f35cb-e601-5c25-bebb-010e0cc2f15b', 'เฟรนช์ฟรายส์', 2, 150, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('46c6a801-7097-5c76-9c01-fe6b22d01410', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('65d0df28-3786-50b4-bd4c-23b68a2e15bd', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'โซนหน้าเวที', 20, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('c40cbde5-6987-59e5-b39a-867af43e77cf', '65d0df28-3786-50b4-bd4c-23b68a2e15bd', 'A1', 4),
  ('8bdb139f-4d96-5695-8be1-e2b881f299ee', '65d0df28-3786-50b4-bd4c-23b68a2e15bd', 'A2', 4),
  ('c9824ade-a23f-5a8f-8e6e-1da69316b352', '65d0df28-3786-50b4-bd4c-23b68a2e15bd', 'A3', 4),
  ('79f8b3ea-f7ee-5599-9eb7-9c970e8152ec', '65d0df28-3786-50b4-bd4c-23b68a2e15bd', 'A4', 4),
  ('61acd81b-f09c-5a87-af28-13a24d0471a0', '65d0df28-3786-50b4-bd4c-23b68a2e15bd', 'A5', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('40bf9b2c-432e-54a8-a798-6496feb6e99e', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'โซนนั่งชิล', 30, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('5917e8cd-9894-5261-827b-11066284b9ce', '40bf9b2c-432e-54a8-a798-6496feb6e99e', 'B1', 6),
  ('964b1549-efc9-57b6-b7de-371f012ea20e', '40bf9b2c-432e-54a8-a798-6496feb6e99e', 'B2', 6),
  ('4a4b37de-9390-5160-a3ec-d2a860a7c8b1', '40bf9b2c-432e-54a8-a798-6496feb6e99e', 'B3', 6),
  ('9c77695b-0ac6-5316-a459-e2ecb1b5ba85', '40bf9b2c-432e-54a8-a798-6496feb6e99e', 'B4', 6),
  ('f5ecc2da-ee75-59f2-8a92-51fc22e69cd6', '40bf9b2c-432e-54a8-a798-6496feb6e99e', 'B5', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('98240e47-8568-585a-9598-bc6e33aa5bbd', '772f1a13-43d3-520b-9812-8e9bda5a9b07', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('1c946f17-4435-5212-a583-2c08f8bfa35b', '98240e47-8568-585a-9598-bc6e33aa5bbd', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'FIRST_AID', 'NO', 'SELF_DECLARED', null),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'ID_CHECK', 'YES', 'SELF_DECLARED', null),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'PARKING_RIDE', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'FEMALE_STAFF', 'YES', 'ADMIN_VERIFIED', now()),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'LIGHTING', 'YES', 'ADMIN_VERIFIED', now()),
  ('772f1a13-43d3-520b-9812-8e9bda5a9b07', 'EMERGENCY_CONTACT', 'NO', 'ADMIN_VERIFIED', now());

-- Starfall Rooftop (bar-9)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('e3a93acf-3717-55d8-a6b4-76d56644db42', null, 'starfall-rooftop', 'Starfall Rooftop', 'RESTAURANT', 'Starfall Rooftop · ร้านอาหารมีเครื่องดื่ม ย่านพระราม 9 บรรยากาศ Food-focused · Chill เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '156 ซอยสมมติ 9 เขตพระราม 9 กรุงเทพฯ',
  (select id from districts where name_th = 'พระราม 9'), 13.774140, 100.589176,
  null, 'linear-gradient(135deg,#07070D 0%,#34283F 40%,#E8B64C 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 60
where bar_id = 'e3a93acf-3717-55d8-a6b4-76d56644db42';
update bar_stats set avg_price_per_person = 930, safety_score = 67, score = 92,
  current_stars = 5, current_tier = 'S', is_new = false,
  rating_avg = 4.7, rating_count = 466, is_editor_pick = false
where bar_id = 'e3a93acf-3717-55d8-a6b4-76d56644db42';
update bar_live_status set current_crowd = 'ALMOST_FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = 'e3a93acf-3717-55d8-a6b4-76d56644db42';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 0, '18:00', '02:00', false),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 1, '18:00', '02:00', true),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 2, '18:00', '02:00', false),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 3, '18:00', '02:00', false),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 4, '18:00', '02:00', false),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 5, '18:00', '02:00', false),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select 'e3a93acf-3717-55d8-a6b4-76d56644db42', id from styles where key in ('FOOD_FOCUSED', 'CHILL');
insert into bar_links (bar_id, type, url, sort_order) values
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'INSTAGRAM', 'https://instagram.com/starfallrooftop', 0),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'TIKTOK', 'https://tiktok.com/@starfallrooftop', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('b3ed2968-e2bb-5ebd-aa24-81bad414cba6', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'เครื่องดื่ม', 0),
  ('1acdd6f3-a1fd-5cfc-a607-7506ba90c6dd', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'มิกเซอร์', 1),
  ('8432504b-396e-5bf6-856b-109a6529352c', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'อาหาร', 2),
  ('be2e2d16-bf10-575a-8e76-5d2c3f0a036d', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('64341ced-2230-5e69-8b99-99375cac4ec1', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'b3ed2968-e2bb-5ebd-aa24-81bad414cba6', 'เซ็ตขวด 700ml', 1410, true, 0),
  ('0cd73314-6289-5cc2-b497-d5e192a39cbc', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'b3ed2968-e2bb-5ebd-aa24-81bad414cba6', 'เซ็ตขวด 1L', 1940, true, 1),
  ('49c12add-9ed6-596c-8705-0493bf826bac', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'b3ed2968-e2bb-5ebd-aa24-81bad414cba6', 'ทาวเวอร์ 3L', 1050, true, 2),
  ('adef295a-32a8-5d9d-abd0-26b4b476655d', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'b3ed2968-e2bb-5ebd-aa24-81bad414cba6', 'ค็อกเทลประจำร้าน', 380, true, 3),
  ('82c577d3-5ab3-5cfe-9eb4-9a6e54134470', 'e3a93acf-3717-55d8-a6b4-76d56644db42', '1acdd6f3-a1fd-5cfc-a607-7506ba90c6dd', 'โซดา', 40, true, 4),
  ('ee893404-a03d-5eda-babc-b8aee5d66642', 'e3a93acf-3717-55d8-a6b4-76d56644db42', '1acdd6f3-a1fd-5cfc-a607-7506ba90c6dd', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('eec8ced4-bd42-5053-a19e-1cfc83b1c9df', 'e3a93acf-3717-55d8-a6b4-76d56644db42', '1acdd6f3-a1fd-5cfc-a607-7506ba90c6dd', 'โค้ก / สไปรท์', 40, true, 6),
  ('def1ba26-3b1e-5cb3-9da6-7756e7a53974', 'e3a93acf-3717-55d8-a6b4-76d56644db42', '1acdd6f3-a1fd-5cfc-a607-7506ba90c6dd', 'น้ำเปล่า', 30, true, 7),
  ('c90f0584-f381-5b03-959f-131eb111937a', 'e3a93acf-3717-55d8-a6b4-76d56644db42', '8432504b-396e-5bf6-856b-109a6529352c', 'ยำรวมมิตร', 260, true, 8),
  ('fa8c810a-ed84-5936-aa1a-0b7d6c123f58', 'e3a93acf-3717-55d8-a6b4-76d56644db42', '8432504b-396e-5bf6-856b-109a6529352c', 'ข้าวผัดต้มยำ', 210, true, 9),
  ('6e3c636a-a50d-5fd1-b3be-f5b8948440a8', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'be2e2d16-bf10-575a-8e76-5d2c3f0a036d', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('fd198d77-ba80-54de-b644-5054d9d7fd28', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'be2e2d16-bf10-575a-8e76-5d2c3f0a036d', 'ปีกไก่ทอดน้ำปลา', 220, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('ab99edc5-05a6-52b8-9f21-2dfc9e020b39', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1776);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('ab99edc5-05a6-52b8-9f21-2dfc9e020b39', '64341ced-2230-5e69-8b99-99375cac4ec1', 'เซ็ตขวด 700ml', 1, 1410, 0),
  ('ab99edc5-05a6-52b8-9f21-2dfc9e020b39', '82c577d3-5ab3-5cfe-9eb4-9a6e54134470', 'โซดา', 6, 40, 1),
  ('ab99edc5-05a6-52b8-9f21-2dfc9e020b39', 'ee893404-a03d-5eda-babc-b8aee5d66642', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('ab99edc5-05a6-52b8-9f21-2dfc9e020b39', '6e3c636a-a50d-5fd1-b3be-f5b8948440a8', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('9ec5ac9a-4f5b-5ffe-97c4-70f547b9efc7', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3266);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('9ec5ac9a-4f5b-5ffe-97c4-70f547b9efc7', '64341ced-2230-5e69-8b99-99375cac4ec1', 'เซ็ตขวด 700ml', 2, 1410, 0),
  ('9ec5ac9a-4f5b-5ffe-97c4-70f547b9efc7', '82c577d3-5ab3-5cfe-9eb4-9a6e54134470', 'โซดา', 10, 40, 1),
  ('9ec5ac9a-4f5b-5ffe-97c4-70f547b9efc7', 'ee893404-a03d-5eda-babc-b8aee5d66642', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('9ec5ac9a-4f5b-5ffe-97c4-70f547b9efc7', '6e3c636a-a50d-5fd1-b3be-f5b8948440a8', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('0c9e8314-39f8-56d5-a334-948b20b4b08b', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5042);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('0c9e8314-39f8-56d5-a334-948b20b4b08b', '64341ced-2230-5e69-8b99-99375cac4ec1', 'เซ็ตขวด 700ml', 3, 1410, 0),
  ('0c9e8314-39f8-56d5-a334-948b20b4b08b', '82c577d3-5ab3-5cfe-9eb4-9a6e54134470', 'โซดา', 16, 40, 1),
  ('0c9e8314-39f8-56d5-a334-948b20b4b08b', 'ee893404-a03d-5eda-babc-b8aee5d66642', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('0c9e8314-39f8-56d5-a334-948b20b4b08b', '6e3c636a-a50d-5fd1-b3be-f5b8948440a8', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('d42e7f04-3d56-5e38-82e2-4c0ee4c338f1', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('4e9edcf5-6810-5309-9d77-609d22012ac9', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'โซนหน้าเวที', 20, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('b7452968-8d53-58db-8973-c2b654c781a6', '4e9edcf5-6810-5309-9d77-609d22012ac9', 'A1', 4),
  ('06b388a5-fbdd-53cf-b8b5-b61f13b4bed9', '4e9edcf5-6810-5309-9d77-609d22012ac9', 'A2', 4),
  ('f3dc3cbd-04de-5fb6-a461-c39035040679', '4e9edcf5-6810-5309-9d77-609d22012ac9', 'A3', 4),
  ('7ad5f2d6-883e-5323-9823-a88c5740ef0d', '4e9edcf5-6810-5309-9d77-609d22012ac9', 'A4', 4),
  ('0a82acf9-5cd2-5bf2-8bac-dbe690637c5d', '4e9edcf5-6810-5309-9d77-609d22012ac9', 'A5', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('a44ea17c-7454-5c04-ab1d-987266d7fe1c', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'โซนนั่งชิล', 30, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('15e05c86-1c7f-5cff-89ab-ed05511065d2', 'a44ea17c-7454-5c04-ab1d-987266d7fe1c', 'B1', 6),
  ('1bd745cc-e327-5077-9c62-a5a1e8ea1a42', 'a44ea17c-7454-5c04-ab1d-987266d7fe1c', 'B2', 6),
  ('7991c4df-0c70-5587-9d7b-608a6f095d4d', 'a44ea17c-7454-5c04-ab1d-987266d7fe1c', 'B3', 6),
  ('2e78f522-0df9-5d71-9e1b-9ee047c761ff', 'a44ea17c-7454-5c04-ab1d-987266d7fe1c', 'B4', 6),
  ('81600beb-3c27-551e-a9d2-02b2ea9f818f', 'a44ea17c-7454-5c04-ab1d-987266d7fe1c', 'B5', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('f7aa305b-f9b4-5fef-b22d-42b77ee56e42', 'e3a93acf-3717-55d8-a6b4-76d56644db42', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('82ff0528-59fc-55c0-b9a3-ac61c0ec64bb', 'f7aa305b-f9b4-5fef-b22d-42b77ee56e42', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'SECURITY', 'NO', 'ADMIN_VERIFIED', now()),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'CCTV', 'YES', 'SELF_DECLARED', null),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'FIRE_EXIT', 'YES', 'SELF_DECLARED', null),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'FIRST_AID', 'YES', 'ADMIN_VERIFIED', now()),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'ID_CHECK', 'NO', 'SELF_DECLARED', null),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'PARKING_RIDE', 'YES', 'SELF_DECLARED', null),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'FEMALE_STAFF', 'YES', 'ADMIN_VERIFIED', now()),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'LIGHTING', 'NO', 'ADMIN_VERIFIED', now()),
  ('e3a93acf-3717-55d8-a6b4-76d56644db42', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);
insert into promoted_listings (bar_id, package_id, placement, price_paid, starts_at, ends_at, status, approved_at)
select 'e3a93acf-3717-55d8-a6b4-76d56644db42', id, placement, price, now() - interval '1 day', now() + interval '30 days', 'ACTIVE', now()
from promotion_packages where placement = 'HOME_RECOMMENDED' and duration_days = 7 limit 1;

-- Jazz Hideaway (bar-10)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('072a70ba-33a2-567f-b2c4-013b61da514f', null, 'jazz-hideaway', 'Jazz Hideaway', 'PUB_BAR', 'Jazz Hideaway · ผับ / บาร์ ย่านสุขุมวิท บรรยากาศ Pub/Dance · Private Room เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '163 ซอยสมมติ 10 เขตสุขุมวิท กรุงเทพฯ',
  (select id from districts where name_th = 'สุขุมวิท'), 13.730940, 100.542767,
  null, 'linear-gradient(135deg,#140A1F 0%,#7E22CE 60%,#F5C85E 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 500, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 15
where bar_id = '072a70ba-33a2-567f-b2c4-013b61da514f';
update bar_stats set avg_price_per_person = 960, safety_score = 44, score = 90,
  current_stars = 5, current_tier = 'S', is_new = false,
  rating_avg = 4.6, rating_count = 188, is_editor_pick = true
where bar_id = '072a70ba-33a2-567f-b2c4-013b61da514f';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '072a70ba-33a2-567f-b2c4-013b61da514f';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('072a70ba-33a2-567f-b2c4-013b61da514f', 'MALE', 2), ('072a70ba-33a2-567f-b2c4-013b61da514f', 'FEMALE', 3);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 0, '18:00', '02:00', false),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 1, '18:00', '02:00', false),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 2, '18:00', '02:00', false),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 3, '18:00', '02:00', false),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 4, '18:00', '02:00', false),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 5, '18:00', '02:00', false),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '072a70ba-33a2-567f-b2c4-013b61da514f', id from styles where key in ('PUB_DANCE', 'PRIVATE_ROOM');
insert into bar_links (bar_id, type, url, sort_order) values
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'INSTAGRAM', 'https://instagram.com/jazzhideaway', 0),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'TIKTOK', 'https://tiktok.com/@jazzhideaway', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'VAT', 'VAT', 'PERCENTAGE', 7, 2),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'OTHER', 'ค่าบริการอื่น (ต่อโต๊ะ)', 'FIXED_PER_TABLE', 200, 3);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('88c68619-c4d3-5319-b08f-648dd8aad2fb', '072a70ba-33a2-567f-b2c4-013b61da514f', 'เครื่องดื่ม', 0),
  ('cbd94e44-4366-5326-afd7-72a247e7b569', '072a70ba-33a2-567f-b2c4-013b61da514f', 'มิกเซอร์', 1),
  ('1deab6a0-cf2b-56f1-888a-b2d2611fc8d9', '072a70ba-33a2-567f-b2c4-013b61da514f', 'อาหาร', 2),
  ('2007b94a-dac2-5048-85b6-0cf559f30a67', '072a70ba-33a2-567f-b2c4-013b61da514f', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('cd7d7fce-120e-5bdb-83e0-559b5360ba61', '072a70ba-33a2-567f-b2c4-013b61da514f', '88c68619-c4d3-5319-b08f-648dd8aad2fb', 'เซ็ตขวด 700ml', 1460, true, 0),
  ('50bae484-3bbb-5a87-9fea-042c0074b7c7', '072a70ba-33a2-567f-b2c4-013b61da514f', '88c68619-c4d3-5319-b08f-648dd8aad2fb', 'เซ็ตขวด 1L', 2010, true, 1),
  ('4d9cecab-9967-5c56-a3b5-e200307bb340', '072a70ba-33a2-567f-b2c4-013b61da514f', '88c68619-c4d3-5319-b08f-648dd8aad2fb', 'ทาวเวอร์ 3L', 1080, true, 2),
  ('dce628c8-585b-59f5-bc5f-fdf8fc87f88f', '072a70ba-33a2-567f-b2c4-013b61da514f', '88c68619-c4d3-5319-b08f-648dd8aad2fb', 'ค็อกเทลประจำร้าน', 390, true, 3),
  ('203a02a8-ae29-5474-80c3-b2f03d1f4fb1', '072a70ba-33a2-567f-b2c4-013b61da514f', 'cbd94e44-4366-5326-afd7-72a247e7b569', 'โซดา', 40, true, 4),
  ('514dce7e-4f87-5632-82fc-acc6d8a54a41', '072a70ba-33a2-567f-b2c4-013b61da514f', 'cbd94e44-4366-5326-afd7-72a247e7b569', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('a37715c2-4ae2-5fe6-b70c-01598ac23d28', '072a70ba-33a2-567f-b2c4-013b61da514f', 'cbd94e44-4366-5326-afd7-72a247e7b569', 'โค้ก / สไปรท์', 40, true, 6),
  ('0069f35b-74b7-5805-86e5-0d46f24e3910', '072a70ba-33a2-567f-b2c4-013b61da514f', 'cbd94e44-4366-5326-afd7-72a247e7b569', 'น้ำเปล่า', 30, true, 7),
  ('7e47c706-a407-56ff-8ffb-ce05b34723e0', '072a70ba-33a2-567f-b2c4-013b61da514f', '1deab6a0-cf2b-56f1-888a-b2d2611fc8d9', 'ยำรวมมิตร', 270, true, 8),
  ('2401766d-e779-5150-9364-6561ec02e4ab', '072a70ba-33a2-567f-b2c4-013b61da514f', '1deab6a0-cf2b-56f1-888a-b2d2611fc8d9', 'ข้าวผัดต้มยำ', 220, true, 9),
  ('f9d6a3eb-1784-5290-b52f-3fac9a4b603e', '072a70ba-33a2-567f-b2c4-013b61da514f', '2007b94a-dac2-5048-85b6-0cf559f30a67', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('df7f8e95-40a8-5d75-a7a2-0e03d62d0af6', '072a70ba-33a2-567f-b2c4-013b61da514f', '2007b94a-dac2-5048-85b6-0cf559f30a67', 'ปีกไก่ทอดน้ำปลา', 230, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('a5b80cdf-2bb4-52ec-ae0d-f44a31293b41', '072a70ba-33a2-567f-b2c4-013b61da514f', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1822);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('a5b80cdf-2bb4-52ec-ae0d-f44a31293b41', 'cd7d7fce-120e-5bdb-83e0-559b5360ba61', 'เซ็ตขวด 700ml', 1, 1460, 0),
  ('a5b80cdf-2bb4-52ec-ae0d-f44a31293b41', '203a02a8-ae29-5474-80c3-b2f03d1f4fb1', 'โซดา', 6, 40, 1),
  ('a5b80cdf-2bb4-52ec-ae0d-f44a31293b41', '514dce7e-4f87-5632-82fc-acc6d8a54a41', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('a5b80cdf-2bb4-52ec-ae0d-f44a31293b41', 'f9d6a3eb-1784-5290-b52f-3fac9a4b603e', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('f2a4d145-7eac-5ab5-a129-4bfc83c1bbd5', '072a70ba-33a2-567f-b2c4-013b61da514f', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3358);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('f2a4d145-7eac-5ab5-a129-4bfc83c1bbd5', 'cd7d7fce-120e-5bdb-83e0-559b5360ba61', 'เซ็ตขวด 700ml', 2, 1460, 0),
  ('f2a4d145-7eac-5ab5-a129-4bfc83c1bbd5', '203a02a8-ae29-5474-80c3-b2f03d1f4fb1', 'โซดา', 10, 40, 1),
  ('f2a4d145-7eac-5ab5-a129-4bfc83c1bbd5', '514dce7e-4f87-5632-82fc-acc6d8a54a41', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('f2a4d145-7eac-5ab5-a129-4bfc83c1bbd5', 'f9d6a3eb-1784-5290-b52f-3fac9a4b603e', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('1ae87b60-896f-5b93-98dd-338b0b7e1f8b', '072a70ba-33a2-567f-b2c4-013b61da514f', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5180);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('1ae87b60-896f-5b93-98dd-338b0b7e1f8b', 'cd7d7fce-120e-5bdb-83e0-559b5360ba61', 'เซ็ตขวด 700ml', 3, 1460, 0),
  ('1ae87b60-896f-5b93-98dd-338b0b7e1f8b', '203a02a8-ae29-5474-80c3-b2f03d1f4fb1', 'โซดา', 16, 40, 1),
  ('1ae87b60-896f-5b93-98dd-338b0b7e1f8b', '514dce7e-4f87-5632-82fc-acc6d8a54a41', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('1ae87b60-896f-5b93-98dd-338b0b7e1f8b', 'f9d6a3eb-1784-5290-b52f-3fac9a4b603e', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('e191f610-d1d4-5468-a305-0d329a189f38', '072a70ba-33a2-567f-b2c4-013b61da514f', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('1cda097e-f89c-5421-b645-f7b54d02350b', '072a70ba-33a2-567f-b2c4-013b61da514f', 'Ladies Night พุธ', 'ค็อกเทลแก้วแรกฟรีสำหรับสุภาพสตรี ทุกวันพุธ', 'OTHER', '{3}', null, 'APPROVED', true, 1),
  ('9c8b205d-0150-58b7-a277-de02eb6dd982', '072a70ba-33a2-567f-b2c4-013b61da514f', 'มา 6 คนขึ้นไป ฟรีของทานเล่น 1 จาน', 'จองผ่าน NightOut และเช็กอินครบตามจำนวน', 'FREE_APPETIZER', '{0,1,2,3,4,5,6}', null, 'APPROVED', true, 2);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('660e45bc-ffee-5614-88b7-653b7bd80ed0', '072a70ba-33a2-567f-b2c4-013b61da514f', 'โซนหน้าเวที', 12, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('ed40ba64-3847-5e3f-9231-c31ef789ad0e', '660e45bc-ffee-5614-88b7-653b7bd80ed0', 'A1', 4),
  ('682bffbd-ddfc-527a-9893-f1dbbc381dbc', '660e45bc-ffee-5614-88b7-653b7bd80ed0', 'A2', 4),
  ('8a3cfb11-6130-5ee6-a568-67c4a9169beb', '660e45bc-ffee-5614-88b7-653b7bd80ed0', 'A3', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('a3a9c233-2853-56e9-bd38-db44352ec6bd', '072a70ba-33a2-567f-b2c4-013b61da514f', 'โซนนั่งชิล', 18, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('6754c373-1ec0-539a-9388-bff5324571ba', 'a3a9c233-2853-56e9-bd38-db44352ec6bd', 'B1', 6),
  ('9fe74627-50b9-5b76-b93f-8e0faa156a45', 'a3a9c233-2853-56e9-bd38-db44352ec6bd', 'B2', 6),
  ('a16bc4a5-03f8-533c-be1f-4348c32fb855', 'a3a9c233-2853-56e9-bd38-db44352ec6bd', 'B3', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('d7d35ca3-e6e2-5d6c-8928-aabb809c5980', '072a70ba-33a2-567f-b2c4-013b61da514f', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('8eda5b30-8b5e-54e8-8bd9-dd23763da063', 'd7d35ca3-e6e2-5d6c-8928-aabb809c5980', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'CCTV', 'NO', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'FIRE_EXIT', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'FIRST_AID', 'YES', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'ID_CHECK', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'PARKING_RIDE', 'NO', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'FEMALE_STAFF', 'YES', 'SELF_DECLARED', null),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'LIGHTING', 'UNKNOWN', 'ADMIN_VERIFIED', now()),
  ('072a70ba-33a2-567f-b2c4-013b61da514f', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());
insert into editor_picks (bar_id, note) values ('072a70ba-33a2-567f-b2c4-013b61da514f', 'คัดเลือกโดยทีม NightOut');

-- Riverside Dram (bar-11)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('287feeb2-dd55-5c27-9ba4-9909a6e80247', null, 'riverside-dram', 'Riverside Dram', 'CHILL', 'Riverside Dram · ร้านนั่งชิล ย่านทองหล่อ บรรยากาศ Quiet · Food-focused เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '170 ซอยสมมติ 11 เขตทองหล่อ กรุงเทพฯ',
  (select id from districts where name_th = 'ทองหล่อ'), 13.811506, 100.541207,
  null, 'linear-gradient(135deg,#2E1065 0%,#A738F5 55%,#E8B64C 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 30
where bar_id = '287feeb2-dd55-5c27-9ba4-9909a6e80247';
update bar_stats set avg_price_per_person = 760, safety_score = 78, score = 70,
  current_stars = 3, current_tier = 'B', is_new = false,
  rating_avg = 3.9, rating_count = 684, is_editor_pick = false
where bar_id = '287feeb2-dd55-5c27-9ba4-9909a6e80247';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '287feeb2-dd55-5c27-9ba4-9909a6e80247';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'FEMALE', 3);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 0, '18:00', '02:00', false),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 1, '18:00', '02:00', false),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 2, '18:00', '02:00', false),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 3, '18:00', '02:00', false),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 4, '18:00', '02:00', false),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 5, '18:00', '02:00', false),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '287feeb2-dd55-5c27-9ba4-9909a6e80247', id from styles where key in ('QUIET', 'FOOD_FOCUSED');
insert into bar_links (bar_id, type, url, sort_order) values
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'INSTAGRAM', 'https://instagram.com/riversidedram', 0),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'TIKTOK', 'https://tiktok.com/@riversidedram', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('bd85ab92-a576-5f82-858d-aaf9296d36c8', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'เครื่องดื่ม', 0),
  ('d6981225-b824-5a25-8ce7-6aab7a16bfb7', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'มิกเซอร์', 1),
  ('2886508b-3a5b-5e48-8996-4e3881c6b389', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'อาหาร', 2),
  ('85c586dc-1aca-5061-b3f0-300fc2477dbd', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('e2c15add-36a1-58b9-9892-4d1dc4b9f2c8', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'bd85ab92-a576-5f82-858d-aaf9296d36c8', 'เซ็ตขวด 700ml', 1160, true, 0),
  ('c3518bfa-76c6-5ddd-b452-17b11e8cb38f', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'bd85ab92-a576-5f82-858d-aaf9296d36c8', 'เซ็ตขวด 1L', 1600, true, 1),
  ('7af275eb-a057-53bb-bc68-4cba5ec6b73e', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'bd85ab92-a576-5f82-858d-aaf9296d36c8', 'ทาวเวอร์ 3L', 860, true, 2),
  ('99733624-d548-5ca6-bfe7-f90d2b28b1ba', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'bd85ab92-a576-5f82-858d-aaf9296d36c8', 'ค็อกเทลประจำร้าน', 310, true, 3),
  ('b6d24a05-ae7b-5464-888d-a06df5314c68', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'd6981225-b824-5a25-8ce7-6aab7a16bfb7', 'โซดา', 30, true, 4),
  ('a0a73f3d-df33-590d-b72e-1344aaf2c56b', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'd6981225-b824-5a25-8ce7-6aab7a16bfb7', 'น้ำแข็ง (ถัง)', 40, true, 5),
  ('f24deb2a-1e30-57da-b37e-495806e06133', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'd6981225-b824-5a25-8ce7-6aab7a16bfb7', 'โค้ก / สไปรท์', 30, true, 6),
  ('19460336-7fa2-5c97-8ec4-ed57e456ad86', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'd6981225-b824-5a25-8ce7-6aab7a16bfb7', 'น้ำเปล่า', 20, true, 7),
  ('a52f4586-c1e2-5d4f-97fb-cef408f4c918', '287feeb2-dd55-5c27-9ba4-9909a6e80247', '2886508b-3a5b-5e48-8996-4e3881c6b389', 'ยำรวมมิตร', 210, true, 8),
  ('c7a64636-ce2f-5aa7-8d93-ea2df2c3ffb2', '287feeb2-dd55-5c27-9ba4-9909a6e80247', '2886508b-3a5b-5e48-8996-4e3881c6b389', 'ข้าวผัดต้มยำ', 170, true, 9),
  ('544a6f93-ccce-5737-8359-268ff516a5e1', '287feeb2-dd55-5c27-9ba4-9909a6e80247', '85c586dc-1aca-5061-b3f0-300fc2477dbd', 'เฟรนช์ฟรายส์', 150, true, 10),
  ('4664ed16-1c6d-58a4-88be-34e665382cca', '287feeb2-dd55-5c27-9ba4-9909a6e80247', '85c586dc-1aca-5061-b3f0-300fc2477dbd', 'ปีกไก่ทอดน้ำปลา', 180, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('c395d872-5ee9-5011-bf9b-58eafe9e0c72', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1444);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('c395d872-5ee9-5011-bf9b-58eafe9e0c72', 'e2c15add-36a1-58b9-9892-4d1dc4b9f2c8', 'เซ็ตขวด 700ml', 1, 1160, 0),
  ('c395d872-5ee9-5011-bf9b-58eafe9e0c72', 'b6d24a05-ae7b-5464-888d-a06df5314c68', 'โซดา', 6, 30, 1),
  ('c395d872-5ee9-5011-bf9b-58eafe9e0c72', 'a0a73f3d-df33-590d-b72e-1344aaf2c56b', 'น้ำแข็ง (ถัง)', 2, 40, 2),
  ('c395d872-5ee9-5011-bf9b-58eafe9e0c72', '544a6f93-ccce-5737-8359-268ff516a5e1', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('ed1421cd-dc52-518e-99ee-4c012ba3d2bd', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2659);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('ed1421cd-dc52-518e-99ee-4c012ba3d2bd', 'e2c15add-36a1-58b9-9892-4d1dc4b9f2c8', 'เซ็ตขวด 700ml', 2, 1160, 0),
  ('ed1421cd-dc52-518e-99ee-4c012ba3d2bd', 'b6d24a05-ae7b-5464-888d-a06df5314c68', 'โซดา', 10, 30, 1),
  ('ed1421cd-dc52-518e-99ee-4c012ba3d2bd', 'a0a73f3d-df33-590d-b72e-1344aaf2c56b', 'น้ำแข็ง (ถัง)', 3, 40, 2),
  ('ed1421cd-dc52-518e-99ee-4c012ba3d2bd', '544a6f93-ccce-5737-8359-268ff516a5e1', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('86a37ad8-1c84-527c-add5-f0cc22b72dd3', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4103);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('86a37ad8-1c84-527c-add5-f0cc22b72dd3', 'e2c15add-36a1-58b9-9892-4d1dc4b9f2c8', 'เซ็ตขวด 700ml', 3, 1160, 0),
  ('86a37ad8-1c84-527c-add5-f0cc22b72dd3', 'b6d24a05-ae7b-5464-888d-a06df5314c68', 'โซดา', 16, 30, 1),
  ('86a37ad8-1c84-527c-add5-f0cc22b72dd3', 'a0a73f3d-df33-590d-b72e-1344aaf2c56b', 'น้ำแข็ง (ถัง)', 5, 40, 2),
  ('86a37ad8-1c84-527c-add5-f0cc22b72dd3', '544a6f93-ccce-5737-8359-268ff516a5e1', 'เฟรนช์ฟรายส์', 2, 150, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('a95fd8b9-3fa0-5f86-a9e6-7d4be04e77c4', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('4dd68c4d-ad4c-59fa-afeb-89722dc44bc2', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'โซนหน้าเวที', 12, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('72cd0a60-1a7a-55cf-b518-dd84fe15f668', '4dd68c4d-ad4c-59fa-afeb-89722dc44bc2', 'A1', 4),
  ('32c99da3-43d2-5c2e-b021-b6a6e69a1c3c', '4dd68c4d-ad4c-59fa-afeb-89722dc44bc2', 'A2', 4),
  ('3a9596de-29a2-5846-b915-f76185a24ede', '4dd68c4d-ad4c-59fa-afeb-89722dc44bc2', 'A3', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('1679e5b4-b3f3-5c9c-8acf-e1259183a192', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'โซนนั่งชิล', 18, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('3a9ad0bd-556b-503d-9baa-15578f84a602', '1679e5b4-b3f3-5c9c-8acf-e1259183a192', 'B1', 6),
  ('64a3da89-e537-5435-9089-70da559b8566', '1679e5b4-b3f3-5c9c-8acf-e1259183a192', 'B2', 6),
  ('6bbda24c-346e-5b54-b5fa-1d1380f05c9e', '1679e5b4-b3f3-5c9c-8acf-e1259183a192', 'B3', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('f59cb6e2-02ec-56ce-ad0c-5e133ed87518', '287feeb2-dd55-5c27-9ba4-9909a6e80247', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('c9b03b75-8fc0-5c88-bec4-838d43053cad', 'f59cb6e2-02ec-56ce-ad0c-5e133ed87518', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'CCTV', 'UNKNOWN', 'SELF_DECLARED', null),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'FIRE_EXIT', 'YES', 'SELF_DECLARED', null),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'FIRST_AID', 'YES', 'ADMIN_VERIFIED', now()),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'ID_CHECK', 'NO', 'ADMIN_VERIFIED', now()),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'PARKING_RIDE', 'YES', 'ADMIN_VERIFIED', now()),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'FEMALE_STAFF', 'YES', 'ADMIN_VERIFIED', now()),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'LIGHTING', 'YES', 'SELF_DECLARED', null),
  ('287feeb2-dd55-5c27-9ba4-9909a6e80247', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);

-- Violet Room (bar-12)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', null, 'violet-room', 'Violet Room', 'RESTAURANT', 'Violet Room · ร้านอาหารมีเครื่องดื่ม ย่านเอกมัย บรรยากาศ Food-focused · Private Room เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '177 ซอยสมมติ 12 เขตเอกมัย กรุงเทพฯ',
  (select id from districts where name_th = 'เอกมัย'), 13.740232, 100.606475,
  null, 'linear-gradient(135deg,#0B1026 0%,#5869C8 60%,#A738F5 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 60
where bar_id = 'bf05155c-d15b-54ae-a9b3-52b5efb784e9';
update bar_stats set avg_price_per_person = 960, safety_score = 78, score = 65,
  current_stars = 3, current_tier = 'B', is_new = false,
  rating_avg = 3.7, rating_count = 925, is_editor_pick = false
where bar_id = 'bf05155c-d15b-54ae-a9b3-52b5efb784e9';
update bar_live_status set current_crowd = 'AVAILABLE', crowd_updated_at = now() - interval '20 minutes' where bar_id = 'bf05155c-d15b-54ae-a9b3-52b5efb784e9';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 0, '18:00', '02:00', false),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 1, '18:00', '02:00', false),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 2, '18:00', '02:00', false),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 3, '18:00', '02:00', false),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 4, '18:00', '02:00', false),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 5, '18:00', '02:00', false),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', id from styles where key in ('FOOD_FOCUSED', 'PRIVATE_ROOM');
insert into bar_links (bar_id, type, url, sort_order) values
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'INSTAGRAM', 'https://instagram.com/violetroom', 0),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'TIKTOK', 'https://tiktok.com/@violetroom', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('6f36909f-2b0d-5bf0-926b-e9137906bd28', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'เครื่องดื่ม', 0),
  ('1ec66651-1381-510e-ae50-8b062b2e9dcd', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'มิกเซอร์', 1),
  ('9e7dcf73-4206-5cb3-8abc-e4873eb2aca9', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'อาหาร', 2),
  ('f0da9164-cd72-52aa-8597-bc5391841e6f', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('c13a2594-2307-50b9-8673-97a44cefbd07', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '6f36909f-2b0d-5bf0-926b-e9137906bd28', 'เซ็ตขวด 700ml', 1470, true, 0),
  ('9ea981bc-fc0e-5420-b0a0-d1a6a6f071c7', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '6f36909f-2b0d-5bf0-926b-e9137906bd28', 'เซ็ตขวด 1L', 2020, true, 1),
  ('56131764-d2fd-556e-b2b0-96cfc3cbb669', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '6f36909f-2b0d-5bf0-926b-e9137906bd28', 'ทาวเวอร์ 3L', 1090, true, 2),
  ('17fe93ed-72fe-584f-88e7-e860123623bc', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '6f36909f-2b0d-5bf0-926b-e9137906bd28', 'ค็อกเทลประจำร้าน', 390, true, 3),
  ('85ce878a-31da-555f-b339-1684c165e977', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '1ec66651-1381-510e-ae50-8b062b2e9dcd', 'โซดา', 40, true, 4),
  ('52434d4d-1417-5578-969c-60259386204a', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '1ec66651-1381-510e-ae50-8b062b2e9dcd', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('24019f57-79f1-5a59-8983-0a23e952e539', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '1ec66651-1381-510e-ae50-8b062b2e9dcd', 'โค้ก / สไปรท์', 40, true, 6),
  ('4286498c-aaf6-5b72-b69e-4f21ab318d5c', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '1ec66651-1381-510e-ae50-8b062b2e9dcd', 'น้ำเปล่า', 30, true, 7),
  ('7c76cbd4-4ae8-52a7-87e4-0dd0e5ef743b', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '9e7dcf73-4206-5cb3-8abc-e4873eb2aca9', 'ยำรวมมิตร', 270, true, 8),
  ('4e325589-de53-540b-8298-c443eadf40d7', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', '9e7dcf73-4206-5cb3-8abc-e4873eb2aca9', 'ข้าวผัดต้มยำ', 220, true, 9),
  ('abf7af68-1885-5f7b-9b54-f74b940fef47', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'f0da9164-cd72-52aa-8597-bc5391841e6f', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('a8cb0445-0d91-5b16-b122-e50b99144c31', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'f0da9164-cd72-52aa-8597-bc5391841e6f', 'ปีกไก่ทอดน้ำปลา', 230, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('8ffa7aca-7037-5af8-ac78-d496db83c6f5', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1831);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('8ffa7aca-7037-5af8-ac78-d496db83c6f5', 'c13a2594-2307-50b9-8673-97a44cefbd07', 'เซ็ตขวด 700ml', 1, 1470, 0),
  ('8ffa7aca-7037-5af8-ac78-d496db83c6f5', '85ce878a-31da-555f-b339-1684c165e977', 'โซดา', 6, 40, 1),
  ('8ffa7aca-7037-5af8-ac78-d496db83c6f5', '52434d4d-1417-5578-969c-60259386204a', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('8ffa7aca-7037-5af8-ac78-d496db83c6f5', 'abf7af68-1885-5f7b-9b54-f74b940fef47', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('03755f26-f573-5762-98d2-27c84fbd8266', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3376);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('03755f26-f573-5762-98d2-27c84fbd8266', 'c13a2594-2307-50b9-8673-97a44cefbd07', 'เซ็ตขวด 700ml', 2, 1470, 0),
  ('03755f26-f573-5762-98d2-27c84fbd8266', '85ce878a-31da-555f-b339-1684c165e977', 'โซดา', 10, 40, 1),
  ('03755f26-f573-5762-98d2-27c84fbd8266', '52434d4d-1417-5578-969c-60259386204a', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('03755f26-f573-5762-98d2-27c84fbd8266', 'abf7af68-1885-5f7b-9b54-f74b940fef47', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('fb87a190-3e25-5925-8e16-f97afe479c87', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5207);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('fb87a190-3e25-5925-8e16-f97afe479c87', 'c13a2594-2307-50b9-8673-97a44cefbd07', 'เซ็ตขวด 700ml', 3, 1470, 0),
  ('fb87a190-3e25-5925-8e16-f97afe479c87', '85ce878a-31da-555f-b339-1684c165e977', 'โซดา', 16, 40, 1),
  ('fb87a190-3e25-5925-8e16-f97afe479c87', '52434d4d-1417-5578-969c-60259386204a', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('fb87a190-3e25-5925-8e16-f97afe479c87', 'abf7af68-1885-5f7b-9b54-f74b940fef47', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('f863b432-b13f-5514-b648-05f2ee401df2', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('4f5e30ca-271a-5645-b56e-577b883fd8cc', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'โซนหน้าเวที', 16, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('b52a351d-bb48-5f54-afe4-f2fd44312d6c', '4f5e30ca-271a-5645-b56e-577b883fd8cc', 'A1', 4),
  ('8c9af8cb-f4b0-5df5-be38-823be0b8febe', '4f5e30ca-271a-5645-b56e-577b883fd8cc', 'A2', 4),
  ('1c01b9ec-aff2-5318-b9cc-e137d6603452', '4f5e30ca-271a-5645-b56e-577b883fd8cc', 'A3', 4),
  ('1ea65e4f-9cc2-532e-a179-e0e5f892053c', '4f5e30ca-271a-5645-b56e-577b883fd8cc', 'A4', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('5a47b37e-a06c-5413-bdc4-3ef41a6191e9', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'โซนนั่งชิล', 24, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('1e214891-137f-5bf9-953f-644749d6fa0a', '5a47b37e-a06c-5413-bdc4-3ef41a6191e9', 'B1', 6),
  ('82dc35c2-0dce-5fbc-9a11-4d094d89f367', '5a47b37e-a06c-5413-bdc4-3ef41a6191e9', 'B2', 6),
  ('3959e960-737e-575f-880e-27599360cc53', '5a47b37e-a06c-5413-bdc4-3ef41a6191e9', 'B3', 6),
  ('aa88045e-b508-5290-94a6-fae181e50dfa', '5a47b37e-a06c-5413-bdc4-3ef41a6191e9', 'B4', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('e5e932d7-f478-5ea5-af86-d6696fa6db0e', 'bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('e2bc594f-cf11-59ff-927b-b4af160a0020', 'e5e932d7-f478-5ea5-af86-d6696fa6db0e', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'FIRST_AID', 'YES', 'ADMIN_VERIFIED', now()),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'ID_CHECK', 'YES', 'ADMIN_VERIFIED', now()),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'PARKING_RIDE', 'NO', 'SELF_DECLARED', null),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'FEMALE_STAFF', 'YES', 'SELF_DECLARED', null),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'LIGHTING', 'UNKNOWN', 'SELF_DECLARED', null),
  ('bf05155c-d15b-54ae-a9b3-52b5efb784e9', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());

-- Golden Owl (bar-13)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', null, 'golden-owl', 'Golden Owl', 'PUB_BAR', 'Golden Owl · ผับ / บาร์ ย่านอารีย์ บรรยากาศ Pub/Dance · Live Music · Chill เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '184 ซอยสมมติ 13 เขตอารีย์ กรุงเทพฯ',
  (select id from districts where name_th = 'อารีย์'), 13.738499, 100.618669,
  null, 'linear-gradient(135deg,#1A0B2E 0%,#963BE8 50%,#FFD77A 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 500, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 15
where bar_id = '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7';
update bar_stats set avg_price_per_person = 880, safety_score = 44, score = 52,
  current_stars = 2, current_tier = 'C', is_new = false,
  rating_avg = 3.2, rating_count = 1021, is_editor_pick = false
where bar_id = '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7';
insert into bar_pr_counts (bar_id, gender, pr_count) values ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'MALE', 3), ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'FEMALE', 4);
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 0, '18:00', '02:00', false),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 1, '18:00', '02:00', true),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 2, '18:00', '02:00', false),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 3, '18:00', '02:00', false),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 4, '18:00', '02:00', false),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 5, '18:00', '02:00', false),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', id from styles where key in ('PUB_DANCE', 'LIVE_MUSIC', 'CHILL');
insert into bar_links (bar_id, type, url, sort_order) values
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'INSTAGRAM', 'https://instagram.com/goldenowl', 0),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'TIKTOK', 'https://tiktok.com/@goldenowl', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'VAT', 'VAT', 'PERCENTAGE', 7, 2),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'OTHER', 'ค่าบริการอื่น (ต่อโต๊ะ)', 'FIXED_PER_TABLE', 200, 3);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('37a42c45-f06d-5caa-a69a-24c9fe61ad16', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'เครื่องดื่ม', 0),
  ('6a6ac3b6-6fda-5f79-9d9b-1021461f08a3', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'มิกเซอร์', 1),
  ('45ffde2c-276e-5ab5-9217-cae8dbe00cfe', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'อาหาร', 2),
  ('b6f1ed7a-6959-5783-9896-8d39dfde01a9', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('575d596b-51d2-5740-a2ec-a201cb33e53b', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '37a42c45-f06d-5caa-a69a-24c9fe61ad16', 'เซ็ตขวด 700ml', 1360, true, 0),
  ('0511edc4-3b56-5c21-8182-ede153fade23', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '37a42c45-f06d-5caa-a69a-24c9fe61ad16', 'เซ็ตขวด 1L', 1870, true, 1),
  ('7efe3cb6-3c13-59fe-8bde-9a95b07e4805', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '37a42c45-f06d-5caa-a69a-24c9fe61ad16', 'ทาวเวอร์ 3L', 1010, true, 2),
  ('f5400179-4109-5fba-8356-6ef86c2ca569', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '37a42c45-f06d-5caa-a69a-24c9fe61ad16', 'ค็อกเทลประจำร้าน', 360, true, 3),
  ('e17de0f7-18c0-5052-826c-c6121f248473', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '6a6ac3b6-6fda-5f79-9d9b-1021461f08a3', 'โซดา', 30, true, 4),
  ('adb5379c-c17e-519b-871c-639ee0a571e2', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '6a6ac3b6-6fda-5f79-9d9b-1021461f08a3', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('891e1b78-c669-5458-89fc-d79a0c28316f', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '6a6ac3b6-6fda-5f79-9d9b-1021461f08a3', 'โค้ก / สไปรท์', 40, true, 6),
  ('2eeb0880-3fa6-584c-8d99-aedba6685642', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '6a6ac3b6-6fda-5f79-9d9b-1021461f08a3', 'น้ำเปล่า', 30, true, 7),
  ('deecd63e-32b4-52c3-8178-4b35cac6dc62', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '45ffde2c-276e-5ab5-9217-cae8dbe00cfe', 'ยำรวมมิตร', 250, true, 8),
  ('bba77b85-3fcd-5ee3-9b0b-791058cf40bb', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', '45ffde2c-276e-5ab5-9217-cae8dbe00cfe', 'ข้าวผัดต้มยำ', 200, true, 9),
  ('f5da0946-530b-548b-99b9-a81464a19370', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'b6f1ed7a-6959-5783-9896-8d39dfde01a9', 'เฟรนช์ฟรายส์', 170, true, 10),
  ('79a5d98d-55af-5614-9d71-065f12a84235', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'b6f1ed7a-6959-5783-9896-8d39dfde01a9', 'ปีกไก่ทอดน้ำปลา', 220, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('dff5bed8-62e7-50c3-b9d1-710fd09c7159', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1665);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('dff5bed8-62e7-50c3-b9d1-710fd09c7159', '575d596b-51d2-5740-a2ec-a201cb33e53b', 'เซ็ตขวด 700ml', 1, 1360, 0),
  ('dff5bed8-62e7-50c3-b9d1-710fd09c7159', 'e17de0f7-18c0-5052-826c-c6121f248473', 'โซดา', 6, 30, 1),
  ('dff5bed8-62e7-50c3-b9d1-710fd09c7159', 'adb5379c-c17e-519b-871c-639ee0a571e2', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('dff5bed8-62e7-50c3-b9d1-710fd09c7159', 'f5da0946-530b-548b-99b9-a81464a19370', 'เฟรนช์ฟรายส์', 1, 170, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('d59aa8b2-15fd-57dc-83f1-3cfcde618b66', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3073);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('d59aa8b2-15fd-57dc-83f1-3cfcde618b66', '575d596b-51d2-5740-a2ec-a201cb33e53b', 'เซ็ตขวด 700ml', 2, 1360, 0),
  ('d59aa8b2-15fd-57dc-83f1-3cfcde618b66', 'e17de0f7-18c0-5052-826c-c6121f248473', 'โซดา', 10, 30, 1),
  ('d59aa8b2-15fd-57dc-83f1-3cfcde618b66', 'adb5379c-c17e-519b-871c-639ee0a571e2', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('d59aa8b2-15fd-57dc-83f1-3cfcde618b66', 'f5da0946-530b-548b-99b9-a81464a19370', 'เฟรนช์ฟรายส์', 1, 170, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('87963a0d-df74-5d8e-8d44-743d63e790ae', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4738);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('87963a0d-df74-5d8e-8d44-743d63e790ae', '575d596b-51d2-5740-a2ec-a201cb33e53b', 'เซ็ตขวด 700ml', 3, 1360, 0),
  ('87963a0d-df74-5d8e-8d44-743d63e790ae', 'e17de0f7-18c0-5052-826c-c6121f248473', 'โซดา', 16, 30, 1),
  ('87963a0d-df74-5d8e-8d44-743d63e790ae', 'adb5379c-c17e-519b-871c-639ee0a571e2', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('87963a0d-df74-5d8e-8d44-743d63e790ae', 'f5da0946-530b-548b-99b9-a81464a19370', 'เฟรนช์ฟรายส์', 2, 170, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('6bb34619-d5e4-59d7-8d9b-2b9faa1c9add', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('0b12cf86-8409-56c9-a00f-9f7447cc9456', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'Ladies Night พุธ', 'ค็อกเทลแก้วแรกฟรีสำหรับสุภาพสตรี ทุกวันพุธ', 'OTHER', '{3}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('de80de9f-fd2e-5ea6-9fce-904bb87887fa', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'โซนหน้าเวที', 20, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('9c468dc8-f980-5db8-857b-7b8abfff5d1b', 'de80de9f-fd2e-5ea6-9fce-904bb87887fa', 'A1', 4),
  ('ffdcd6a4-f07b-5c59-a4e6-8b1675807b05', 'de80de9f-fd2e-5ea6-9fce-904bb87887fa', 'A2', 4),
  ('43908fe9-db74-5a73-9744-c2f6e5d04383', 'de80de9f-fd2e-5ea6-9fce-904bb87887fa', 'A3', 4),
  ('148787d2-c8aa-51c4-b328-985a776a3ea4', 'de80de9f-fd2e-5ea6-9fce-904bb87887fa', 'A4', 4),
  ('e805a088-4c7a-5f40-bb9a-00a11d832cf0', 'de80de9f-fd2e-5ea6-9fce-904bb87887fa', 'A5', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('404602b6-5d62-54e1-b339-13f2c02ae85c', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'โซนนั่งชิล', 30, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('96d54589-1576-58a7-b69f-29a331ad48b4', '404602b6-5d62-54e1-b339-13f2c02ae85c', 'B1', 6),
  ('3f705be1-73de-59b0-9a7a-0b45ea975c26', '404602b6-5d62-54e1-b339-13f2c02ae85c', 'B2', 6),
  ('20c72a6e-50e8-56be-b0c4-f9ec4e19c282', '404602b6-5d62-54e1-b339-13f2c02ae85c', 'B3', 6),
  ('d6ffe588-46dd-560e-90be-fd2ecd62f588', '404602b6-5d62-54e1-b339-13f2c02ae85c', 'B4', 6),
  ('81f4f64f-34af-5ece-aa2d-830546a113e3', '404602b6-5d62-54e1-b339-13f2c02ae85c', 'B5', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('4b33c766-49e4-5c99-b9bc-4b1d7c258bca', '5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('8b9b0b78-95b6-53b2-8d16-005143714b9c', '4b33c766-49e4-5c99-b9bc-4b1d7c258bca', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'SECURITY', 'YES', 'SELF_DECLARED', null),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'CCTV', 'NO', 'ADMIN_VERIFIED', now()),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'FIRE_EXIT', 'NO', 'ADMIN_VERIFIED', now()),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'FIRST_AID', 'NO', 'ADMIN_VERIFIED', now()),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'ID_CHECK', 'NO', 'SELF_DECLARED', null),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'PARKING_RIDE', 'YES', 'SELF_DECLARED', null),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'FEMALE_STAFF', 'NO', 'ADMIN_VERIFIED', now()),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'LIGHTING', 'YES', 'SELF_DECLARED', null),
  ('5746aa2f-136a-52ad-87dd-eb8ff90fb5e7', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);

-- Echo Garden (bar-14)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', null, 'echo-garden', 'Echo Garden', 'CHILL', 'Echo Garden · ร้านนั่งชิล ย่านสีลม บรรยากาศ Pub/Dance · Food-focused เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '191 ซอยสมมติ 14 เขตสีลม กรุงเทพฯ',
  (select id from districts where name_th = 'สีลม'), 13.722802, 100.562231,
  null, 'linear-gradient(135deg,#07070D 0%,#34283F 40%,#E8B64C 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 30
where bar_id = '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3';
update bar_stats set avg_price_per_person = 670, safety_score = 78, score = 49,
  current_stars = 2, current_tier = 'C', is_new = false,
  rating_avg = 3.1, rating_count = 784, is_editor_pick = false
where bar_id = '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3';
update bar_live_status set current_crowd = 'FULL', crowd_updated_at = now() - interval '20 minutes' where bar_id = '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 0, '18:00', '02:00', false),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 1, '18:00', '02:00', false),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 2, '18:00', '02:00', false),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 3, '18:00', '02:00', false),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 4, '18:00', '02:00', false),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 5, '18:00', '02:00', false),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', id from styles where key in ('PUB_DANCE', 'FOOD_FOCUSED');
insert into bar_links (bar_id, type, url, sort_order) values
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'INSTAGRAM', 'https://instagram.com/echogarden', 0),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'TIKTOK', 'https://tiktok.com/@echogarden', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('cd454c56-d81a-5b39-b4dc-0f62f4e90e85', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'เครื่องดื่ม', 0),
  ('4af64579-69af-557e-ba68-d97d923a8451', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'มิกเซอร์', 1),
  ('51237e70-1635-5032-a964-f5a31bc50536', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'อาหาร', 2),
  ('50352777-5f94-502c-8cc5-9e84fffc0f75', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('a10897de-70d2-56d3-a020-6ec89749ee6f', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'cd454c56-d81a-5b39-b4dc-0f62f4e90e85', 'เซ็ตขวด 700ml', 1020, true, 0),
  ('cd4aed96-1ef8-56f9-ac26-2cc7fdf2c907', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'cd454c56-d81a-5b39-b4dc-0f62f4e90e85', 'เซ็ตขวด 1L', 1400, true, 1),
  ('f7b39d12-4367-5380-b02a-13ca46854ef9', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'cd454c56-d81a-5b39-b4dc-0f62f4e90e85', 'ทาวเวอร์ 3L', 760, true, 2),
  ('1a04b484-88ba-5e56-8b1d-32a9e104c99e', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'cd454c56-d81a-5b39-b4dc-0f62f4e90e85', 'ค็อกเทลประจำร้าน', 270, true, 3),
  ('b8f1bb0c-e499-551b-a523-4c4d5312d587', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '4af64579-69af-557e-ba68-d97d923a8451', 'โซดา', 30, true, 4),
  ('a9075781-ec43-5de7-b095-ff6abd7db9db', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '4af64579-69af-557e-ba68-d97d923a8451', 'น้ำแข็ง (ถัง)', 30, true, 5),
  ('83b1927e-5527-5834-97a5-4974cc3ec089', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '4af64579-69af-557e-ba68-d97d923a8451', 'โค้ก / สไปรท์', 30, true, 6),
  ('d9b85773-5036-553f-9bc1-88e0e3508120', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '4af64579-69af-557e-ba68-d97d923a8451', 'น้ำเปล่า', 20, true, 7),
  ('3a5ee9f2-2f93-51d7-9d4b-0e8f20fd345a', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '51237e70-1635-5032-a964-f5a31bc50536', 'ยำรวมมิตร', 190, true, 8),
  ('3dbe7622-af70-5d1b-8062-c0a80f944dd6', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '51237e70-1635-5032-a964-f5a31bc50536', 'ข้าวผัดต้มยำ', 150, true, 9),
  ('21978534-113f-511b-986f-4653a91851d3', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '50352777-5f94-502c-8cc5-9e84fffc0f75', 'เฟรนช์ฟรายส์', 130, true, 10),
  ('e0103ca6-18ed-56b8-926e-695978883f0b', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', '50352777-5f94-502c-8cc5-9e84fffc0f75', 'ปีกไก่ทอดน้ำปลา', 160, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('558cc640-e577-53b2-b884-85071be11ad2', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1279);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('558cc640-e577-53b2-b884-85071be11ad2', 'a10897de-70d2-56d3-a020-6ec89749ee6f', 'เซ็ตขวด 700ml', 1, 1020, 0),
  ('558cc640-e577-53b2-b884-85071be11ad2', 'b8f1bb0c-e499-551b-a523-4c4d5312d587', 'โซดา', 6, 30, 1),
  ('558cc640-e577-53b2-b884-85071be11ad2', 'a9075781-ec43-5de7-b095-ff6abd7db9db', 'น้ำแข็ง (ถัง)', 2, 30, 2),
  ('558cc640-e577-53b2-b884-85071be11ad2', '21978534-113f-511b-986f-4653a91851d3', 'เฟรนช์ฟรายส์', 1, 130, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('945474db-54ad-545d-91d6-16b8507d8d15', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2355);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('945474db-54ad-545d-91d6-16b8507d8d15', 'a10897de-70d2-56d3-a020-6ec89749ee6f', 'เซ็ตขวด 700ml', 2, 1020, 0),
  ('945474db-54ad-545d-91d6-16b8507d8d15', 'b8f1bb0c-e499-551b-a523-4c4d5312d587', 'โซดา', 10, 30, 1),
  ('945474db-54ad-545d-91d6-16b8507d8d15', 'a9075781-ec43-5de7-b095-ff6abd7db9db', 'น้ำแข็ง (ถัง)', 3, 30, 2),
  ('945474db-54ad-545d-91d6-16b8507d8d15', '21978534-113f-511b-986f-4653a91851d3', 'เฟรนช์ฟรายส์', 1, 130, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('89b748d1-806d-5aa8-bd4d-6c59c91cf584', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 3634);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('89b748d1-806d-5aa8-bd4d-6c59c91cf584', 'a10897de-70d2-56d3-a020-6ec89749ee6f', 'เซ็ตขวด 700ml', 3, 1020, 0),
  ('89b748d1-806d-5aa8-bd4d-6c59c91cf584', 'b8f1bb0c-e499-551b-a523-4c4d5312d587', 'โซดา', 16, 30, 1),
  ('89b748d1-806d-5aa8-bd4d-6c59c91cf584', 'a9075781-ec43-5de7-b095-ff6abd7db9db', 'น้ำแข็ง (ถัง)', 5, 30, 2),
  ('89b748d1-806d-5aa8-bd4d-6c59c91cf584', '21978534-113f-511b-986f-4653a91851d3', 'เฟรนช์ฟรายส์', 2, 130, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('38767b58-dd59-5a79-9e93-97d08f28ee7f', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('4100e175-b3e6-5b52-aef4-04c277af10bc', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'มา 6 คนขึ้นไป ฟรีของทานเล่น 1 จาน', 'จองผ่าน NightOut และเช็กอินครบตามจำนวน', 'FREE_APPETIZER', '{0,1,2,3,4,5,6}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('9c1434bd-1e2b-58b8-ad30-65203546860f', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'โซนหน้าเวที', 20, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('e369572c-0884-55f0-a431-e0e290479707', '9c1434bd-1e2b-58b8-ad30-65203546860f', 'A1', 4),
  ('7d941972-2f13-5acf-843f-36108369182f', '9c1434bd-1e2b-58b8-ad30-65203546860f', 'A2', 4),
  ('ecebe9e0-17e5-5161-a41c-1bb92bbc91b5', '9c1434bd-1e2b-58b8-ad30-65203546860f', 'A3', 4),
  ('aa4fa744-a9c1-565b-b997-83948431d007', '9c1434bd-1e2b-58b8-ad30-65203546860f', 'A4', 4),
  ('769e0d37-d6a2-56d9-8511-a31adf74482f', '9c1434bd-1e2b-58b8-ad30-65203546860f', 'A5', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('20c84c14-3729-5ab8-bcb0-0ea14131e71a', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'โซนนั่งชิล', 30, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('a2834969-2e8a-5d05-9a30-bd7d7a232605', '20c84c14-3729-5ab8-bcb0-0ea14131e71a', 'B1', 6),
  ('7fac45b0-b337-5382-951b-1c6b857d03e5', '20c84c14-3729-5ab8-bcb0-0ea14131e71a', 'B2', 6),
  ('33c3666a-4583-5de1-8b5e-35ca8f9b9c8b', '20c84c14-3729-5ab8-bcb0-0ea14131e71a', 'B3', 6),
  ('9ce78cbb-eb54-5c10-b126-30f95b6d4480', '20c84c14-3729-5ab8-bcb0-0ea14131e71a', 'B4', 6),
  ('34b92232-1102-54ea-bb84-28b845abc37a', '20c84c14-3729-5ab8-bcb0-0ea14131e71a', 'B5', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('fd52d90e-97dc-571d-b679-ed25c09d9037', '5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('48b230e6-6d64-5ea1-b6b9-fdef1084009b', 'fd52d90e-97dc-571d-b679-ed25c09d9037', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'SECURITY', 'YES', 'SELF_DECLARED', null),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'FIRE_EXIT', 'YES', 'SELF_DECLARED', null),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'FIRST_AID', 'YES', 'SELF_DECLARED', null),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'ID_CHECK', 'YES', 'ADMIN_VERIFIED', now()),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'PARKING_RIDE', 'YES', 'SELF_DECLARED', null),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'FEMALE_STAFF', 'YES', 'ADMIN_VERIFIED', now()),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'LIGHTING', 'NO', 'ADMIN_VERIFIED', now()),
  ('5bcdb1a4-bb22-5884-8fb1-bc0a0266cde3', 'EMERGENCY_CONTACT', 'NO', 'ADMIN_VERIFIED', now());

-- Night Market Tap (bar-15)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('26924211-46cf-50a1-8642-65323dc4c0b3', null, 'night-market-tap', 'Night Market Tap', 'RESTAURANT', 'Night Market Tap · ร้านอาหารมีเครื่องดื่ม ย่านสาทร บรรยากาศ Food-focused · Pub/Dance เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '198 ซอยสมมติ 15 เขตสาทร กรุงเทพฯ',
  (select id from districts where name_th = 'สาทร'), 13.774778, 100.522873,
  null, 'linear-gradient(135deg,#140A1F 0%,#7E22CE 60%,#F5C85E 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ยกเว้นค่าเข้า']::text[], 'APPROVED', now());
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 60
where bar_id = '26924211-46cf-50a1-8642-65323dc4c0b3';
update bar_stats set avg_price_per_person = 790, safety_score = 44, score = 82,
  current_stars = null, current_tier = null, is_new = true,
  rating_avg = 4.3, rating_count = 3, is_editor_pick = false
where bar_id = '26924211-46cf-50a1-8642-65323dc4c0b3';
update bar_live_status set current_crowd = 'AVAILABLE', crowd_updated_at = now() - interval '20 minutes' where bar_id = '26924211-46cf-50a1-8642-65323dc4c0b3';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 0, '18:00', '02:00', false),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 1, '18:00', '02:00', false),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 2, '18:00', '02:00', false),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 3, '18:00', '02:00', false),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 4, '18:00', '02:00', false),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 5, '18:00', '02:00', false),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '26924211-46cf-50a1-8642-65323dc4c0b3', id from styles where key in ('FOOD_FOCUSED', 'PUB_DANCE');
insert into bar_links (bar_id, type, url, sort_order) values
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'INSTAGRAM', 'https://instagram.com/nightmarkettap', 0),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'TIKTOK', 'https://tiktok.com/@nightmarkettap', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('ff27ac5b-196e-5b47-965d-bd44d5f5b477', '26924211-46cf-50a1-8642-65323dc4c0b3', 'เครื่องดื่ม', 0),
  ('34a6f874-ab9d-50b9-9e63-546060d7dd72', '26924211-46cf-50a1-8642-65323dc4c0b3', 'มิกเซอร์', 1),
  ('3d94aa51-969b-5b26-8a37-89aad8aef7aa', '26924211-46cf-50a1-8642-65323dc4c0b3', 'อาหาร', 2),
  ('f504d7a9-f103-5d0e-bbe7-8e676f07eb53', '26924211-46cf-50a1-8642-65323dc4c0b3', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('1cb3a765-9a2e-5522-a612-2f61cc8e1c9e', '26924211-46cf-50a1-8642-65323dc4c0b3', 'ff27ac5b-196e-5b47-965d-bd44d5f5b477', 'เซ็ตขวด 700ml', 1220, true, 0),
  ('d256f7e2-5f65-5d61-8df8-62e30e118d59', '26924211-46cf-50a1-8642-65323dc4c0b3', 'ff27ac5b-196e-5b47-965d-bd44d5f5b477', 'เซ็ตขวด 1L', 1680, true, 1),
  ('41a7a270-731e-5e16-be31-c5800b447e4a', '26924211-46cf-50a1-8642-65323dc4c0b3', 'ff27ac5b-196e-5b47-965d-bd44d5f5b477', 'ทาวเวอร์ 3L', 900, true, 2),
  ('258a97ce-a766-5d8f-95cd-609ab8fbb3c0', '26924211-46cf-50a1-8642-65323dc4c0b3', 'ff27ac5b-196e-5b47-965d-bd44d5f5b477', 'ค็อกเทลประจำร้าน', 330, true, 3),
  ('771c8cd8-02c3-52ab-a113-8f6a16cdd3f4', '26924211-46cf-50a1-8642-65323dc4c0b3', '34a6f874-ab9d-50b9-9e63-546060d7dd72', 'โซดา', 30, true, 4),
  ('931cd160-f614-5323-a127-ca203cfaca5c', '26924211-46cf-50a1-8642-65323dc4c0b3', '34a6f874-ab9d-50b9-9e63-546060d7dd72', 'น้ำแข็ง (ถัง)', 40, true, 5),
  ('fcf11cf9-9b12-58a7-b09c-a9904756252a', '26924211-46cf-50a1-8642-65323dc4c0b3', '34a6f874-ab9d-50b9-9e63-546060d7dd72', 'โค้ก / สไปรท์', 40, true, 6),
  ('bda206b6-4eef-5325-ae64-2bb3b8570270', '26924211-46cf-50a1-8642-65323dc4c0b3', '34a6f874-ab9d-50b9-9e63-546060d7dd72', 'น้ำเปล่า', 30, true, 7),
  ('2a169425-286c-5558-a914-5e6034dff38c', '26924211-46cf-50a1-8642-65323dc4c0b3', '3d94aa51-969b-5b26-8a37-89aad8aef7aa', 'ยำรวมมิตร', 220, true, 8),
  ('fa663e2a-e490-5efd-b5e1-4e960b022bc3', '26924211-46cf-50a1-8642-65323dc4c0b3', '3d94aa51-969b-5b26-8a37-89aad8aef7aa', 'ข้าวผัดต้มยำ', 180, true, 9),
  ('79ca098c-0480-5d30-b99d-3634011ef609', '26924211-46cf-50a1-8642-65323dc4c0b3', 'f504d7a9-f103-5d0e-bbe7-8e676f07eb53', 'เฟรนช์ฟรายส์', 150, true, 10),
  ('674197be-69c2-57cf-8ce1-c77d0f2eb876', '26924211-46cf-50a1-8642-65323dc4c0b3', 'f504d7a9-f103-5d0e-bbe7-8e676f07eb53', 'ปีกไก่ทอดน้ำปลา', 190, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('d4fd16cd-8702-50b7-9412-f34f8d151f67', '26924211-46cf-50a1-8642-65323dc4c0b3', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1500);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('d4fd16cd-8702-50b7-9412-f34f8d151f67', '1cb3a765-9a2e-5522-a612-2f61cc8e1c9e', 'เซ็ตขวด 700ml', 1, 1220, 0),
  ('d4fd16cd-8702-50b7-9412-f34f8d151f67', '771c8cd8-02c3-52ab-a113-8f6a16cdd3f4', 'โซดา', 6, 30, 1),
  ('d4fd16cd-8702-50b7-9412-f34f8d151f67', '931cd160-f614-5323-a127-ca203cfaca5c', 'น้ำแข็ง (ถัง)', 2, 40, 2),
  ('d4fd16cd-8702-50b7-9412-f34f8d151f67', '79ca098c-0480-5d30-b99d-3634011ef609', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('bf74fdcc-cbe5-5241-a2a8-f65988a3c953', '26924211-46cf-50a1-8642-65323dc4c0b3', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 2769);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('bf74fdcc-cbe5-5241-a2a8-f65988a3c953', '1cb3a765-9a2e-5522-a612-2f61cc8e1c9e', 'เซ็ตขวด 700ml', 2, 1220, 0),
  ('bf74fdcc-cbe5-5241-a2a8-f65988a3c953', '771c8cd8-02c3-52ab-a113-8f6a16cdd3f4', 'โซดา', 10, 30, 1),
  ('bf74fdcc-cbe5-5241-a2a8-f65988a3c953', '931cd160-f614-5323-a127-ca203cfaca5c', 'น้ำแข็ง (ถัง)', 3, 40, 2),
  ('bf74fdcc-cbe5-5241-a2a8-f65988a3c953', '79ca098c-0480-5d30-b99d-3634011ef609', 'เฟรนช์ฟรายส์', 1, 150, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('5b1be085-3f2c-5e62-8fc3-7c7b8569deb5', '26924211-46cf-50a1-8642-65323dc4c0b3', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 4269);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('5b1be085-3f2c-5e62-8fc3-7c7b8569deb5', '1cb3a765-9a2e-5522-a612-2f61cc8e1c9e', 'เซ็ตขวด 700ml', 3, 1220, 0),
  ('5b1be085-3f2c-5e62-8fc3-7c7b8569deb5', '771c8cd8-02c3-52ab-a113-8f6a16cdd3f4', 'โซดา', 16, 30, 1),
  ('5b1be085-3f2c-5e62-8fc3-7c7b8569deb5', '931cd160-f614-5323-a127-ca203cfaca5c', 'น้ำแข็ง (ถัง)', 5, 40, 2),
  ('5b1be085-3f2c-5e62-8fc3-7c7b8569deb5', '79ca098c-0480-5d30-b99d-3634011ef609', 'เฟรนช์ฟรายส์', 2, 150, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('f72c4196-4b81-5663-ae46-52dadf732fb6', '26924211-46cf-50a1-8642-65323dc4c0b3', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('aa59e12a-906e-543d-a9b7-d430ace3deef', '26924211-46cf-50a1-8642-65323dc4c0b3', 'โซนหน้าเวที', 16, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('c9ee0cfc-1b58-57d2-869c-c5038bbb5d2a', 'aa59e12a-906e-543d-a9b7-d430ace3deef', 'A1', 4),
  ('ac32387c-e807-59b7-bba9-e6e0771cbc6e', 'aa59e12a-906e-543d-a9b7-d430ace3deef', 'A2', 4),
  ('353bb960-3435-5510-8577-8662e9fda962', 'aa59e12a-906e-543d-a9b7-d430ace3deef', 'A3', 4),
  ('355d9a56-f18d-5112-b209-344ebf25b1ec', 'aa59e12a-906e-543d-a9b7-d430ace3deef', 'A4', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('367d9c49-bc42-5dfe-a773-9059fa6a4c44', '26924211-46cf-50a1-8642-65323dc4c0b3', 'โซนนั่งชิล', 24, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('f738887b-8f3a-5c69-9cc5-f213b2931241', '367d9c49-bc42-5dfe-a773-9059fa6a4c44', 'B1', 6),
  ('99e7bfd0-02bc-5ff8-bb72-defc2f7613c9', '367d9c49-bc42-5dfe-a773-9059fa6a4c44', 'B2', 6),
  ('1b59b4b7-84b9-5374-9f9a-605e45f59d71', '367d9c49-bc42-5dfe-a773-9059fa6a4c44', 'B3', 6),
  ('231f6023-3c9c-5c51-96f7-2322b08baddf', '367d9c49-bc42-5dfe-a773-9059fa6a4c44', 'B4', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('111f9cae-7032-520b-b1b2-be796c37284e', '26924211-46cf-50a1-8642-65323dc4c0b3', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('955f4815-3e21-5212-b4f4-b3e36226ce40', '111f9cae-7032-520b-b1b2-be796c37284e', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'SECURITY', 'UNKNOWN', 'SELF_DECLARED', null),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'CCTV', 'YES', 'ADMIN_VERIFIED', now()),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'FIRST_AID', 'NO', 'ADMIN_VERIFIED', now()),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'ID_CHECK', 'NO', 'SELF_DECLARED', null),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'PARKING_RIDE', 'UNKNOWN', 'SELF_DECLARED', null),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'FEMALE_STAFF', 'NO', 'ADMIN_VERIFIED', now()),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'LIGHTING', 'YES', 'ADMIN_VERIFIED', now()),
  ('26924211-46cf-50a1-8642-65323dc4c0b3', 'EMERGENCY_CONTACT', 'YES', 'ADMIN_VERIFIED', now());

-- Sapphire Social (bar-16)
insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values ('2238849e-de7d-56f9-b430-273d0b9b82f6', null, 'sapphire-social', 'Sapphire Social', 'CHILL', 'Velvet Hour · ร้านนั่งชิล ย่านเอกมัย บรรยากาศ Outdoor · Live Music · Pub/Dance เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ', '107 ซอยสมมติ 2 เขตเอกมัย กรุงเทพฯ',
  (select id from districts where name_th = 'สุขุมวิท'), 13.793190, 100.596551,
  null, 'linear-gradient(135deg,#0B1026 0%,#5869C8 60%,#A738F5 100%)', array['น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut','ส่วนลดอาหาร 10%']::text[], 'PENDING_REVIEW', null);
update bar_booking_settings set deposit_amount = 300, deposit_unit = 'PER_TABLE',
  deposit_policy = 'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ', refund_before_hours = 6, grace_minutes = 30
where bar_id = '2238849e-de7d-56f9-b430-273d0b9b82f6';
update bar_stats set avg_price_per_person = 960, safety_score = 89, score = null,
  current_stars = null, current_tier = null, is_new = true,
  rating_avg = null, rating_count = 0, is_editor_pick = false
where bar_id = '2238849e-de7d-56f9-b430-273d0b9b82f6';
insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 0, '18:00', '02:00', false),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 1, '18:00', '02:00', false),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 2, '18:00', '02:00', false),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 3, '18:00', '02:00', false),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 4, '18:00', '02:00', false),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 5, '18:00', '02:00', false),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 6, '18:00', '02:00', false);
insert into bar_styles (bar_id, style_id) select '2238849e-de7d-56f9-b430-273d0b9b82f6', id from styles where key in ('OUTDOOR', 'LIVE_MUSIC', 'PUB_DANCE');
insert into bar_links (bar_id, type, url, sort_order) values
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'INSTAGRAM', 'https://instagram.com/velvethour', 0),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'TIKTOK', 'https://tiktok.com/@velvethour', 1);
insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', 10, 1),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'VAT', 'VAT', 'PERCENTAGE', 7, 2);
insert into menu_categories (id, bar_id, name, sort_order) values
  ('bace0a8b-fe8e-5feb-aac9-9677d873bdca', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'เครื่องดื่ม', 0),
  ('810986f4-0cc0-58b5-932b-7d979dc26750', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'มิกเซอร์', 1),
  ('77d261c8-4146-525f-9251-aca5c69e4085', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'อาหาร', 2),
  ('d9c51688-eca2-52de-9c78-edb8a1db1279', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'ของทานเล่น', 3);
insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values
  ('66ab534c-4837-5f82-b765-0c9ab6075c68', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'bace0a8b-fe8e-5feb-aac9-9677d873bdca', 'เซ็ตขวด 700ml', 1460, true, 0),
  ('af38b445-78c2-58dc-a3fd-148bcdbd3085', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'bace0a8b-fe8e-5feb-aac9-9677d873bdca', 'เซ็ตขวด 1L', 2000, true, 1),
  ('1211ff08-dcda-5475-91e3-65192f0e8a4e', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'bace0a8b-fe8e-5feb-aac9-9677d873bdca', 'ทาวเวอร์ 3L', 1080, true, 2),
  ('901c2a2c-25e5-5bf3-9456-122c76db8986', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'bace0a8b-fe8e-5feb-aac9-9677d873bdca', 'ค็อกเทลประจำร้าน', 390, true, 3),
  ('ea6c3ffe-5b46-560e-8b43-5ab5459f7468', '2238849e-de7d-56f9-b430-273d0b9b82f6', '810986f4-0cc0-58b5-932b-7d979dc26750', 'โซดา', 40, true, 4),
  ('377bca2d-fde9-56af-8706-9f1a8597be32', '2238849e-de7d-56f9-b430-273d0b9b82f6', '810986f4-0cc0-58b5-932b-7d979dc26750', 'น้ำแข็ง (ถัง)', 50, true, 5),
  ('922353d6-6458-50eb-a877-7c80ddf719a4', '2238849e-de7d-56f9-b430-273d0b9b82f6', '810986f4-0cc0-58b5-932b-7d979dc26750', 'โค้ก / สไปรท์', 40, true, 6),
  ('1185db27-a7ab-5811-be7b-42cf0c9a3004', '2238849e-de7d-56f9-b430-273d0b9b82f6', '810986f4-0cc0-58b5-932b-7d979dc26750', 'น้ำเปล่า', 30, true, 7),
  ('edcaca2e-fafd-557c-990e-9f79aaae6823', '2238849e-de7d-56f9-b430-273d0b9b82f6', '77d261c8-4146-525f-9251-aca5c69e4085', 'ยำรวมมิตร', 270, true, 8),
  ('bc120ac6-bca7-53ee-b72a-c149c3969901', '2238849e-de7d-56f9-b430-273d0b9b82f6', '77d261c8-4146-525f-9251-aca5c69e4085', 'ข้าวผัดต้มยำ', 220, true, 9),
  ('78530701-f3b1-5765-981a-09bbc6d74c0a', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'd9c51688-eca2-52de-9c78-edb8a1db1279', 'เฟรนช์ฟรายส์', 180, true, 10),
  ('fe98ce7d-8542-5bc1-bab5-b82cd2e7c701', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'd9c51688-eca2-52de-9c78-edb8a1db1279', 'ปีกไก่ทอดน้ำปลา', 230, true, 11);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('ac5b8ce9-1fef-5798-8d19-aa3211d9a0c0', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, 1822);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('ac5b8ce9-1fef-5798-8d19-aa3211d9a0c0', '66ab534c-4837-5f82-b765-0c9ab6075c68', 'เซ็ตขวด 700ml', 1, 1460, 0),
  ('ac5b8ce9-1fef-5798-8d19-aa3211d9a0c0', 'ea6c3ffe-5b46-560e-8b43-5ab5459f7468', 'โซดา', 6, 40, 1),
  ('ac5b8ce9-1fef-5798-8d19-aa3211d9a0c0', '377bca2d-fde9-56af-8706-9f1a8597be32', 'น้ำแข็ง (ถัง)', 2, 50, 2),
  ('ac5b8ce9-1fef-5798-8d19-aa3211d9a0c0', '78530701-f3b1-5765-981a-09bbc6d74c0a', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('61b3071a-7930-54f1-8d85-8f0a440b68ab', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, 3358);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('61b3071a-7930-54f1-8d85-8f0a440b68ab', '66ab534c-4837-5f82-b765-0c9ab6075c68', 'เซ็ตขวด 700ml', 2, 1460, 0),
  ('61b3071a-7930-54f1-8d85-8f0a440b68ab', 'ea6c3ffe-5b46-560e-8b43-5ab5459f7468', 'โซดา', 10, 40, 1),
  ('61b3071a-7930-54f1-8d85-8f0a440b68ab', '377bca2d-fde9-56af-8706-9f1a8597be32', 'น้ำแข็ง (ถัง)', 3, 50, 2),
  ('61b3071a-7930-54f1-8d85-8f0a440b68ab', '78530701-f3b1-5765-981a-09bbc6d74c0a', 'เฟรนช์ฟรายส์', 1, 180, 3);
insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values ('9a41ebc1-f652-5635-89f9-2c084232a490', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, 5180);
insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values
  ('9a41ebc1-f652-5635-89f9-2c084232a490', '66ab534c-4837-5f82-b765-0c9ab6075c68', 'เซ็ตขวด 700ml', 3, 1460, 0),
  ('9a41ebc1-f652-5635-89f9-2c084232a490', 'ea6c3ffe-5b46-560e-8b43-5ab5459f7468', 'โซดา', 16, 40, 1),
  ('9a41ebc1-f652-5635-89f9-2c084232a490', '377bca2d-fde9-56af-8706-9f1a8597be32', 'น้ำแข็ง (ถัง)', 5, 50, 2),
  ('9a41ebc1-f652-5635-89f9-2c084232a490', '78530701-f3b1-5765-981a-09bbc6d74c0a', 'เฟรนช์ฟรายส์', 2, 180, 3);
insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values
  ('c6ffe8f9-28b1-558a-90e2-78b8a5a85504', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'โปรเบียร์ก่อน 2 ทุ่ม', 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.', 'OTHER', '{0,1,2,3,4,5,6}', '20:00', 'APPROVED', true, 0),
  ('6bfb55b1-b04f-5b20-8ebd-6db594b858d7', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'มา 6 คนขึ้นไป ฟรีของทานเล่น 1 จาน', 'จองผ่าน NightOut และเช็กอินครบตามจำนวน', 'FREE_APPETIZER', '{0,1,2,3,4,5,6}', null, 'APPROVED', true, 1);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('4ddc891a-88ba-55c6-b7ac-e032c6011ab6', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'โซนหน้าเวที', 16, 180, 0);
insert into tables (id, zone_id, name, seats) values
  ('dd23ed5f-8b18-5abf-a6c7-f146d6ff7e76', '4ddc891a-88ba-55c6-b7ac-e032c6011ab6', 'A1', 4),
  ('9129e19e-67bc-593a-b726-4f79704fb558', '4ddc891a-88ba-55c6-b7ac-e032c6011ab6', 'A2', 4),
  ('838cb27b-d7c7-507b-804b-9971d932de11', '4ddc891a-88ba-55c6-b7ac-e032c6011ab6', 'A3', 4),
  ('b21cbbd0-adda-504f-8f9d-2141647c3c2e', '4ddc891a-88ba-55c6-b7ac-e032c6011ab6', 'A4', 4);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('9de25f19-0a47-5b1d-8cc5-8e3dbddabffc', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'โซนนั่งชิล', 24, 180, 1);
insert into tables (id, zone_id, name, seats) values
  ('9a569890-0b18-5c4a-a3a5-d1b4bf1b8266', '9de25f19-0a47-5b1d-8cc5-8e3dbddabffc', 'B1', 6),
  ('578295e6-bfce-58d5-8dbd-296f8a7c4651', '9de25f19-0a47-5b1d-8cc5-8e3dbddabffc', 'B2', 6),
  ('ec006a96-7af0-5b54-8836-5d85ec972d9b', '9de25f19-0a47-5b1d-8cc5-8e3dbddabffc', 'B3', 6),
  ('3ad9ea3f-dac4-510c-b09a-51be3c504532', '9de25f19-0a47-5b1d-8cc5-8e3dbddabffc', 'B4', 6);
insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values ('5cdad7b1-c057-52a4-98a2-3352b36df46a', '2238849e-de7d-56f9-b430-273d0b9b82f6', 'ห้อง Private', 12, 240, 2);
insert into tables (id, zone_id, name, seats) values
  ('88cfad10-5760-5c58-91e3-dcd5002e0777', '5cdad7b1-c057-52a4-98a2-3352b36df46a', 'VIP', 12);
insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'SECURITY', 'YES', 'ADMIN_VERIFIED', now()),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'CCTV', 'YES', 'SELF_DECLARED', null),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'FIRE_EXIT', 'YES', 'ADMIN_VERIFIED', now()),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'FIRST_AID', 'YES', 'SELF_DECLARED', null),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'ID_CHECK', 'YES', 'SELF_DECLARED', null),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'PARKING_RIDE', 'YES', 'ADMIN_VERIFIED', now()),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'FEMALE_STAFF', 'NO', 'ADMIN_VERIFIED', now()),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'LIGHTING', 'YES', 'SELF_DECLARED', null),
  ('2238849e-de7d-56f9-b430-273d0b9b82f6', 'EMERGENCY_CONTACT', 'YES', 'SELF_DECLARED', null);

commit;
