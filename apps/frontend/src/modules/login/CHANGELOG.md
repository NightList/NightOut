# login — ประวัติการแก้ไข

## 2026-10-09 — เปลี่ยนหน้าเข้าสู่ระบบเป็น modal บนหน้าหลัก
- ฟอร์มเข้าสู่ระบบย้ายเป็น Basic Modal ของ Ant Design (`ui/components/authModal.tsx`) ตามดีไซน์ใหม่: พื้นมืดโปร่ง · พื้นหลังเบลอ + เงา · Google/Facebook เป็นไอคอนกลม · ลิงก์ลืมรหัสผ่าน/สมัครสมาชิก
- ปุ่ม "เข้าสู่ระบบ" ใน navbar และปุ่มหัวใจ (ยังไม่ล็อกอิน) เปิด modal แทนการเปลี่ยนหน้า · `AuthModalProvider` ครอบใน `layouts/root.tsx`
- `/login` เหลือเป็น redirect ไป `/` แล้วเปิด modal (รองรับ `?next=` จาก `RequireAuth` และลิงก์เก่า) · ไฟล์: `page.tsx`, `router/index.tsx`
