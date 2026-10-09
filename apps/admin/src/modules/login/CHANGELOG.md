# CHANGELOG — admin/modules/login

## 2026-10-10 — ดีไซน์ใหม่ "Staff Pass" (บัตรพนักงาน)
- หน้า login เปลี่ยนจาก Card ธรรมดาเป็นบัตร 2 ส่วน: ต้นขั้ว (โลโก้ใหม่ · STAFF ONLY · Admin Pass · ชื่อผู้ถือ) + ฝั่งฟอร์ม มีรอยปรุและรูบัตร · จอ < 900px ต้นขั้วกลายเป็นแถบบน
- ชื่อผู้ถือบนต้นขั้วตามช่องอีเมลแบบสด (`Form.useWatch`) · ขั้นยืนยันแสดงอีเมลที่ล็อกอินพร้อมเครื่องหมายถูก
- ขั้น enroll วาง QR ซ้าย + รหัสลับ (คัดลอกได้) ขวา · ปุ่ม "ใช้บัญชีอื่น" เป็นปุ่มขอบ คู่กับปุ่มยืนยัน
- logic เดิมทั้งหมด (signIn, ตรวจ `can_enter_backoffice`, MFA enroll/verify, ข้อความ error)
- ไฟล์: `page.tsx` · ใหม่ `components/staffPass.tsx` + `staffPass.css` · `public/logo-mark.svg` · เพิ่มฟอนต์ JetBrains Mono ใน `index.html`

## 2026-10-09 — ย้าย API เข้า `api.ts` ของโมดูล (ADR 0007)
- เพิ่ม `api.ts`: `fetchMyProfile` — ชื่อ view / path / body ของหน้านี้ย้ายมาอยู่ที่เดียว (เดิมเขียนในหน้าผ่าน `useAdminView('admin_x', …)` / `act.mutate({ method, path, body })`) · body มี type จาก `@nightout/contracts`
- หน้า / form / modal ของโมดูลเรียกผ่าน `./api` · พฤติกรรมเดิม (query key, ข้อความแจ้งผล, invalidate `['admin']`)
