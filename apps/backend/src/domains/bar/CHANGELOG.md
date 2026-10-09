# bar — ประวัติการแก้ไข

## 2026-10-09 — รูปร้าน + รูปเมนู
- endpoint ใหม่: `PUT /merchant/bars/:barId/media` (`app_set_bar_media`) · `PUT /admin/bars/:id/media` (`admin_set_bar_media`) · `PUT /admin/menu-items/:id/image` (`admin_set_menu_item_image`) · `PUT …/menu` รับ `image_path` ต่อรายการ
- `BarMediaService` (ใหม่): สร้าง URL public ของรูปปก (DB ไม่รู้โดเมน Storage) · หลังเขียนลบไฟล์ใน `removed_paths` ออกจาก bucket `bar-media` แล้วไม่ส่ง `removed_paths` กลับหน้าเว็บ
- migration `20261009000100_bar_media_images`: storage policy แอดมินเขียน `bar-media` · `bar_media_path_ok` / `bar_media_unused` / `bar_media_save` / `menu_image_check` · `app_set_menu` ตัวใหม่ · `my_bar_detail` + `media` · view `admin_bar_media`
- `SupabaseService.removeObjects` (ลบไฟล์ด้วย service_role · ล้มไม่ทำให้งานหลักล้ม) · `publicUrl` ใช้ `storagePublicUrl` จาก `@nightout/utils`
- ไฟล์: `bar-media.service.ts` · `bar.merchant.controller.ts` · `bar.admin.controller.ts` · `bar.dto.ts` · `bar.module.ts` · `supabase/supabase.service.ts` · เทสต์ใน `test/app.test.ts`

## 2026-10-08 — ตัด Editor's Pick
- ลบ endpoint `PATCH /admin/bars/:id/editor-pick` และ `SetEditorPickDto`
- migration ใหม่ `20261008000400_bar_drop_editor_pick.sql`: ลบ `bar_stats.is_editor_pick` · ตาราง `editor_picks` · `admin_set_editor_pick` · drop + สร้างใหม่ `bar_cards`, `bar_detail`, `my_favorites`, `search_bars`, `nearby_bars`, `my_bar_detail`, `admin_bars` (สิทธิ์เดิม) · `admin_bars` + `promoted_until`
- seed: `scripts/seed-from-mock.ts` + `supabase/seed.sql` ไม่เขียน editor pick แล้ว
- ไฟล์: `bar.admin.controller.ts`, `bar.dto.ts`, `bar.module.ts`
