# merchant/promote — ประวัติการแก้ไข

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `orderPromotion` — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — แก้คำ "เปิดแสดง" เป็น "แสดงบนเว็บ"
- ข้อความเงื่อนไขการซื้อโปรโมทใช้คำเดียวกับ Backoffice ("แสดง")
- ไฟล์: `page.tsx`
