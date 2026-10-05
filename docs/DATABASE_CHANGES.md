# NightOut — Database Change Spec (v1.1)

> ใช้คู่กับ `DATABASE.md` (Draft v1.0) — ไฟล์นี้คือ **รายการสิ่งที่ต้องเพิ่ม/แก้** ก่อนสร้าง database บน Supabase
> ผู้ทำ (คน หรือ AI agent) ต้องเปิดไฟล์ SQL เดิมเทียบก่อนแก้ทุกข้อ (`apps/backend/supabase/migrations/20260930000000_init.sql`)
> เมื่อเปลี่ยนชื่อ/ชนิดข้อมูล ต้องแก้ trigger, index, view, function, RLS policy และ types ให้ตรงกันทั้งหมด

**หลักการที่ตกลงกันแล้ว**

1. ตัวตนของผู้ใช้ = `auth.users.id` (uuid) **ไม่ใช้เบอร์โทรเป็น primary key**
2. ชื่อคอลัมน์ใช้คำเต็ม ไม่ย่อจนต้องเดา (เช่น ไม่ใช้ `ttl`, `min` แทน minutes)
3. **ทุก enum ในระบบเป็นตัวพิมพ์ใหญ่ (UPPER_SNAKE_CASE) ไม่มีข้อยกเว้น** รวมถึง `pr_gender`
4. ชื่อ key ที่หน้าบ้านได้รับ ยึดตามชื่อหลังบ้าน (`snake_case` ตลอดทาง ไม่มีชั้นแปลงชื่อ)
5. อ่านข้อมูลผ่าน Supabase (view / RPC) ได้ตรง · เขียนผ่าน NestJS เท่านั้น
6. หน้าบ้านต้องเรียกง่าย: **หนึ่งหน้า = หนึ่งการเรียก** และใช้กฎ "ไม่มีข้อมูล" ในหัวข้อ 5

---

## 1. ข้อมูล PR

| # | สิ่งที่ต้องทำ |
|---|---|
| 1.1 | ลบ `bars.has_pr_male`, `bars.has_pr_female` |
| 1.2 | สร้าง enum `pr_gender` = `MALE`, `FEMALE`, `LGBTQ` |
| 1.3 | สร้างตาราง `bar_pr_counts` (ดูด้านล่าง) |
| 1.4 | `bookings.request_pr`: `pr_gender` nullable (ลูกค้าขอ PR เพศไหน / ไม่ขอ = `null`) |
| 1.5 | view คืน `pr_counts` และ `has_pr` (ดูหัวข้อ 5.3) |

```
bar_pr_counts
  bar_id     uuid        FK → bars.id (on delete cascade)
  gender     pr_gender
  pr_count   integer     CHECK (pr_count >= 1)
  PRIMARY KEY (bar_id, gender)
```

- **ไม่มีแถวเลย = ร้านไม่มี PR** (จำนวน PR ประจำร้านโดยปกติ ไม่ใช่จำนวนรายคืน)
- ตารางนี้ไม่ใช่ `bar_prs` (รายชื่อ PR รายคน ซึ่งเลื่อนไปก่อน ดูหัวข้อ 10)

---

## 2. เปลี่ยนชื่อ / ชนิดข้อมูล

| # | เดิม | ใหม่ | หมายเหตุ |
|---|---|---|---|
| 2.1 | `grace_period_minutes` | `grace_minutes` | ทั้งใน `bars` (ย้ายตามข้อ 3.1) และ snapshot ใน `bookings` |
| 2.2 | `booking_lead_minutes` | `min_advance_minutes` | จองล่วงหน้าอย่างน้อยกี่นาที |
| 2.3 | `booking_horizon_days` | `max_advance_days` | จองล่วงหน้าได้สูงสุดกี่วัน |
| 2.4 | `bar_fees.calc = 'PERCENT'` | `'PERCENTAGE'` | ให้ตรงกับ enum `commission_calc` |

ชื่ออื่นคงเดิม: `pending_timeout_minutes`, `deposit_timeout_minutes`, `default_duration_minutes`, `avg_price_per_person`, `max_pax_per_booking`

**กฎตารางทั่วไป**

- 2.5 ตารางหลักต้องมี `id`, `created_at`, `updated_at` (`timestamptz`) พร้อม trigger อัปเดต `updated_at` อัตโนมัติ
- 2.6 ข้อยกเว้น: ตารางเชื่อมที่ PK คู่ (เช่น `bar_pr_counts`, `bar_styles`) และตาราง log (`bigint identity`) ไม่ต้องมีครบทุกคอลัมน์

---

## 3. โครงสร้างตาราง

### 3.1 แยก `bars` (ตอนนี้ ~40 คอลัมน์)

| ตารางใหม่ (1:1 กับ `bars.id`) | คอลัมน์ที่ย้ายมา |
|---|---|
| `bar_booking_settings` | `deposit_amount`, `deposit_unit`, `deposit_policy`, `refund_before_hours`, `grace_minutes`, `pending_timeout_minutes`, `deposit_timeout_minutes`, `max_pax_per_booking`, `min_advance_minutes`, `max_advance_days` |
| `bar_stats` | `avg_price_per_person`, `safety_score`, `current_stars`, `current_tier`, `is_new`, `rating_avg`, `rating_count`, `checkin_count`, `is_editor_pick` |
| `bar_live_status` | `current_crowd`, `crowd_updated_at` |

- 3.1.1 trigger `sync_bar_crowd` ให้เขียนที่ `bar_live_status`
- 3.1.2 ต้องมี trigger สร้างแถวของทั้ง 3 ตารางอัตโนมัติเมื่อสร้างร้าน (ตัวนับเริ่มที่ `0`)
- 3.1.3 `current_crowd` ที่ร้านยังไม่เคยอัปเดต = `null` (ห้าม default เป็น `AVAILABLE`)
- 3.1.4 **เปิด Realtime เฉพาะ `bar_live_status`** ห้ามเปิดที่ `bars`
- 3.1.5 view `bar_cards` / `bar_detail` join ให้ หน้าบ้านไม่ต้องรู้ว่าตารางถูกแยก

### 3.2 พิกัด (ระบบแผนที่)

- 3.2.1 เพิ่ม `bars.location geography(Point, 4326)` (generated จาก `lng`, `lat`)
- 3.2.2 สร้าง GiST index บน `location` · ลบ GiST เดิมบน lat/lng
- 3.2.3 function `nearby_bars(lat, lng, radius_m)` ใช้ `ST_DWithin` / `ST_Distance` (ดูหัวข้อ 5.4)

### 3.3 Composite FK (กัน parent ไม่ตรงกัน)

- 3.3.1 `tables` unique `(id, zone_id)` ← `bookings (table_id, zone_id)` อ้างถึง
- 3.3.2 `table_zones` unique `(id, bar_id)` ← `bookings (zone_id, bar_id)` อ้างถึง
- 3.3.3 `reviews.bar_id` ต้องตรงกับ `bookings.bar_id` ของ booking ที่รีวิว

### 3.4 อื่นๆ

- 3.4.1 สร้าง index บน FK column ทุกตัวที่ยังไม่มี
- 3.4.2 Extensions: `btree_gist`, `citext`, `pg_trgm`, `postgis`

---

## 4. คอลัมน์ที่ต้องเพิ่ม / แก้ constraint

| # | สิ่งที่ต้องทำ |
|---|---|
| 4.1 | `bookings.contact_phone text` (รูป E.164, ลบตาม retention) — ใช้ติดต่อเรื่องการจอง เก็บต่อการจอง ไม่ผูกกับ account |
| 4.2 | `checkins.actual_spend numeric(12,2)` nullable (ไว้คิดค่าคอมจากยอดจริงในอนาคต) |
| 4.3 | `users.phone_e164 text`, `users.phone_verified_at timestamptz` (nullable) + partial unique index `WHERE phone_e164 IS NOT NULL` — **สร้างคอลัมน์ไว้ ยังไม่บังคับกรอก** จะใช้เมื่อเปิด OTP |
| 4.4 | แก้ constraint ของ `deposits`: `settlement <> 'NONE'` ใช้ได้เฉพาะ `status = 'VERIFIED'` **ยกเว้น** `settlement = 'REFUND_PENDING'` ที่ใช้ได้ตอน `status = 'SUBMITTED'` ด้วย (ลูกค้ายกเลิก/ถูกปฏิเสธหลังโอนแล้วแต่ยังไม่ตรวจสลิป) และต้องเพิ่มทางเปลี่ยนสถานะ `DEPOSIT_SUBMITTED → CANCELLED_BY_CUSTOMER / REJECTED` ให้ตั้ง `REFUND_PENDING` |

---

## 5. สัญญา view / function สำหรับหน้าบ้าน

### 5.1 รายการ view

| view | ใช้ที่หน้า | ผู้เรียก |
|---|---|---|
| `bar_cards` | ลิสต์ร้าน, แผนที่, ranking | anon + authenticated |
| `bar_detail` | หน้ารายละเอียดร้าน | anon + authenticated |
| `public_reviews` | รีวิวในหน้าร้าน | anon + authenticated |
| `my_bars` | เจ้าของ/ทีมร้าน (เห็นทุกสถานะ) | authenticated |
| `my_bookings` | รายการจองของฉัน | authenticated |
| `booking_detail` | รายละเอียดการจอง | authenticated |
| `my_favorites` | ร้านโปรด | authenticated |

- 5.1.1 **ทุก view ตั้ง `security_invoker = true`**
- 5.1.2 view สาธารณะ (`bar_cards`, `bar_detail`, `public_reviews`) แสดงเฉพาะร้านสถานะ `APPROVED` และรีวิวที่ไม่ถูกซ่อน
- 5.1.3 `public_reviews` แสดงเฉพาะ `rating`, `comment`, `created_at`, `display_name` (+ media) **ห้ามเปิด email / birthdate**
- 5.1.4 ตารางเบื้องหลังต้องมี policy `SELECT` ให้ `anon` อ่านข้อมูลสาธารณะได้ ไม่งั้น view จะคืนแถวว่างโดยไม่มี error

### 5.2 กฎ "ไม่มีข้อมูล" (ใช้กับทุก view / function)

| ชนิด | ตัวอย่าง | ไม่มีข้อมูลให้เป็น |
|---|---|---|
| Array | `styles`, `hours`, `media`, `reviews` | `[]` |
| Object | `district`, `latest_review` | `null` |
| ตัวนับ | `rating_count`, `checkin_count`, `favorite_count` | `0` |
| ค่าเฉลี่ย / ข้อความ / วันที่ / enum | `rating_avg`, `phone`, `current_crowd` | `null` |
| **ข้อยกเว้น** `pr_counts` | มี 3 key ตายตัว | `{ "male": 0, "female": 0, "lgbtq": 0 }` |

- **ทุก key ต้องอยู่ในผลลัพธ์เสมอ** ห้ามให้ key หาย
- `rating_avg` ของร้านที่ไม่มีรีวิวเป็น `null` ไม่ใช่ `0`
- ห้ามใช้ค่าแทนที่ เช่น `""`, `"-"`, `[{}]`, `{}`
- array ต้องระบุ `ORDER BY` เสมอ (เช่น `hours` ตาม `day_of_week`, `media` ตาม `sort_order`)
- เวลาเปิด-ปิดส่งเป็นสตริง `"HH:MM"`
- คอลัมน์ jsonb ในตารางจริง: object default `null` (ห้าม `'{}'`), array default `'[]'`

**เขียน SQL ให้ถูก**

- `jsonb_agg` คืน `null` เมื่อไม่มีแถว ต้องครอบ `coalesce(..., '[]'::jsonb)`
- object จาก `LEFT JOIN` ต้องใช้ `case when x.id is null then null else jsonb_build_object(...) end` ไม่งั้นจะได้ object ที่ทุกฟิลด์เป็น null
- ใช้ `LEFT JOIN` กับตารางลูกเสมอ (INNER JOIN ทำให้ร้านที่ไม่มีข้อมูลลูกหายทั้งแถว)
- ใช้ lateral / scalar subquery แยกต่อ array (join หลายตารางลูกพร้อมกันแถวจะคูณกัน)

### 5.3 `pr_counts` และ `has_pr`

**หลังบ้านเก็บ enum ตัวพิมพ์ใหญ่ (`MALE` …) · JSON ที่หน้าบ้านได้รับใช้ key ตัวพิมพ์เล็ก** view เป็นตัวแปลง

```sql
-- ใน bar_cards / bar_detail
(select jsonb_build_object(
   'male',   coalesce(max(pr_count) filter (where gender = 'MALE'),   0),
   'female', coalesce(max(pr_count) filter (where gender = 'FEMALE'), 0),
   'lgbtq',  coalesce(max(pr_count) filter (where gender = 'LGBTQ'),  0)
 )
 from bar_pr_counts where bar_id = b.id) as pr_counts,

exists (select 1 from bar_pr_counts where bar_id = b.id) as has_pr
```

aggregate ที่ไม่มี `group by` คืนหนึ่งแถวเสมอ จึงได้ศูนย์ครบโดยไม่ต้อง `case when`

ตัวอย่าง JSON:

```json
{ "slug": "sky-bar",      "has_pr": true,  "pr_counts": { "male": 0, "female": 5, "lgbtq": 0 } }
{ "slug": "moon-pub",     "has_pr": true,  "pr_counts": { "male": 3, "female": 4, "lgbtq": 2 } }
{ "slug": "quiet-corner", "has_pr": false, "pr_counts": { "male": 0, "female": 0, "lgbtq": 0 } }
```

ข้อควรรู้สำหรับหน้าบ้าน: key ใน `pr_counts` เป็นตัวเล็ก แต่ค่าที่ส่งตอนจอง (`request_pr`) และตัวกรองค้นหา (`pr_gender`) เป็น enum ตัวใหญ่ (`'FEMALE'`) ต้องแปลงด้วย `.toUpperCase()` ตอนส่ง

### 5.4 ตัวอย่างผลลัพธ์ `bar_detail` (ร้านที่ข้อมูลครบ)

```json
{
  "id": "b1a2c3d4-0000-4000-8000-000000000001",
  "slug": "sky-bar",
  "name": "Sky Bar",
  "category": "PUB_BAR",
  "description": null,
  "address": "…",
  "lat": 13.7308,
  "lng": 100.5836,
  "phone": null,
  "cover_image_url": null,
  "district": { "id": "…", "slug": "thonglor", "name_th": "ทองหล่อ" },
  "styles": ["ROOFTOP", "LIVE_MUSIC"],
  "hours": [{ "day_of_week": 5, "open_time": "18:00", "close_time": "02:00" }],
  "media": [],
  "links": [],
  "has_pr": true,
  "pr_counts": { "male": 0, "female": 5, "lgbtq": 0 },
  "current_stars": 4,
  "current_tier": "A",
  "is_new": false,
  "rating_avg": 4.6,
  "rating_count": 128,
  "checkin_count": 340,
  "avg_price_per_person": 850.00,
  "safety_score": 82,
  "current_crowd": "ALMOST_FULL",
  "crowd_updated_at": "2026-10-03T20:15:00+07:00",
  "is_editor_pick": false
}
```

ร้านใหม่ที่ว่างที่สุดต้องได้ key ชุดเดียวกัน: `styles/hours/media/links = []`, `district = null` ถ้าไม่มี, `rating_count/checkin_count = 0`, `rating_avg/current_crowd/current_stars = null`, `pr_counts` = 0 ทั้ง 3 ค่า, `has_pr = false`

### 5.5 Function (RPC)

- `nearby_bars(lat, lng, radius_m)` → คืนรูปแบบเดียวกับ `bar_cards` + `distance_m`
- `search_bars(keyword, district_id, category, style_ids, pr_gender, limit, offset)` → รูปแบบ `bar_cards`
- ประกาศ return เป็น `returns table (...)` หรือ composite type ที่ชัดเจน (ไม่ใช้ `jsonb` เปล่า) เพื่อให้ได้ type ที่แม่น
- ลิสต์ใหญ่ต้องแบ่งหน้าได้ (`limit`/`offset` หรือ cursor) และมี index รองรับ `ORDER BY`

---

## 6. ความปลอดภัย

| # | สิ่งที่ต้องทำ |
|---|---|
| 6.1 | function `SECURITY DEFINER` (`get_share_card`, `zone_remaining_pax` ฯลฯ) ต้อง `set search_path = ''` |
| 6.2 | trigger `on_auth_user_created` ตั้ง `role = 'CUSTOMER'` เสมอ **ห้ามอ่าน `role` จาก `raw_user_meta_data`** และ policy ห้ามอิง `user_metadata` |
| 6.3 | ให้หน้าบ้านเช็กอายุ 20+ ก่อนเรียก `signUp()` (trigger `check_user_age` ที่ raise error จะได้แค่ "Database error saving new user") |
| 6.4 | สิทธิ์ระดับร้านอิง `bar_staff` เท่านั้น ไม่ใช้ `users.role = 'STAFF'` |
| 6.5 | Realtime เปิดเฉพาะ `bar_live_status` |
| 6.6 | เลขบัญชี `bar_payout_accounts.account_no_enc`: ตัดสินใจวิธีเข้ารหัสก่อนสร้าง — Supabase Vault (เช็กสถานะล่าสุดของ pgsodium ในเอกสาร Supabase) หรือเข้ารหัสฝั่ง NestJS ด้วย key จาก KMS |
| 6.7 | เบอร์โทรลูกค้า (`contact_phone`) ร้านเห็นได้เฉพาะการจองสถานะ `CONFIRMED` ของร้านตัวเอง ผ่าน NestJS ไม่ผ่าน RLS อ่านตรง และต้องมี consent ใน `user_consents` |

---

## 7. ตรวจในไฟล์ SQL เดิม (ยืนยันว่าถูก ถ้าไม่ถูกให้แก้)

| # | ตรวจอะไร |
|---|---|
| 7.1 | exclusion constraint `bookings_no_table_overlap` ต้องครอบคลุมสถานะ `PENDING`, `AWAITING_DEPOSIT`, `DEPOSIT_SUBMITTED`, `CONFIRMED`, `CHECKED_IN` (ไม่งั้นมีช่วงจองซ้อนได้) |
| 7.2 | `zone_remaining_pax` ต้องนับทั้งการจองที่ระบุโต๊ะและไม่ระบุโต๊ะในโซนเดียวกัน |
| 7.3 | composite FK ตามข้อ 3.3 มีครบหรือยัง |
| 7.4 | `booking_transition_allowed()` ใน DB ตรงกับ `BOOKING_TRANSITIONS` ใน `packages/types` |

---

## 8. Seed, Storage, Job

**Seed** (`supabase/seed.sql`)

- `districts`, `styles`, `safety_features` (10 ข้อ น้ำหนักรวม 100), `platform_settings`, `legal_documents` (Terms/Privacy/Cookie ที่ `is_current`)

**Storage buckets**

| bucket | การเข้าถึง |
|---|---|
| `bar-media` | public read · เขียนเฉพาะทีมร้าน |
| `review-media` | public read (เฉพาะรีวิวที่ไม่ถูกซ่อน) · เขียนเฉพาะเจ้าของรีวิว |
| `deposit-slips` | private · ลูกค้าเจ้าของ + แอดมิน · ร้านห้ามอ่าน |
| `bar-verifications` | private · ทีมร้านเจ้าของ + แอดมิน |
| `payout-slips` | private · ร้านเจ้าของ + แอดมิน |
| `promo-slips` | private · ร้านเจ้าของ + แอดมิน |

**Job**

- 8.1 job anonymize บัญชีที่ `users.deleted_at` เลย retention (PDPA)
- 8.2 เลือกตัวรัน job: `pg_cron` หรือให้ NestJS เรียก `/jobs/*` (มีงานทุกนาที: no-show, expire, complete, ส่งแจ้งเตือน)

---

## 9. ลำดับสร้าง (migration) และการเทสต์

**แตก migration ตามโดเมน แทน `init.sql` ก้อนเดียว** — สร้างครบทุกตารางตาม `DATABASE.md` แต่แบ่งลำดับเป็น 2 เฟส

**เฟส 1 (แกนที่หน้าบ้านต้องใช้)**

1. extensions + enums (รวม `pr_gender`)
2. users, user_preferences, user_consents, legal_documents, notifications (3 ตาราง)
3. master: districts, styles, safety_features, platform_settings + seed
4. bars + bar_booking_settings + bar_stats + bar_live_status + bar_pr_counts + ตารางลูกของร้าน
5. เมนู & ราคา: menu_*, bar_fees, price_packages, bar_promotions
6. โต๊ะ & การจอง: table_zones, tables, bookings, snapshots, history, qr_tokens, checkins
7. reviews (4 ตาราง), favorites
8. view + function (หัวข้อ 5) + RLS + storage buckets

**เฟส 2 (สร้างตามหลังได้)**

9. deposits, bar_payouts, bar_credit_ledger — **draft** จนกว่าจะได้คำตอบเรื่องกฎหมายการรับเงินแทนร้าน (หัวข้อ 10)
10. booking_shares, booking_share_joins, safety_reports, crowd_status_logs
11. tier_scores, editor_picks
12. promotion_packages, promoted_listings, payments, stats
13. commission_rules, billing_events, invoices
14. audit_logs, job_runs (ควรสร้างตั้งแต่เฟส 1 ถ้ามี action ของแอดมินแล้ว)

**เทสต์ (รันบน `supabase start` ด้วย role จริง)**

- 9.1 ทุก view: ยิงด้วย `anon` และ `authenticated` ต้องได้ข้อมูลสาธารณะตามสิทธิ์ (ถ้าลืม policy view จะคืนแถวว่างโดยไม่มี error)
- 9.2 **เทสต์ RLS:** anon อ่านการจอง/สลิป/เบอร์ของคนอื่นไม่ได้ · ร้านอ่านสลิปมัดจำไม่ได้ · ลูกค้าแก้สถานะ booking เองไม่ได้ · ผู้ใช้อ่าน `birthdate`/`email` ของคนอื่นไม่ได้
- 9.3 **ร้านที่ว่างที่สุด** (ไม่มีสไตล์ รูป รีวิว PR เวลาเปิด): key ครบ, array = `[]`, ตัวนับ = `0`, `pr_counts` = 0 ทั้ง 3 ค่า, `has_pr = false`, ที่เหลือ `null`
- 9.4 `pr_counts` ร้านที่มี PR เพศเดียว ต้องได้อีกสองเพศเป็น `0`
- 9.5 ทดสอบซ้ำเทสต์เดิมใน `DATABASE.md` หัวข้อ 7 (จองซ้อน, สลิปซ้ำ, transition ข้ามขั้น ฯลฯ)
- 9.6 เทสต์จองพร้อมกันหลาย request (โซนไม่ระบุโต๊ะ)
- 9.7 สร้าง `database.ts` ด้วย `supabase gen types typescript` (ไม่เขียนมือ) แล้ว override ฟิลด์ jsonb/nullable ของ view (`BarCard`, `BarDetail` ฯลฯ) ให้เป็นชนิดจริงไว้ที่ไฟล์เดียว

---

## 10. เลื่อน / รอตัดสินใจ

| # | เรื่อง | สถานะ |
|---|---|---|
| 10.1 | `bar_prs` (รายชื่อ PR รายคน / โควตารายคืน) | เลื่อน — เพิ่มเมื่อหน้าบ้านมีฟีเจอร์ |
| 10.2 | `bar_votes` (โหวตร้านในหน้า `/ranking`) | เลื่อน — ตอนนี้ใช้ `checkin_count`/`review_count` |
| 10.3 | ถือเงินมัดจำแทนร้าน (เข้า PromptPay ของ NightOut) ตามกฎหมายระบบการชำระเงิน | **ต้องปรึกษาที่ปรึกษากฎหมายก่อนสร้างส่วนเงินจริง** และอัปเดต PROMPT.md ให้ตรง |
| 10.4 | ทุกการจองต้องมัดจำไหม (schema รองรับ `deposit_amount = 0`) | รอตัดสินใจ |
| 10.5 | ใครยืนยันการจองที่ไม่มีมัดจำ (ร้าน หรืออัตโนมัติ) | รอตัดสินใจ |
| 10.6 | หักค่าคอมจากยอดโอนมัดจำ หรือออก invoice แยก | รอตัดสินใจ |
| 10.7 | ค่าคอมคิดจาก price snapshot (ยอดประเมิน) ไม่ใช่ยอดบิลจริง อาจถูกโต้แย้ง | รอตัดสินใจ (ใช้ `actual_spend` ข้อ 4.2 ในอนาคต) |
| 10.8 | ตัวอย่าง "โปรเบียร์ก่อน 2 ทุ่ม" ใน SITEMAP ขัดนโยบายถ้อยคำ/กฎหมายแอลกอฮอล์ ควรแก้เป็นโปรที่ไม่ใช่แอลกอฮอล์ · การแสดงรายการ/ราคาแอลกอฮอล์ใน `menu_items` / `price_packages` ควรปรึกษาผู้เชี่ยวชาญกฎหมายด้วย | รอตัดสินใจ |
| 10.9 | ชื่อ key ที่หน้าบ้านใช้จริง (ตอนนี้ยึดตามหลังบ้าน) ถ้าหน้าบ้านที่ทำเสร็จแล้วใช้ชื่อต่างจาก view ต้องเทียบและปรับทีละหน้า | ตรวจก่อนเชื่อมต่อ |

---

## Checklist ก่อนถือว่าเสร็จ

- [ ] ทุกข้อในหัวข้อ 1–4 แก้ในไฟล์ SQL แล้ว และ types/trigger/view/policy ตรงกัน
- [ ] view ทั้ง 7 ตัว + `nearby_bars` + `search_bars` สร้างแล้ว ตั้ง `security_invoker = true`
- [ ] เทสต์ 9.1–9.6 ผ่านบน `supabase start`
- [ ] `database.ts` มาจาก `supabase gen types` และมี override ของ view
- [ ] seed + storage buckets + policy ครบ
- [ ] ข้อ 10.3 ได้คำตอบก่อนเปิดใช้ส่วนเงินมัดจำจริง
