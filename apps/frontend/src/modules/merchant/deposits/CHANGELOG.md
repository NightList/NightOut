## 2026-10-10 — Bento ตาม Merchant 1i Sitemap
- การ์ดสรุป 4 ใบมีไอคอน (ถือไว้ · รอโอนเข้าร้าน · โอนแล้วเดือนนี้ + บัญชีรับเงิน · เครดิต) · ตารางในการ์ด + ชิปกรอง + คอลัมน์สถานะการจอง (จาก store) · ปุ่ม "ส่งออก CSV" (แถวที่กรองอยู่ · มี BOM ให้ Excel อ่านไทย)
- มือถือ: การ์ดถือไว้ใหญ่ + 3 ใบเล็ก + รายการ
- ไฟล์หลัก: `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `useBarLedger` (`GET /merchant/bars/:barId/deposit-ledger`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- การ์ดยอดมัดจำเรียงคอลัมน์เดียวบนมือถือ
