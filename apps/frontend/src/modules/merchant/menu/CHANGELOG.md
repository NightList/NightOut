## 2026-10-09 — รูปเมนู
- คอลัมน์ "รูป" ในตาราง: เพิ่ม / เปลี่ยน / ลบรูปของแต่ละรายการได้ทันที (ย่อเป็น 800px) · modal เพิ่มรายการเลือกรูปได้ (พรีวิวก่อนอัปโหลด)
- `setMenu` ส่ง `image_path` ทุกรายการ (null = ไม่มีรูป) · รูปที่ถูกแทน/ลบ backend ลบไฟล์ให้ · บันทึกพลาดแล้ว modal ไม่ปิด
- ไฟล์: `components/menuPhoto.tsx` · `api.ts` (`uploadMenuPhoto`) · `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `setMenu` (`PUT /merchant/bars/:barId/menu`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)

## 2026-10-08 — Responsive Merchant

- ตารางเมนูเลื่อนแนวนอนในกรอบเพื่อคงปุ่มแก้ราคาและสถานะ
