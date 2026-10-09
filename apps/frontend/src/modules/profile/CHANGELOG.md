# CHANGELOG — frontend/modules/profile

## 2026-10-10 — รองรับมือถือ (responsive)
- การ์ดหัวโปรไฟล์: ชื่อ/อีเมลไม่ล้นจอแคบ (`min-w-0` + `truncate` / `break-all`) · ปุ่ม "ออกจากระบบ" ลงบรรทัดใหม่เต็มความกว้างบนมือถือ
- ปุ่ม "ไปหน้าร้านของฉัน" / "บันทึก" / "เชื่อม LINE" เต็มความกว้างบนมือถือ (กดง่าย) · ระยะห่างการ์ดแคบลงบนจอเล็ก
- ไฟล์: `page.tsx`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `updateProfile` (`PATCH /me/profile`) — ย้ายมาจาก `services/api/<domain>.ts` / `services/queries/<domain>.ts` (ลบแล้ว) · เรียก `Rest` ตรง
- หน้าในโมดูล import จาก `./api` แทน `@/services/data` · พฤติกรรมเดิม (ชื่อฟังก์ชัน, query key)
