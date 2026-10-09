## 2026-10-10 — Bento ตาม Merchant 1i Store/Growth
- ซ้าย = Safety Score (วงแหวน x/9 + จำนวนข้อที่ NightOut ยืนยัน) + สรุป มี/ไม่มี/ไม่ระบุ · ขวา = checklist ไอคอนต่อข้อ ปุ่ม มี/ไม่มี/ไม่ระบุ (สีเขียว/แดง) + "หลักฐาน"
- บรรทัดใต้ชื่อบอกสถานะ: ยืนยันแล้ว · ร้านแจ้ง รอหลักฐาน · ยังไม่มีข้อมูล
- ไฟล์หลัก: `page.tsx` · `Ring` ใน `ui/components/merchantUi.tsx` รับ children แล้ว

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setSafety` · `uploadSafetyProof` (`PUT /merchant/bars/:barId/safety/:key`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- หัวข้อความปลอดภัยขึ้นบรรทัดใหม่เมื่อพื้นที่แคบ
