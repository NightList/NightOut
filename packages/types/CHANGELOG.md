# CHANGELOG — @nightout/types

## 2026-10-08 — ตัด is_editor_pick
- ลบ `is_editor_pick` จาก `BarCardNonNull` / `AdminBar` · แก้ `database.generated.ts` ด้วยมือให้ตรง migration `20261008000400_bar_drop_editor_pick` (ไม่มีตาราง `editor_picks` / คอลัมน์ `is_editor_pick` / rpc `admin_set_editor_pick` · `admin_bars.promoted_until`) — รัน `db:types` หลัง `db:push`
- ไฟล์: `src/database.ts`, `src/database.generated.ts`

## 2026-10-08 — ร้านยอดนิยมหน้าแรก
- เพิ่ม `Db.AdminHomePopular` · แก้ `database.generated.ts` ด้วยมือให้ตรง migration `20261008000300_site_content_home_popular` (`home_popular_bars`, `popular_*` ใน `home_content`, view `public_home_popular` / `admin_home_popular`, rpc `admin_save_home_popular`) — รัน `db:types` หลัง `db:push` เพื่อ generate ทับ
- ไฟล์: `src/database.ts`, `src/database.generated.ts`

## 2026-10-08 — site-team: ฟังก์ชัน team_member_is_own
- `database.generated.ts`: รัน `db:types` หลัง `db:push` migration `20261008000200_site_team_super_admin_rules` → เพิ่ม `team_member_is_own` ใน Functions

## 2026-10-08 — ลบ home_categories.icon
- `database.generated.ts`: ตัด `icon` ออกจาก `home_categories`, `admin_home_categories`, `public_home_categories` ให้ตรงกับ migration `20261008000100_site_content_drop_category_icon` (แก้มือ — รัน `db:types` ซ้ำหลัง `db:push` ได้ผลเท่ากัน)
