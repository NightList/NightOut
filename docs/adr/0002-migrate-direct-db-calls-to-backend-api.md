# ADR 0002: ย้ายการเรียก Database ตรงจากหน้าเว็บไปที่ Backend REST API

- **สถานะ:** Accepted
- **วันที่:** 2026-10-03
- **ขอบเขต:** `apps/frontend` (เว็บลูกค้า + หลังร้าน) · `apps/admin` ย้ายตามใน [ADR 0003](0003-migrate-admin-direct-db-calls-to-backend-api.md)
- **ต่อจาก:** [ADR 0001](0001-writes-through-backend-api.md)

## Context

ก่อนหน้านี้หน้าเว็บ **เขียน** ผ่าน NestJS แล้ว (ADR 0001) แต่ยัง **อ่าน** และจัดการไฟล์กับ Supabase ตรงด้วย `supabase-js`:

| จุด | เรียกอะไร |
|---|---|
| `services/sync.ts` | `bar_detail`, `public_reviews`, `districts`, `styles`, `platform_settings`, `promotion_packages`, `booking_detail` (ของฉัน + ของร้าน), `notifications`, `my_favorites`, `my_reviews`, `user_preferences`, `my_bar_detail`, `review_reports`, `promoted_listings`, `storage.createSignedUrls` |
| `services/auth.tsx` | `users` (โปรไฟล์ + role) |
| `services/data.ts` | rpc `zone_availability`, `bar_team`, `my_invites`, `bar_deposit_ledger`, `get_share_card` · `billing_events` · `public_team` |
| `services/storage.ts` | `storage.upload`, `storage.createSignedUrl` |

ปัญหา:
1. **พื้นผิวการโจมตีกว้าง** — ใครก็ตามที่มี anon key (ฝังอยู่ใน bundle ของเว็บ) ยิง PostgREST ได้ทุก view/ตาราง/ฟังก์ชันที่ grant ให้ `anon`/`authenticated` ด้วย query อะไรก็ได้ (select ทุกคอลัมน์ / filter / limit ใหญ่) ความปลอดภัยทั้งหมดฝากไว้กับ RLS ทุกตัวต้องถูกต้อง 100%
2. **ไม่มีด่านกลาง** — rate limit, validation, logging, การจำกัดคอลัมน์และจำนวนแถว ทำได้ยากเมื่อเว็บคุยกับ DB ตรง
3. **schema รั่วไปถึงหน้าเว็บ** — ชื่อ view/คอลัมน์/FK (เช่น `bookings!billing_events_booking_id_fkey`) อยู่ในโค้ดหน้าเว็บ แก้ DB ทีไรต้องแก้หน้าเว็บด้วย
4. **โค้ดเชื่อมต่อ 2 แบบ** — ส่วนเขียนใช้ `fetch` → NestJS ส่วนอ่านใช้ `supabase-js` การจัดการ token/error ไม่เหมือนกัน

## Decision

1. **หน้าเว็บไม่ query DB / Storage ตรงอีกต่อไป** — ทุกการอ่าน/เขียนผ่าน NestJS
   ```
   Component → TanStack Query Hook → API Service Layer (Rest) → Axios Client → Backend API → Supabase
   ```
2. **Axios client กลาง** `apps/frontend/src/services/apiClient.ts`
   - `axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })` (สำรอง: `VITE_API_URL` เดิม → dev `http://localhost:3000/api` / deploy `/api`)
   - request interceptor แนบ `Authorization: Bearer <access token ของ Supabase Auth>` ถ้าล็อกอิน
   - response interceptor แปลงทุก error เป็น `ApiError(status, code)` พร้อมข้อความภาษาไทยจากรหัสของ API/DB และ log ใน Console
   - `Rest.get/post/put/patch/delete<T>()` คืน body ตาม type ที่ระบุ
3. **Backend เพิ่ม endpoint อ่าน** (`apps/backend/src/modules/query`) — `GET /public/catalog`, `/public/team`, `/bars/:id/zone-availability`, `/share-cards/:token`, `/me/profile`, `/me/overview`, `/me/invites`, `/merchant/bars/:id/team|deposit-ledger|billing-events`, `POST /storage/upload-url`, `/storage/signed-urls` (รายละเอียดใน `ARCHITECTURE.md` หัวข้อ Data Flow Standard และ Swagger `/api/docs`)
4. **NestJS อ่านข้อมูล "ในนามผู้เรียก"** — ส่ง anon key + access token ของผู้ใช้ (หรือ anon ถ้าไม่ล็อกอิน) ต่อให้ PostgREST/Storage **ไม่ใช้ service_role** กับงานอ่าน → RLS, `auth.uid()` และ Storage policy ทำงานเหมือนเดิมทุกตัว พฤติกรรมเดิมไม่เปลี่ยน
5. **ไฟล์:** API ออก signed upload URL (สร้างในนามผู้ใช้ → bucket policy ตรวจว่าโฟลเดอร์เป็นของเขา) แล้วหน้าเว็บ PUT ไฟล์ตรงเข้า Storage — ไฟล์ใหญ่ (วิดีโอรีวิว ≤ 60MB) จึงไม่ผ่าน Vercel Function ที่จำกัด body ~4.5MB · bucket จำกัดเฉพาะ `deposit-slips`, `review-media`, `promo-slips`, `bar-verifications` และ path ห้ามมี `..`
6. **Supabase Auth ยังเรียกจากหน้าเว็บ** (เข้าสู่ระบบ / สมัคร / OAuth / ลืมรหัสผ่าน / ต่ออายุ token) — เป็นบริการยืนยันตัวตน ไม่ใช่การ query DB, OAuth redirect ต้องทำในเบราว์เซอร์ และตรงกับกติกา Auth ใน `CLAUDE.md` · `supabase.ts` เหลือไว้ใช้ `supabase.auth.*` อย่างเดียว
7. **กันถอยหลัง:** ESLint ของ `apps/frontend` ห้าม `supabase.from / rpc / storage / schema / channel`

### เหตุผลเรื่องความปลอดภัย
- **Least privilege ที่ขอบระบบ:** หน้าเว็บเรียกได้แค่ endpoint ที่ประกาศไว้ ด้วย query ที่ backend กำหนด (คอลัมน์ / filter / limit ตายตัว) แทนการเปิด PostgREST ทั้งก้อน — ทางตรงด้วย anon key จะปิดสนิทเมื่อทำ "งานต่อ" ข้อ 2
- **Defense in depth:** ด่านแรก NestJS (JWT guard, zod validation, ThrottlerGuard 120 req/นาที, whitelist bucket/path) · ด่านที่สอง RLS + Storage policy ใน DB (ยังทำงานเพราะ backend ส่ง token ผู้เรียกต่อ)
- **ไม่มีความลับในหน้าเว็บ:** `SUPABASE_SERVICE_ROLE_KEY` อยู่เฉพาะ backend · หน้าเว็บมีแค่ `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (publishable key ที่ออกแบบให้อยู่ฝั่ง client — ใช้กับ Auth) และ `VITE_API_BASE_URL`
- **ไม่ยกระดับสิทธิ์โดยไม่ตั้งใจ:** งานอ่านไม่ใช้ service_role (ไม่ข้าม RLS) · token ปลอมถูก Supabase ปฏิเสธเองเพราะ backend แค่ส่งต่อ ไม่สร้าง token ใหม่
- **ตรวจสอบได้:** ทุก request ผ่าน NestJS ที่เดียว ต่อ log / audit / alert ได้

## Consequences

**ดี**
- โค้ดเชื่อมต่อชุดเดียว (Axios) — token, error, log, timeout จัดการที่เดียว
- เปลี่ยน schema / view ใน DB ได้โดยไม่กระทบหน้าเว็บ ตราบใดที่ response ของ API เท่าเดิม
- ข้อมูลผู้ใช้โหลดครั้งเดียว (`GET /me/overview`) แทน 7–9 query จากเบราว์เซอร์
- Swagger `/api/docs` อธิบายทุก endpoint ที่หน้าเว็บใช้

**ต้องแลก**
- ทุกการอ่านมี hop เพิ่ม (เบราว์เซอร์ → Vercel Function → Supabase) — latency เพิ่ม ~20–80 ms และ cold start ของ Function · บรรเทาด้วย snapshot ข้อมูลสาธารณะในเครื่อง (เปิดเว็บครั้งถัดไปแสดงทันที) และ cache ของ TanStack Query
- ภาระ/ค่าใช้จ่ายของ NestJS บน Vercel เพิ่มขึ้น (นับ invocation)
- เว็บใช้งานไม่ได้เมื่อ API ล่ม (เดิมยังอ่านได้) → มี health check (`checkApi`) และหน้า error พร้อมปุ่มลองใหม่
- backend ต้องมี `SUPABASE_ANON_KEY` (ค่าเดียวกับ `VITE_SUPABASE_ANON_KEY` — ถ้าไม่ตั้ง จะใช้ `VITE_SUPABASE_ANON_KEY` แทน) ไม่งั้น endpoint อ่านตอบ 503

**Breaking change**
- ไม่มีใน UI — component ยังเรียก hook / ฟังก์ชันเดิม (`useZoneAvailability`, `useBarTeam`, `listBars`, `createBooking` …) ชื่อและ type เหมือนเดิม
- env: `VITE_API_URL` → `VITE_API_BASE_URL` (ค่าเดิมยังอ่านเป็นค่าสำรอง ไม่ต้องแก้ทันที)

## งานต่อ (ยังไม่ทำใน ADR นี้)
1. ~~ย้าย `apps/admin` (อ่าน view `admin_*` ตรง) มาใช้แนวเดียวกัน~~ → ทำแล้วใน ADR 0003
2. หลังย้ายครบ: `REVOKE SELECT` ของ view/ตารางที่ไม่ต้องให้ `anon`/`authenticated` อ่านตรงแล้ว → ปิดทาง PostgREST จาก anon key ให้สนิท (ตอนนี้ยังเปิดอยู่เพราะ backend อ่านในนามผู้ใช้ผ่าน role เดียวกัน — ถ้าจะ revoke ต้องเปลี่ยน backend ไปใช้ service_role + ตรวจสิทธิ์เองใน service ก่อน)
3. generate type ของ response จาก OpenAPI (`openapi-typescript`) แทน interface ที่เขียนเองใน `services/*`
