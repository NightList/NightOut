# homeContent — ประวัติการแก้ไข

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `useHomeContent` · `useHomeCategories` · `useHomePopular` · `useBars` · `homeContentAction` · `homeCategoryAction` · `homePopularAction` — ชื่อ view / path / body ของหน้านี้ย้ายมาอยู่ที่เดียว (เดิมเขียนในหน้าผ่าน `useAdminView('admin_x', …)` / `act.mutate({ method, path, body })`) · body มี type จาก `@nightout/contracts`
- หน้า / form / modal ของโมดูลเรียกผ่าน `./api` · พฤติกรรมเดิม (query key, ข้อความแจ้งผล, invalidate `['admin']`)

## 2026-10-08 — จัดการร้านยอดนิยม + แยกหัวข้อ section ออกจาก Hero
- เพิ่ม Card "ร้านยอดนิยม": หัวข้อ section + ปักร้าน (เฉพาะร้านที่อนุมัติ) สูงสุด 8 ร้าน เรียงขึ้น/ลง เอาออกได้ · ร้านที่ปักแต่ถูกระงับแล้วขึ้นป้ายเตือนและต้องเอาออกก่อนบันทึก · บันทึกด้วย `PUT /admin/home-popular`
- ฟอร์ม Hero เหลือเฉพาะ field ของ Hero · หัวข้อ section (บรรทัดเล็ก + ชื่อ) ย้ายไปอยู่ใน Card ของ section นั้นและบันทึกแยก (`form/sectionHeadingForm.tsx` ใช้ร่วมกันทั้งการ์ดหมวดและร้านยอดนิยม)
- เรียง Card ตามลำดับบนเว็บ: Hero → การ์ดหมวด → ร้านยอดนิยม
- ไฟล์: `page.tsx`, `form/heroForm.tsx`, `form/sectionHeadingForm.tsx` (ใหม่), `form/popularCard.tsx` (ใหม่)

## 2026-10-08 — เอาไอคอนหมวดออกจากหลังบ้าน
- หน้าแรกของเว็บลูกค้าไม่แสดงไอคอนหมวดแล้ว จึงเอาช่องเลือก "ไอคอน" ออกจากฟอร์มแก้การ์ด และเอาไอคอนออกจากตัวอย่างการ์ดในหน้านี้
- ฟอร์มไม่ส่ง `icon` แล้ว — ลบออกจาก DB/API ในงานเดียวกัน (migration `20261008000100_site_content_drop_category_icon`)
- ไฟล์: `page.tsx`, `form/categoryDrawer.tsx`
