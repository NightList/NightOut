# site-content — ประวัติการแก้ไข

## 2026-10-08 — ลบไอคอนของการ์ดหมวดหน้าแรก
- หน้าแรกและ Backoffice ไม่ใช้ไอคอนหมวดแล้ว จึงลบคอลัมน์ `home_categories.icon` ออกจาก DB
- migration ใหม่ `20261008000100_site_content_drop_category_icon.sql`: drop คอลัมน์ · สร้าง view `public_home_categories` / `admin_home_categories` ใหม่ (สิทธิ์เดิม) · `home_category_check` / `admin_save_home_category` ไม่ตรวจ/ไม่เขียน icon
- `GET /public/home` ไม่ส่ง `icon` ใน `categories` แล้ว · `PATCH /admin/home-categories/:slot` ไม่รับ `icon`
- ไฟล์: `site-content.public.controller.ts`
