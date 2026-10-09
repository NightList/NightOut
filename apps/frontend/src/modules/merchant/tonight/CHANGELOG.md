## 2026-10-10 — Bento ตาม Merchant 1i Sitemap
- Desktop: ช่องสแกน/กรอกรหัส (กรอบทอง) · สถานะร้าน 3 ปุ่มแนวตั้ง · นาฬิกา + เวลาปิดรับวันนี้ + วงแหวนเช็กอิน + เตือน "เลยเวลา N โต๊ะ · ยกเลิกอัตโนมัติใน X นาที" (`autoCancelAt`) · รายการ 2 คอลัมน์ + ชิป ทั้งหมด/ยังไม่มา/มาแล้ว
- มือถือ: ปุ่มทองใหญ่ (โฟกัสช่องรหัส) · สถานะร้าน 3 ช่อง · การ์ดปุ่ม 44px · กดการ์ดไปหน้ารายละเอียด
- ไฟล์หลัก: `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setCrowd` · `checkIn` (`POST /merchant/bars/:barId/crowd` · `POST /merchant/bars/:barId/check-in`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)
