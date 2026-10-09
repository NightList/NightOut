# bars — ประวัติการแก้ไข

## 2026-10-09 — ปุ่มรูปร้าน
- คอลัมน์ท้ายตารางมีปุ่ม "รูปร้าน" → `/bar-media?bar=<id>` เปิดรูปของร้านนั้นเลย
- ไฟล์: `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `useBars` · `barStatusAction` — ชื่อ view / path / body ของหน้านี้ย้ายมาอยู่ที่เดียว (เดิมเขียนในหน้าผ่าน `useAdminView('admin_x', …)` / `act.mutate({ method, path, body })`) · body มี type จาก `@nightout/contracts`
- หน้า / form / modal ของโมดูลเรียกผ่าน `./api` · พฤติกรรมเดิม (query key, ข้อความแจ้งผล, invalidate `['admin']`)

## 2026-10-08 — ตัด Editor's Pick · สวิตช์ "แสดง" · ป้ายแนะนำดูอย่างเดียว
- เอาคอลัมน์ Editor's Pick ออก (ฟีเจอร์ถูกตัดทั้งโปรเจกต์)
- ปุ่ม "ระงับ" / "เปิดใช้งาน" รวมเป็นสวิตช์ "แสดง" (`components/showSwitch.tsx`): เปิด = APPROVED · ปิด = SUSPENDED ต้องใส่เหตุผลก่อน · ร้านร่าง/รอตรวจ/ไม่อนุมัติไม่มีสวิตช์ (จัดการที่ /merchants)
- ร้านที่กำลังโปรโมทขึ้นป้าย "แนะนำ ถึง <วันหมด>" ข้างชื่อ (ดูอย่างเดียว · กดไป /promotions) จาก `admin_bars.promoted_until`
- แก้ดาวในคอลัมน์ "ดาว" เรียงแนวตั้งและไม่มีสีทอง: `@source` ใน `src/styles/index.css` ชี้ path ผิด (ขาด ../ หนึ่งชั้น) Tailwind เลยไม่สร้าง class ของ `packages/ui` — กระทบทุกคอมโพเนนต์จาก @nightout/ui ในหลังบ้าน (หน้า /ranking ด้วย)
- คอลัมน์ "ดาว" แสดงเป็นตัวเลข + ดาวดวงเดียว (เช่น 4 ★) แทนดาว 5 ดวง · เรียงตามดาวได้
- ไฟล์: `page.tsx`, `components/showSwitch.tsx` (ใหม่) · ป้ายสถานะ APPROVED เปลี่ยนเป็น "แสดง" ใน `ui/utils/labels.ts` · เพิ่ม `date()` ใน `ui/utils/format.ts`
