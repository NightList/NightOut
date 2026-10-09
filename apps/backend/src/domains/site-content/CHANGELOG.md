# site-content — ประวัติการแก้ไข

## 2026-10-08 — ร้านยอดนิยมหน้าแรก
- migration ใหม่ `20261008000300_site_content_home_popular.sql`: `home_content` + `popular_eyebrow` / `popular_title` · ตาราง `home_popular_bars` · view `public_home_popular` (เฉพาะร้าน APPROVED) / `admin_home_popular` · rpc `admin_save_home_popular` · `admin_save_home_content` / `home_content_check` ตัวใหม่
- endpoint ใหม่ `PUT /admin/home-popular` `{bar_ids}` (สูงสุด 8 · ไม่ซ้ำ · แทนที่ทั้งรายการ · audit log)
- `GET /public/home` ส่ง `popular_bar_ids` และ `content.popular_eyebrow` / `popular_title` เพิ่ม
- ไฟล์: `site-content.admin.controller.ts`, `site-content.public.controller.ts`, `site-content.dto.ts`

## 2026-10-08 — ลบไอคอนของการ์ดหมวดหน้าแรก
- หน้าแรกและ Backoffice ไม่ใช้ไอคอนหมวดแล้ว จึงลบคอลัมน์ `home_categories.icon` ออกจาก DB
- migration ใหม่ `20261008000100_site_content_drop_category_icon.sql`: drop คอลัมน์ · สร้าง view `public_home_categories` / `admin_home_categories` ใหม่ (สิทธิ์เดิม) · `home_category_check` / `admin_save_home_category` ไม่ตรวจ/ไม่เขียน icon
- `GET /public/home` ไม่ส่ง `icon` ใน `categories` แล้ว · `PATCH /admin/home-categories/:slot` ไม่รับ `icon`
- ไฟล์: `site-content.public.controller.ts`
