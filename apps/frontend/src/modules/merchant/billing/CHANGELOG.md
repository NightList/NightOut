## 2026-10-10 — Bento ตาม Merchant 1i Store/Growth
- ซ้าย = การ์ดเดือน (ยอด + สถานะ สะสมอยู่/รอชำระ/ชำระแล้ว) กดเลือกเดือน · ขวา = billing events ของเดือนนั้น · ค้างชำระบนหัวหน้า
- มือถือ: การ์ดเดือนเลื่อนแนวนอน + รายการ
- ไฟล์หลัก: `page.tsx`

# CHANGELOG — frontend/modules/merchant/billing

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `useBillingEvents` (`GET /merchant/bars/:barId/billing-events`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)
