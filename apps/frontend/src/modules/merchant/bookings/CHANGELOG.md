## 2026-10-10 — ตาม Merchant 1i Sitemap: ปฏิทิน + สรุปวัน + ตาราง
- Desktop: ซ้าย = ปฏิทินเดือนแบบย่อ (`components/miniCalendar.tsx` · จุดทอง = วันที่มีจอง) + สรุปสถานะของวัน · ขวา = ตารางในการ์ด + ชิปกรอง (ทั้งหมด / รอร้านยืนยัน / รอมัดจำ / ยืนยันแล้ว) · สลับ "ปฏิทิน" เป็นปฏิทินเต็มเดือนพร้อมจำนวนจอง
- ปุ่มท้ายแถวตามสถานะ (รับจอง/ปฏิเสธ · เช็กอิน/ย้ายโต๊ะ · ดู/ยกเลิก) — "ย้ายโต๊ะ" ไปหน้ารายละเอียดพร้อม `?move=1` · ตัดปุ่มที่บทบาทนั้นทำไม่ได้ด้วย `nextStatuses`
- มือถือ: แถบ 7 วัน + ชิป + การ์ด · ปุ่มค้นหา/ปฏิทินบนหัวหน้า
- กดแถวไปหน้า `/merchant/bookings/:id` แทน Drawer · ย้าย `modal/` ไปโมดูล `bookingDetail`
- ไฟล์หลัก: `page.tsx` `components/miniCalendar.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setBookingStatus` · `useTableOptions` · `moveBooking` · `refundDeposit` (`POST /merchant/bookings/:id/status` · `GET /merchant/bars/:barId/bookings/:bookingId/table-options` · `POST /merchant/bookings/:id/move` · `POST /merchant/bookings/:id/refund`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- ย้ายปุ่มจัดการลงใน Drawer และจัดรายละเอียดเป็นคอลัมน์เดียวบนมือถือ
