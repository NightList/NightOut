# CHANGELOG — @nightout/types

## 2026-10-08 — site-team: ฟังก์ชัน team_member_is_own
- `database.generated.ts`: รัน `db:types` หลัง `db:push` migration `20261008000200_site_team_super_admin_rules` → เพิ่ม `team_member_is_own` ใน Functions

## 2026-10-08 — ลบ home_categories.icon
- `database.generated.ts`: ตัด `icon` ออกจาก `home_categories`, `admin_home_categories`, `public_home_categories` ให้ตรงกับ migration `20261008000100_site_content_drop_category_icon` (แก้มือ — รัน `db:types` ซ้ำหลัง `db:push` ได้ผลเท่ากัน)
