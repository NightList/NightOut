## 2026-10-09 — สร้างหน้ารูปร้าน (`/bar-media`)
- ตารางทุกร้าน: รูปปก · จำนวนรูปแกลเลอรี/รูปเมนู · กรอง ทั้งหมด / ยังไม่มีปก / มีรูปแล้ว · ค้นหาชื่อร้าน
- Drawer ของร้าน (`?bar=<id>` ลิงก์ตรงได้): ปก + แกลเลอรี (อัปโหลดแทนร้าน · ตั้งเป็นปก · ลบรูปไม่เหมาะสม) และรูปเมนูทีละรายการ (เพิ่ม/เปลี่ยน/ลบ) · ลิงก์ "ดูหน้าร้าน" · ทุกการกระทำลง audit log และแจ้งทีมร้าน · Admin กับ Super Admin สิทธิ์เท่ากัน
- endpoint: `PUT /admin/bars/:id/media` (`admin_set_bar_media`) · `PUT /admin/menu-items/:id/image` (`admin_set_menu_item_image`) · อ่าน view `admin_bar_media` (migration `20261009000100_bar_media_images`)
- ไฟล์: `page.tsx` · `components/barMediaDrawer.tsx` · `api.ts` · `utils/media.ts` · route ใน `router/index.tsx` + เมนู `configs/menu.tsx` · `AdminViewRows` ใน `services/api/backoffice.ts`

