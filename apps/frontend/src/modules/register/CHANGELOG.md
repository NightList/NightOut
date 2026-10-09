# register — ประวัติการแก้ไข

## 2026-10-09 — เปลี่ยนหน้าสมัครสมาชิกเป็น modal
- ฟอร์มสมัครย้ายเป็น Basic Modal เดียวกับเข้าสู่ระบบ (`ui/components/authModal.tsx` + `authRegisterForm.tsx`) สลับ "เข้าสู่ระบบ ↔ สมัครสมาชิก" ภายใน modal · ลิงก์เงื่อนไข/นโยบายปิด modal ก่อนไปหน้านั้น
- ตรรกะสมัคร (Supabase signUp, อายุ 20+, ไปต่อ `/verify-email` หรือ `/onboarding`) เหมือนเดิม
- `/register` เหลือเป็น redirect ไป `/` แล้วเปิด modal (`page.tsx`) · เปลี่ยน `LoginModalProvider/useLoginModal` เป็น `AuthModalProvider/useAuthModal`
