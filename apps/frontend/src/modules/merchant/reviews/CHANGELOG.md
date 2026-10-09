## 2026-10-10 — Bento ตาม Merchant 1i Store/Growth
- ซ้าย = คะแนนเฉลี่ย + การกระจาย 5→1 ดาว + คำอธิบายการรายงาน · ขวา = รายการรีวิว (โซนที่นั่ง · รูป/วิดีโอแนบ) + ปุ่มรายงาน (ยืนยันก่อน) · ชิปกรอง ทั้งหมด/มีรูป/รายงานแล้ว
- ยังไม่มีการตอบกลับรีวิวจากร้าน (ไม่มี API)
- ไฟล์หลัก: `page.tsx`

# CHANGELOG — frontend/modules/merchant/reviews

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `reportReview` (`POST /reviews/:id/report`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)
