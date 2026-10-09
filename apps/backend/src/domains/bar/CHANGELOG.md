# bar — ประวัติการแก้ไข

## 2026-10-08 — ตัด Editor's Pick
- ลบ endpoint `PATCH /admin/bars/:id/editor-pick` และ `SetEditorPickDto`
- migration ใหม่ `20261008000400_bar_drop_editor_pick.sql`: ลบ `bar_stats.is_editor_pick` · ตาราง `editor_picks` · `admin_set_editor_pick` · drop + สร้างใหม่ `bar_cards`, `bar_detail`, `my_favorites`, `search_bars`, `nearby_bars`, `my_bar_detail`, `admin_bars` (สิทธิ์เดิม) · `admin_bars` + `promoted_until`
- seed: `scripts/seed-from-mock.ts` + `supabase/seed.sql` ไม่เขียน editor pick แล้ว
- ไฟล์: `bar.admin.controller.ts`, `bar.dto.ts`, `bar.module.ts`
