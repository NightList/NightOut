## 2026-10-10 — Bento ตาม Merchant 1i Store/Growth
- การ์ดโปรละใบ (เปิดอยู่ = พื้นทอง) + สวิตช์ + Cutoff/วัน + "ใช้แล้ว N ครั้งใน 30 วัน" (นับจากการจองที่เลือกโปร)
- การ์ดค่าธรรมเนียม SC/VAT/ค่าเข้า พร้อมตัวอย่างคำนวณสด (`estimatePrice`) · การ์ดข้อกำหนดห้ามโปรเครื่องดื่มแอลกอฮอล์
- ไฟล์หลัก: `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setBarPromotions` · `setFees` (`PUT /merchant/bars/:barId/promotions` · `PUT /merchant/bars/:barId/fees`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- ตารางโปรโมชันเลื่อนแนวนอนในกรอบเพื่อคงปุ่มเปิดใช้และลบ
