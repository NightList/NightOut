## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setBookingStatus` · `useTableOptions` · `moveBooking` · `refundDeposit` (`POST /merchant/bookings/:id/status` · `GET /merchant/bars/:barId/bookings/:bookingId/table-options` · `POST /merchant/bookings/:id/move` · `POST /merchant/bookings/:id/refund`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- ย้ายปุ่มจัดการลงใน Drawer และจัดรายละเอียดเป็นคอลัมน์เดียวบนมือถือ
