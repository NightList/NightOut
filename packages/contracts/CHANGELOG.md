# CHANGELOG — @nightout/contracts

## 2026-10-09 — รูปแบบคำตอบกลาง ApiResponse
- เพิ่ม `ApiResponse<T>` = `{ status: 'ok' | 'no', status_code, data, code, err_msg }` (รูปแบบคำตอบของทุก endpoint) + `errorMessageOf(code)` (รหัส → ข้อความไทย ใช้ใน backend)
- รหัสใหม่ใน `COMMON_ERRORS`: `VALIDATION_FAILED` · `TOO_MANY_REQUESTS` · `INTERNAL_ERROR` · เทสต์ `errorMessageOf`
- ไฟล์: `src/common.ts`, `src/errors.ts`, `src/contracts.test.ts`

## 2026-10-08 — bar: ตัด Editor's Pick
- ลบ `SetEditorPickBody` (endpoint `PATCH /admin/bars/:id/editor-pick` ถูกลบ · migration `20261008000400_bar_drop_editor_pick`)
- ไฟล์: `src/bar.ts`

## 2026-10-08 — site-content: ร้านยอดนิยมหน้าแรก
- เพิ่ม `HOME_POPULAR_MAX` · `UpdateHomePopularBody` / `UpdateHomePopularResult` · `PublicHomeResult.popular_bar_ids` · `HomeContent` + `UpdateHomeContentBody` มี `popular_eyebrow` / `popular_title` · error `INVALID_HOME_POPULAR` / `HOME_POPULAR_BAR_NOT_FOUND` · `ADMIN_VIEWS` + `admin_home_popular` + เทสต์ (คู่กับ migration `20261008000300_site_content_home_popular`)
- ไฟล์: `src/site-content.ts`, `src/backoffice.ts`, `src/contracts.test.ts`

## 2026-10-08 — site-team: สิทธิ์จัดการทีมงาน
- เพิ่มรหัส error `TEAM_MEMBER_NOT_OWN` (แอดมินแก้แถวของคนอื่น) และ `TEAM_MEMBER_EMAIL_LOCKED` (แอดมินเปลี่ยนอีเมลของแถวตัวเอง) ใน `SITE_TEAM_ERRORS` + เทสต์ · คู่กับ migration `20261008000200_site_team_super_admin_rules`
- ไฟล์: `src/site-team.ts`, `src/contracts.test.ts`

## 2026-10-08 — site-content: ลบไอคอนการ์ดหมวด
- ลบ `HOME_CATEGORY_ICON_KEYS` / `HomeCategoryIcon` · ตัด `icon` ออกจาก `UpdateHomeCategoryBody` และ `HomeCategory` (คู่กับ migration `20261008000100_site_content_drop_category_icon`)
- ไฟล์: `src/site-content.ts`, `src/contracts.test.ts`
