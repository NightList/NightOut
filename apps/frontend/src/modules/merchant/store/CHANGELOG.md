## 2026-10-09 — รูปร้าน (ปก + แกลเลอรี)
- การ์ด "รูปร้าน" บนสุดของหน้า: อัปโหลดได้หลายรูปพร้อมกัน (สูงสุด 10 · ย่อเป็น 1920px ก่อนอัปโหลด) · รูปแรกเป็นปกอัตโนมัติ · ตั้งเป็นปก / ลบ (ลบปก → รูปถัดไปเป็นปก) · บันทึกทันทีไม่ต้องกดบันทึกฟอร์ม — ร้านอัปโหลดรูปจริงแทนรูปแทนของ NightOut ได้
- ปกโชว์เป็นช่องใหญ่ 16:10 แบบเดียวกับการ์ดร้าน ให้เห็นว่าลูกค้าจะเห็นอย่างไร
- endpoint ใหม่ `PUT /merchant/bars/:barId/media` (`app_set_bar_media` · migration `20261009000100_bar_media_images`)
- ไฟล์: `components/barPhotos.tsx` (หาปก/เรียงปกขึ้นก่อนด้วย `galleryCoverPath` / `coverFirst` จาก `@nightout/utils`) · `api.ts` (`setBarMedia`, `uploadGalleryPhoto`) · `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `updateBarInfo` (`PATCH /merchant/bars/:barId/info`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- ตัวเลือกเวลาเปิดร้านย่อได้ตามความกว้างจอ
