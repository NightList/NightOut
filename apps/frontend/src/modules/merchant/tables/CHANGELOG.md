## 2026-10-10 — Bento ตาม Merchant 1i Store/Growth
- การ์ดโซนละใบ (3 คอลัมน์): ความจุ / ระยะเวลาจอง แก้ได้ในช่อง · มัดจำของร้าน · ปุ่มโต๊ะ (กดเพื่อปิดใช้) · "เพิ่มโต๊ะ" เส้นประ · แถบข้อมูล grace period → ตั้งค่าการจอง
- มือถือ: การ์ดโซนย่อ + ตารางโต๊ะ 6 คอลัมน์
- ไฟล์หลัก: `page.tsx`

# CHANGELOG — frontend/modules/merchant/tables

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setZones` (`PUT /merchant/bars/:barId/zones`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)
