## 2026-10-10 — Bento ตาม Merchant 1i Store/Growth
- Bento 2×2: มัดจำ · บัญชีรับเงิน (การ์ดบัญชีปัจจุบัน + ปุ่ม "เปลี่ยน") · Grace period แบบปุ่มเลือก · PR ปุ่ม −/+ (ชาย/หญิง/LGBTQ+) · ปุ่มบันทึกบนหัวหน้า
- ไฟล์หลัก: `page.tsx`

# CHANGELOG — frontend/modules/merchant/settings

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `updateBookingSettings` · `setPayoutAccount` (`PATCH /merchant/bars/:barId/booking-settings` · `PUT /merchant/bars/:barId/payout-account`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)
