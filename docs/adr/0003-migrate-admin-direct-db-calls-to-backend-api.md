# ADR 0003: ย้ายการอ่านข้อมูลของ Backoffice (`apps/admin`) ไปที่ Backend API

- **สถานะ:** Accepted
- **วันที่:** 2026-10-03
- **ต่อจาก:** [ADR 0002](0002-migrate-direct-db-calls-to-backend-api.md) (ทำ "งานต่อ" ข้อ 1)

## Context
หลัง ADR 0002 เว็บลูกค้า/หลังร้านไม่ query DB ตรงแล้ว แต่ Backoffice ยังอ่านตรงด้วย `supabase-js`:
`useAdminView` (view `admin_*` 10 ตัว พร้อม filter/order/limit จากหน้าเว็บ), `useAdminDashboard` (rpc `admin_dashboard`), `useMasterTable` (`styles`, `safety_features`, `platform_settings`), `useSignedUrl` (Storage), และตอนล็อกอิน/โหลด session อ่าน `users` (role) ตรง
ส่วนงานเขียนใช้ `fetch` คนละตัวกับเว็บลูกค้า

## Decision
ใช้มาตรฐานเดียวกับ ADR 0002 ทุกข้อ:
1. **Axios client กลาง** `apps/admin/src/services/apiClient.ts` — `axios.create({ baseURL: VITE_API_BASE_URL })` + interceptor แนบ Bearer token (session ของ Backoffice) + แปลง error เป็น `ApiError` ภาษาไทย (401 → "ต้องยืนยันรหัส 6 หลักใหม่") · `Rest.get/post/put/patch/delete<T>()`
2. **Backend** (`apps/backend/src/modules/admin/admin-read.controller.ts`, guard `SupabaseJwtGuard` + `AdminGuard` = ADMIN + MFA):
   - `GET /admin/dashboard`
   - `GET /admin/views/:view?<คอลัมน์>=<ค่า>[,<ค่า>…]&order=<คอลัมน์>.asc|desc&limit=` — view ต้องอยู่ใน whitelist 10 ตัว · ชื่อคอลัมน์ต้องตรง `^[a-z][a-z0-9_]*$` · ค่าถูก encode/quote (แทรก parameter ของ PostgREST ไม่ได้) · limit ≤ 2,000
   - `GET /admin/master/:table?order=` — whitelist 3 ตาราง
   - ใช้ endpoint เดิมของ ADR 0002 ด้วย: `GET /me/profile` (role ตอนล็อกอินก่อน MFA) · `POST /storage/signed-urls` (สลิป/หลักฐาน)
3. อ่าน **ในนามผู้เรียก** (anon key + token แอดมิน) — RLS ของ view `admin_*` (ADMIN + MFA) ยังเป็นด่านที่สองเหมือนเดิม
4. hook เดิม (`useAdminView`, `useAdminDashboard`, `useMasterTable`, `useAdminAction`, `useSignedUrl`) ชื่อ/argument/type เหมือนเดิม — หน้าไม่ต้องแก้
5. ESLint ของ `apps/admin` ห้าม `supabase.from / rpc / storage / schema / channel` · `supabase` เหลือใช้กับ Auth + MFA เท่านั้น

## Consequences
- ทั้ง 2 แอปใช้ data flow เดียวกัน: `Component → TanStack Query Hook → Rest → Axios → Backend API`
- Backoffice ได้ด่านเพิ่ม: AdminGuard ตรวจ ADMIN + aal2 **ก่อน** แตะ DB (เดิมพึ่ง RLS อย่างเดียว) + rate limit + log กลาง
- ทุกคำขอเพิ่ม hop ผ่าน Vercel Function (Backoffice ใช้ภายใน ผลกระทบน้อย) · AdminGuard อ่าน role จาก DB ทุกคำขอ (+1 query)
- ค่าเริ่มต้น baseURL ตอน deploy เปลี่ยนจาก `http://localhost:3000/api` (เดิมเป็น bug ถ้าไม่ตั้ง env) เป็น `/api` (same-origin)
- **ไม่มี breaking change ใน UI**

## งานต่อ
- ตอนนี้ทั้ง 2 แอปไม่ query DB ตรงแล้ว → พร้อมทำ ADR 0002 "งานต่อ" ข้อ 2 (ปิดการอ่านตรงด้วย anon key ใน DB) — ต้องเปลี่ยนงานอ่านใน backend ให้ตรวจสิทธิ์เองก่อน เพราะตอนนี้ backend อ่านผ่าน role `anon`/`authenticated` เดียวกับที่จะ revoke
