# CHANGELOG — @nightout/contracts

## 2026-10-08 — site-team: สิทธิ์จัดการทีมงาน
- เพิ่มรหัส error `TEAM_MEMBER_NOT_OWN` (แอดมินแก้แถวของคนอื่น) และ `TEAM_MEMBER_EMAIL_LOCKED` (แอดมินเปลี่ยนอีเมลของแถวตัวเอง) ใน `SITE_TEAM_ERRORS` + เทสต์ · คู่กับ migration `20261008000200_site_team_super_admin_rules`
- ไฟล์: `src/site-team.ts`, `src/contracts.test.ts`

## 2026-10-08 — site-content: ลบไอคอนการ์ดหมวด
- ลบ `HOME_CATEGORY_ICON_KEYS` / `HomeCategoryIcon` · ตัด `icon` ออกจาก `UpdateHomeCategoryBody` และ `HomeCategory` (คู่กับ migration `20261008000100_site_content_drop_category_icon`)
- ไฟล์: `src/site-content.ts`, `src/contracts.test.ts`
