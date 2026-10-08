/**
 * สร้าง apps/backend/supabase/seed.sql จากข้อมูลร้านเดโมใน @nightout/mock
 *
 *   pnpm --filter @nightout/backend db:seed:gen
 *
 * - ใช้ createSeed() ตัวเดียวกับโหมดเดโม → ร้าน/เมนู/โซน/โปร ตรงกับที่หน้าเว็บเคยแสดง
 * - UUID สร้างแบบคงที่จาก id เดโม (เช่น bar-1-z1-t2) → รันกี่ครั้งก็ได้ค่าเดิม
 * - ใส่เฉพาะข้อมูลร้าน (bars + ตารางลูก) · การจอง/รีวิว/ผู้ใช้เดโม ยังอยู่ใน localStorage ตามเดิม
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSeed } from '../../../packages/mock/src/seed';
import type { Bar, SafetyFeature } from '../../../packages/mock/src/models';
import { isNewBar, scoreToStars, starsToTier } from '../../../packages/utils/src/ranking';

/** UUID คงที่จาก id เดโม (รูปแบบ v5: sha1 ของ namespace + ชื่อ) */
const NS = 'nightout-demo-seed';
export function demoUuid(name: string): string {
  const h = createHash('sha1').update(`${NS}:${name}`).digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

const q = (v: string | null | undefined) => (v == null ? 'null' : `'${v.replace(/'/g, "''")}'`);
const n = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? 'null' : String(v));
const b = (v: boolean) => (v ? 'true' : 'false');
const arr = (v: string[]) => `array[${v.map(q).join(',')}]::text[]`;

const STYLE_KEYS: Record<string, string> = {
  'Live Music': 'LIVE_MUSIC',
  Chill: 'CHILL',
  'Pub/Dance': 'PUB_DANCE',
  Rooftop: 'ROOFTOP',
  'Food-focused': 'FOOD_FOCUSED',
  Quiet: 'QUIET',
  Outdoor: 'OUTDOOR',
  'Private Room': 'PRIVATE_ROOM',
  Buffet: 'BUFFET',
};
const MENU_CATEGORIES = ['เครื่องดื่ม', 'มิกเซอร์', 'อาหาร', 'ของทานเล่น'] as const;

/** master data — ต้องมีในทุก environment */
const MASTER_SQL = `-- ---------------------------------------------------------------------
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
-- ---------------------------------------------------------------------`;

function safetyScore(safety: SafetyFeature[]): number {
  return Math.round((safety.filter((s) => s.value === 'YES').length / safety.length) * 100);
}

function perkType(title: string): string {
  if (title.includes('ของทานเล่น')) return 'FREE_APPETIZER';
  return 'OTHER';
}

function barSql(bar: Bar): string[] {
  const id = demoUuid(bar.id);
  // id ลูก (เมนู/โซน/โต๊ะ/โปร) ผูกกับร้าน — ร้านเดโมบางร้านคัดลอกลูกมาจากร้านอื่น id จึงซ้ำได้
  const child = (childId: string) => demoUuid(`${bar.id}/${childId}`);
  const out: string[] = [];
  const isNew = bar.status !== 'APPROVED' || isNewBar(bar.reviewCount);
  const stars = isNew ? null : scoreToStars(bar.score);
  const approved = bar.status === 'APPROVED';

  out.push(`-- ${bar.name} (${bar.id})`);
  out.push(`insert into bars (id, owner_id, slug, name, category, description, address, district_id, lat, lng,
  cover_image_url, cover_style, perks, status, approved_at)
values (${q(id)}, null, ${q(bar.slug)}, ${q(bar.name)}, ${q(bar.category)}, ${q(bar.description)}, ${q(bar.address)},
  (select id from districts where name_th = ${q(bar.district)}), ${bar.lat.toFixed(6)}, ${bar.lng.toFixed(6)},
  ${q(bar.coverUrl ?? null)}, ${q(bar.cover)}, ${arr(bar.perks)}, ${q(bar.status)}, ${approved ? 'now()' : 'null'});`);

  // แถว 1:1 ถูกสร้างโดย trigger ตอน insert bars → อัปเดตค่า
  out.push(`update bar_booking_settings set deposit_amount = ${bar.deposit.amount}, deposit_unit = ${q(bar.deposit.unit)},
  deposit_policy = ${q(bar.deposit.policy)}, refund_before_hours = 6, grace_minutes = ${bar.gracePeriodMinutes}
where bar_id = ${q(id)};`);
  out.push(`update bar_stats set avg_price_per_person = ${bar.avgPerPerson}, safety_score = ${safetyScore(bar.safety)}, score = ${approved ? n(bar.score) : 'null'},
  current_stars = ${n(stars)}, current_tier = ${stars ? q(starsToTier(stars)) : 'null'}, is_new = ${b(isNew)},
  rating_avg = ${bar.rating > 0 ? bar.rating : 'null'}, rating_count = ${bar.reviewCount}
where bar_id = ${q(id)};`);
  if (approved)
    out.push(`update bar_live_status set current_crowd = ${q(bar.crowd)}, crowd_updated_at = now() - interval '20 minutes' where bar_id = ${q(id)};`);

  // PR ประจำร้าน (ไม่มีแถว = ไม่มี PR)
  const pr = [
    ['MALE', bar.pr.male],
    ['FEMALE', bar.pr.female],
  ].filter(([, c]) => Number(c) > 0);
  if (pr.length)
    out.push(
      `insert into bar_pr_counts (bar_id, gender, pr_count) values ${pr.map(([g, c]) => `(${q(id)}, ${q(String(g))}, ${c})`).join(', ')};`,
    );

  // เวลาเปิด-ปิด
  out.push(
    `insert into bar_hours (bar_id, day_of_week, open_time, close_time, is_closed) values\n  ` +
      bar.hours
        .map((h) => `(${q(id)}, ${h.day}, ${q(h.open)}, ${q(h.close)}, ${b(!!h.closed)})`)
        .join(',\n  ') +
      ';',
  );

  // สไตล์
  const styleKeys = bar.styles.map((s) => STYLE_KEYS[s]).filter(Boolean) as string[];
  if (styleKeys.length)
    out.push(
      `insert into bar_styles (bar_id, style_id) select ${q(id)}, id from styles where key in (${styleKeys.map(q).join(', ')});`,
    );

  // ลิงก์
  if (bar.links.length)
    out.push(
      `insert into bar_links (bar_id, type, url, sort_order) values\n  ` +
        bar.links.map((l, i) => `(${q(id)}, ${q(l.type)}, ${q(l.url.replace(/^http:/, 'https:'))}, ${i})`).join(',\n  ') +
        ';',
    );

  // ค่าธรรมเนียม (SC ก่อน VAT)
  const fees = [
    `(${q(id)}, 'SERVICE_CHARGE', 'Service charge', 'PERCENTAGE', ${bar.fees.serviceChargeRate}, 1)`,
    `(${q(id)}, 'VAT', 'VAT', 'PERCENTAGE', ${bar.fees.vatRate}, 2)`,
  ];
  if (bar.fees.otherFees > 0)
    fees.push(`(${q(id)}, 'OTHER', 'ค่าบริการอื่น (ต่อโต๊ะ)', 'FIXED_PER_TABLE', ${bar.fees.otherFees}, 3)`);
  out.push(`insert into bar_fees (bar_id, fee_type, label, calc, value, apply_order) values\n  ${fees.join(',\n  ')};`);

  // เมนู
  const catId = (c: string) => child(`cat-${c}`);
  out.push(
    `insert into menu_categories (id, bar_id, name, sort_order) values\n  ` +
      MENU_CATEGORIES.map((c, i) => `(${q(catId(c))}, ${q(id)}, ${q(c)}, ${i})`).join(',\n  ') +
      ';',
  );
  out.push(
    `insert into menu_items (id, bar_id, category_id, name, price, is_available, sort_order) values\n  ` +
      bar.menu
        .map(
          (m, i) =>
            `(${q(child(m.id))}, ${q(id)}, ${q(catId(m.category))}, ${q(m.name)}, ${m.price}, ${b(m.available)}, ${i})`,
        )
        .join(',\n  ') +
      ';',
  );

  // เซ็ตโต๊ะ (แสดงเพื่อประเมินงบ)
  for (const p of bar.packages) {
    out.push(
      `insert into price_packages (id, bar_id, name, pax_min, pax_max, total_price) values (${q(child(p.id))}, ${q(id)}, ${q(p.name)}, ${p.paxMin}, ${p.paxMax}, ${p.totalPrice});`,
    );
    out.push(
      `insert into price_package_items (package_id, menu_item_id, name_snapshot, quantity, unit_price_snapshot, sort_order) values\n  ` +
        p.items
          .map((it, i) => {
            const m = bar.menu.find((x) => x.id === it.menuItemId)!;
            return `(${q(child(p.id))}, ${q(child(m.id))}, ${q(m.name)}, ${it.quantity}, ${m.price}, ${i})`;
          })
          .join(',\n  ') +
        ';',
    );
  }

  // โปรโมชันของร้าน
  if (bar.promotions.length)
    out.push(
      `insert into bar_promotions (id, bar_id, title, description, perk_type, days_of_week, cutoff_time, moderation_status, active, sort_order) values\n  ` +
        bar.promotions
          .map(
            (p, i) =>
              `(${q(child(p.id))}, ${q(id)}, ${q(p.title)}, ${q(p.description)}, ${q(perkType(p.title))}, ` +
              `${p.days?.length ? `'{${p.days.join(',')}}'` : `'{0,1,2,3,4,5,6}'`}, ${q(p.cutoffTime ?? null)}, 'APPROVED', ${b(p.active)}, ${i})`,
          )
          .join(',\n  ') +
        ';',
    );

  // โซน / โต๊ะ
  bar.zones.forEach((z, zi) => {
    out.push(
      `insert into table_zones (id, bar_id, name, capacity_pax, default_duration_minutes, sort_order) values (${q(child(z.id))}, ${q(id)}, ${q(z.name)}, ${z.capacityPax}, ${z.defaultDurationMinutes}, ${zi});`,
    );
    out.push(
      `insert into tables (id, zone_id, name, seats) values\n  ` +
        z.tables.map((t) => `(${q(child(t.id))}, ${q(child(z.id))}, ${q(t.name)}, ${t.seats})`).join(',\n  ') +
        ';',
    );
  });

  // ความปลอดภัย
  out.push(
    `insert into bar_safety_features (bar_id, feature_key, value, source, verified_at) values\n  ` +
      bar.safety
        .map(
          (s) =>
            `(${q(id)}, ${q(s.key)}, ${q(s.value)}, ${q(s.source)}, ${s.source === 'ADMIN_VERIFIED' ? 'now()' : 'null'})`,
        )
        .join(',\n  ') +
      ';',
  );

  // ร้านโปรโมท (ป้าย "แนะนำ · โฆษณา")
  if (bar.promoted)
    out.push(`insert into promoted_listings (bar_id, package_id, placement, price_paid, starts_at, ends_at, status, approved_at)
select ${q(id)}, id, placement, price, now() - interval '1 day', now() + interval '30 days', 'ACTIVE', now()
from promotion_packages where placement = 'HOME_RECOMMENDED' and duration_days = 7 limit 1;`);

  return out;
}

export function buildSeedSql(): string {
  const { bars } = createSeed();
  const lines = [
    '-- =====================================================================',
    '-- Seed: master data + ร้านเดโม 16 ร้าน (ชื่อสมมติทั้งหมด) — สร้างอัตโนมัติ ห้ามแก้มือ',
    '-- แก้ master data ที่ MASTER_SQL ใน apps/backend/scripts/seed-from-mock.ts',
    '-- สร้างใหม่: pnpm --filter @nightout/backend db:seed:gen',
    '-- ใช้กับ: supabase db reset (local) หรือ supabase db reset --linked (project จริง)',
    '-- =====================================================================',
    'begin;',
    '',
    MASTER_SQL,
    '',
  ];
  for (const bar of bars) lines.push(...barSql(bar), '');
  lines.push('commit;', '');
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url));
  writeFileSync(target, buildSeedSql(), 'utf8');
  console.log(`seed.sql → ${target}`);
}
