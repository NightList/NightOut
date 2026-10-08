# CHANGELOG — frontend/modules/book

## 2026-10-09 — ย้าย API เข้า module (ADR 0007 นำร่อง)
- เพิ่ม `api.ts`: `useZoneAvailability` (GET `/bars/:barId/zone-availability`) + `createBooking` (POST `/bookings`) — เรียก `Rest` ตรง · type จาก `@nightout/contracts`
- `hooks/useBookingForm.ts` import จาก `../api` และส่ง body แบบ snake_case ตาม `C.CreateBookingBody` ตรง (เลิกแปลง camelCase ในชั้น services) — พฤติกรรมเดิม
- ลบของเดิมออกจาก `services/api/booking.ts` (`createBooking`, `fetchZoneAvailability`) · `services/queries/booking.ts` (`useZoneAvailability`, `ZoneSlot`) · `queries/keys.ts` (`bookingKeys.zoneAvailability`)
