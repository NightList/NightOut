## 2026-10-09 — bucket bar-media
- อัปโหลดเข้า `bar-media` ได้ผ่าน `POST /storage/upload-url` (ทีมร้านในโฟลเดอร์ร้านตัวเอง · แอดมิน + MFA ทุกร้าน — policy ใน `…20261009000100`) · เป็น bucket public จึงตอบ `public_url` กลับด้วย
- ไฟล์: `storage.module.ts` (คำอธิบาย bucket) · รายชื่อ bucket อยู่ `packages/contracts/src/storage.ts`

