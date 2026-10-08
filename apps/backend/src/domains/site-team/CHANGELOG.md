# CHANGELOG — site-team (ทีมงานหน้า /about)

## 2026-10-08 — สิทธิ์จัดการทีมงาน: Super Admin / Admin เฉพาะแถวตัวเอง
- `POST /admin/team-members` · `DELETE /admin/team-members/:id` · `PUT /admin/team-members/order` ใส่ `SuperAdminGuard` → แอดมินทั่วไปได้ 403 `SUPER_ADMIN_REQUIRED`
- `PATCH /admin/team-members/:id`: Super Admin แก้ได้ทุกแถว · Admin ได้เฉพาะแถวที่ `contacts.email` ตรงกับอีเมลบัญชีตัวเอง (403 `TEAM_MEMBER_NOT_OWN`) และเปลี่ยน/ลบอีเมลนั้นไม่ได้ (403 `TEAM_MEMBER_EMAIL_LOCKED`) — ตรวจใน DB
- migration `20261008000200_site_team_super_admin_rules.sql`: ฟังก์ชันใหม่ `team_member_is_own` · `admin_save_team_member` (เพิ่ม = `super_admin_assert` · แก้ = เช็กเจ้าของแถว) · `admin_delete_team_member` / `admin_reorder_team_members` เพิ่ม `super_admin_assert`
- ไฟล์: `site-team.admin.controller.ts`
