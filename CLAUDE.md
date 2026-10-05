# CLAUDE.md — กติกาการทำงานใน repo NightOut

## Branch
- มีแค่ 2 branch: `demo` (dev) และ `main` (deploy ขึ้นเว็บ)
- ทำงานและ push ที่ `demo` เท่านั้น ห้าม push ตรงเข้า `main` และไม่ต้องแตก branch ย่อย
- เจ้าของ repo เป็นคน merge `demo → main` เมื่อทดสอบแล้ว

## Commit
- ใช้ Conventional Commits เช่น `feat(api): ...`, `fix(web): ...`, `docs: ...`
- 1 commit = 1 เรื่อง

## สเปค
- สเปคหลักอยู่ที่ `docs/PROMPT.md` ถ้าสเปคเปลี่ยน ให้อัปเดตไฟล์นี้ใน branch `demo`

## Skills
- **ทุกครั้งที่แก้ UI ต้องเปิด skill ที่เกี่ยวข้องก่อน** (frontend-design เสมอ + mobile-native ถ้าแตะมือถือ, antd ถ้าแตะคอมโพเนนต์ antd, animate ถ้าแตะ motion) เพื่อกันดีไซน์เพี้ยน
- ก่อนเริ่มงาน: ดึง `demo` ล่าสุดของเพื่อนก่อนเสมอ แล้วทำต่อบนนั้น
- `.claude/skills/ant-design` และ `.claude/skills/antd` (จาก ant-design/antd-skill) ใช้ทุกครั้งที่เขียน UI (antd v6 ใช้ทั้ง `apps/frontend` และ `apps/admin`)
- ก่อนเขียนโค้ด antd: `antd info <Component> --format json` / หลังแก้: `antd lint <path> --format json`
- Tailwind ใช้กับ layout/ตกแต่งเท่านั้น, ไอคอนใช้ Phosphor (`@phosphor-icons/react`) ห้ามใช้ `@ant-design/icons`
- `.claude/skills/frontend-design` (จาก anthropics/claude-code) ใช้ตอนออกแบบ/ปรับหน้าจอ — แต่ Figma + Midnight Gold คือโจทย์หลัก ห้ามหลุดธีม
- สถาปัตยกรรมและ route อ้างอิง `docs/ARCHITECTURE.md` และ `docs/SITEMAP.md`

## โครงโฟลเดอร์ (apps/frontend, apps/admin)
- 1 หน้า = `src/modules/<ชื่อหน้า camelCase>/page.tsx` · ของใช้เฉพาะหน้าไว้ใน `components/ type/ form/ modal/ utils/` ของโมดูลนั้น
- ใช้หลายหน้า → `src/ui/components`, `src/ui/utils`, `src/hooks` · API/Auth → `src/services`
- route อยู่ `src/router/index.tsx`, guard อยู่ `src/router/middleware.tsx`, layout อยู่ `src/layouts/`
- รายละเอียด: `docs/ARCHITECTURE.md` หัวข้อ "โครงภายในแอป"

## React
- ใช้ function component + hooks เท่านั้น (ยกเว้น `ErrorBoundary`) และ logic ที่ใช้ซ้ำให้แยกเป็น custom hook
- HOC ใช้เฉพาะเรื่องที่ครอบหลายหน้า ส่วนเรื่องสิทธิ์ใช้ layout route `<RequireAuth>` / `<RequireRole>`

## API (NestJS)
- key ใน body / query / response เป็น **snake_case ทั้งหมด** (เช่น `qty`, `unit_price`, `service_charge_rate`) — โค้ดภายในที่ใช้ camelCase ให้แปลงใน service
- ทุก endpoint ต้องมี `@ApiDoc({ summary, description, returns })` (`apps/backend/src/common/api-doc.ts`) บอกว่าเส้นนี้ทำอะไรและตอบอะไรกลับ · field ใน DTO ใส่ `.describe()` ได้

## Auth
- เข้าสู่ระบบด้วย email + password ของ Supabase Auth (supabase-js) + ปุ่ม Google / Facebook (Supabase OAuth ตาม Figma "Login") ส่วน NestJS แค่ตรวจ JWT ห้ามเพิ่ม OTP หรือ provider อื่นโดยไม่ได้ตกลงกันก่อน
- ขั้นตอนเชื่อม Supabase project จริง: `docs/SUPABASE.md`

## คำสั่ง
- ติดตั้ง: `pnpm install` · รัน: `pnpm dev` · ตรวจก่อน commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- package ภายใน build ด้วย tsup/tsc → แอปต้องรอ `^build` (Turborepo จัดการให้)
- สี / ธีม: แก้ที่ `packages/ui/src/tokens.ts` และ `theme.css` ให้ตรงกัน (มี test ตรวจ)

## กฎธุรกิจที่ตกลงแล้ว
- จอง**เฉพาะโต๊ะ** + เลือกโปรโมชันของร้านได้ 1 อย่าง (มี cutoff time เช่น โปรเบียร์ก่อน 2 ทุ่ม) — **ไม่มี**สั่งอาหาร/เครื่องดื่ม/แพ็กเกจล่วงหน้า เมนูราคาแสดงเพื่อประเมินงบเท่านั้น
- **ทุกการจองต้องมัดจำ** เงินเข้า PromptPay ของ NightOut (ไม่เข้าร้าน) → แอดมินตรวจสลิป → ถือไว้ → ลูกค้าเช็กอิน/ไม่มาแล้วค่อยโอนให้ร้านหรือเก็บเป็นเครดิตร้าน
- หน้า Checkout ต้องกรอกเบอร์โทร + ติ๊กยอมรับเงื่อนไขริบมัดจำ (ข้อความจาก `depositTermsText()` ใน `@nightout/utils` · เปลี่ยนเนื้อหา = ขึ้น `DEPOSIT_TERMS_VERSION`) → DB เก็บหลักฐานใน `booking_deposit_consents` (แก้/ลบไม่ได้)
- แอดมินปฏิเสธสลิปต้องเลือกเหตุผล (`DEPOSIT_REJECT_REASONS`) · "สลิปปลอม" ติดธงลูกค้า ครบ 2 ครั้ง (นับบัญชี + เบอร์) แบนบัญชีและทุกเบอร์ที่เคยใช้ — ปลดได้ที่หน้า `/users` ของ Backoffice
- ทีมร้านทุกบทบาท (รวม PR/STAFF) ย้ายโต๊ะ และยืนยันคืนมัดจำได้ (เคสหน้างาน) — เงินคืนยังเป็น NightOut โอนจากแท็บ "รอคืนลูกค้า"
- PR ของร้าน (ชาย/หญิง/LGBTQ+ กี่คน) ร้านกรอกเองใน `/merchant/settings` แสดงในหน้าร้าน/การ์ด และกรองได้ในหน้าค้นหา
- แผนที่ใช้ Leaflet + vector tiles OpenFreeMap (ฟรี ไม่ต้องมี key) สีตามพาเลต Google Maps ปกติ/กลางคืน (`ui/utils/mapStyle.ts`) — ไม่ใช้ Google Maps API / CARTO · สำรองเป็น OSM raster · หน้า `/map` เต็มจอ หมุดและการ์ดใช้รูปร้าน `barImage()` (coverUrl หรือรูปแทน `/images/bars/placeholder.webp`)
- หน้าจัดอันดับเป็นรายสัปดาห์/รายเดือนตามจำนวนโหวต (1 การจองที่เช็กอิน = 1 โหวต) ใช้ GSAP + ScrollTrigger (`modules/ranking/utils/gsap.ts`) — GSAP ใช้เฉพาะหน้านั้น ที่อื่นใช้ Motion ตามเดิม
- รีวิวแนบรูป/วิดีโอได้สูงสุด 6 ไฟล์ (วิดีโอ ≤ 60 วิ / 60MB) · ของจริงเก็บ Supabase Storage `review-media` (migration 0003) · ตอนเลือกไฟล์: รูปเป็น data URL, วิดีโอพักใน IndexedDB (`services/mediaStore.ts`) แล้วอัปโหลดตอนส่งรีวิว
- ธีมมืดเป็นค่าเริ่มต้น · หน้า Auth ไม่มีปุ่มเปลี่ยนธีม/ปุ่มเข้าสู่ระบบบน navbar (`<Navbar minimal />`)
- ไม่มีโหมดเดโมแล้ว (เอาปุ่มเข้าเร็วเดโม/ปุ่มรีเซ็ตออก)

## การเชื่อมต่อ API (ADR 0002 — `docs/adr/0002-migrate-direct-db-calls-to-backend-api.md`)
- `apps/frontend` และ `apps/admin` **ห้าม query DB / Storage ตรง** — `supabase` ใช้ได้เฉพาะ `supabase.auth.*` (ESLint บล็อก `supabase.from/rpc/storage`) · Backoffice: ADR 0003 (`/admin/views/:view`, `/admin/dashboard`, `/admin/master/:table`)
- ลำดับชั้น: `Component → TanStack Query Hook (services/data.ts) → API Service Layer (services/*) → `Rest` (`@nightout/utils/rest` — class กลางใช้ร่วม frontend + admin) → Backend API`
- ห้ามสร้าง axios/fetch client ของแต่ละแอปเอง — ตั้งค่า `Rest.configure()` ที่ `main.tsx` แล้ว import `Rest` จาก `@nightout/utils/rest` · รหัส error ใหม่ → เพิ่มข้อความไทยใน `ERROR_MESSAGES` (`packages/utils/src/rest.ts`)
- อ่านข้อมูลใหม่: เพิ่ม endpoint ใน backend (`modules/query` — อ่านในนามผู้เรียกด้วย `selectAs`/`rpcAs` ห้ามใช้ service_role) → hook ที่เรียก `Rest.get<T>()` · เขียน: ฟังก์ชันใน `services/actions.ts` ที่เรียก `Rest.post/put/patch/delete<T>()`
- อัปโหลดไฟล์: `services/storage.ts` (ขอ URL จาก `POST /storage/upload-url` แล้ว PUT ไฟล์ตรง)
- env: `VITE_API_BASE_URL` (ว่าง = dev `http://localhost:3000/api`, deploy `/api`) · backend ต้องมี `SUPABASE_ANON_KEY` (หรือใช้ `VITE_SUPABASE_ANON_KEY` ที่ root)

## ข้อมูล (Supabase ผ่าน API)
- `apps/frontend`: **ข้อมูลร้านมาจาก Supabase ผ่าน NestJS เท่านั้น** — ต้องมี `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Auth) ใน `.env` ที่ root และเปิด backend (ไม่มี → หน้าแจ้งให้ตั้งค่า, ต่อไม่ได้ → หน้า error + ปุ่มลองใหม่) ห้ามใช้ร้านเดโมเป็น fallback
  - `main.tsx` รอ `loadPublic()` (`src/services/sync.ts` → `GET /public/catalog`) ก่อน render แล้วเอาข้อมูลไปใส่ store ของ `@nightout/mock` → หน้าเว็บยังเรียก `listBars()` / `getBarBySlug()` ได้เหมือนเดิม
  - ร้านเดโมอยู่ใน DB แล้ว (`apps/backend/supabase/seed.sql` สร้างจาก `@nightout/mock` ด้วย `db:seed:gen`) — ห้ามใส่ชื่อร้านจริงใน seed
- ทุกหน้าใช้ข้อมูลจริงแล้ว: `src/services/sync.ts` โหลดจาก API (`/public/catalog`, `/me/overview`) ใส่ store ของ `@nightout/mock` (cache) · หน้า import จาก `@/services/data` (ห้าม import `@nightout/mock` ตรงในหน้า) · การเขียนเรียก `src/services/actions.ts` → NestJS → `rpc('app_*')` (`docs/DATABASE.md` หัวข้อ 5.2)
- log การเชื่อมต่อออก Console ผ่าน `src/services/log.ts` (ป้าย `NightOut`) — ดูวิธีเช็กใน `docs/SUPABASE.md` หัวข้อ 5
- มัดจำ/โอนเงินให้ร้านยังเป็น DRAFT (ข้อ 10.3) ห้ามเปิดรับเงินจริง
- โครงสร้างตาราง: `docs/DATABASE.md` (spec: `docs/DATABASE_CHANGES.md`) · types: `import { Db } from '@nightout/types'` (`Db.BarCard`, `Db.BarDetail` …)
- backend อ่าน view/RPC ให้หน้าเว็บ (`bar_detail`, `public_reviews`, `booking_detail`, `my_favorites`, `my_reviews`, `my_bar_detail`, `zone_availability` …) ในนามผู้เรียก (RLS) · **เขียนผ่าน NestJS เท่านั้น** (RLS ไม่เปิดให้หน้าบ้านเขียน) · `apps/admin` อ่าน view `admin_*` ผ่าน `GET /admin/views/:view` (ADMIN + MFA)
- แก้ migration แล้วต้องรัน `pnpm --filter @nightout/backend db:types` · migration ใหม่ต้องมี index บน FK + enable RLS + revoke write (ดูไฟล์ `…001500`)
