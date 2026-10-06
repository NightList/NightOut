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
- **Party Set** = โต๊ะกลุ่ม + ราคาเซ็ตอ้างอิง (ไม่ขายเครื่องดื่มออนไลน์) · มัดจำต่อหัวมีเพดาน · ยกเลิก/ลดคนเข้มกว่าโต๊ะปกติ (คืนเต็ม ≥48 ชม. / ครึ่ง 24–48 ชม. / ริบ <24 ชม. · มา ≥50% นับเช็กอิน) — รายละเอียดและตัวเลขที่รอเคาะ: `docs/PARTY_SET.md`
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

## ชื่อโปรเจกต์
- ชื่อแบรนด์ **NightOut** (เดิม NightList) · package `@nightout/*` · QR เช็กอิน `NIGHTOUT:<booking id>` · key ใน localStorage/IndexedDB ขึ้นต้น `nightout-` · repo GitHub ยังชื่อ `genminigpt/NightList`

## โครงโค้ดตามโดเมน (ADR 0006 — `docs/adr/0006-domain-sliced-api-and-shared-contracts.md`)
- **1 เรื่องธุรกิจ = ชื่อโดเมนเดียวกันใน 4 ที่** — ไล่เรื่องไหน grep ชื่อโดเมนนั้น: `catalog` `booking` `deposit` `review` `bar` `bar-team` `account` `promotion` `billing` `site-team` `storage` `pricing` `backoffice`
  1. `packages/contracts/src/<domain>.ts` — zod ของ body/query + type ของ response + `<DOMAIN>_ERRORS` (ไม่มี Nest/React) · `ERROR_MESSAGES` รวมอยู่ใน `errors.ts`
  2. `apps/backend/src/domains/<domain>/` — `<domain>.module.ts` · `<domain>.{public,me,merchant,admin}.controller.ts` (แยกตามคนเรียก · guard ต่างกัน) · `<domain>.dto.ts` = `class XDto extends createZodDto(C.XBody)` · `<domain>.service.ts` เฉพาะที่มี logic มากกว่าเรียก rpc 1 ครั้ง
  3. `apps/frontend/src/services/api/<domain>.ts` (เรียก `Rest` · body `satisfies C.XBody` · response `C.XResult` · เขียนแล้ว `refresh()`) + `services/queries/<domain>.ts` (hook TanStack · key จาก `queries/keys.ts`) + `services/mappers/<domain>.ts` (แถว view → model) · **หน้า import ผ่าน `services/data.ts` เท่านั้น** (re-export) · Backoffice: `apps/admin/src/services/api|queries/<domain>.ts` + หน้าต่าง `adminData.ts`
  4. migration `apps/backend/supabase/migrations/<ts>_<domain>_<เรื่อง>.sql` · ฟังก์ชันตัวล่าสุดดูตาราง `docs/DATABASE.md` ข้อ 5.0
- `health` / `jobs` อยู่นอก `domains/` (ระบบ) · `packages/types` = enum กลาง + type ของแถว view/ตาราง (`Db.*`) ไม่ใช่สัญญา API

## เพิ่ม/แก้ endpoint (checklist)
1. **DB** — migration ใหม่ `<YYYYMMDDHHMMSS>_<โดเมน>_<เรื่อง>.sql` (ห้ามแก้ไฟล์ที่ push แล้ว)
   - ฟังก์ชันเขียน `app_*` (ลูกค้า/ร้าน) / `admin_*` (แอดมิน): `language plpgsql set search_path = ''` · พารามิเตอร์แรก `p_actor uuid` · เริ่มด้วย `app_assert_user` / `admin_assert` · สิทธิ์ร้านใช้ `app_team_role` (ทุกบทบาท) หรือ `app_assert_manager` (ไม่รวม STAFF) · error = `raise exception 'UPPER_CODE' using errcode = …` · บันทึก `app_audit` / `admin_audit` · แจ้งเตือน `app_notify*`
   - ท้ายไฟล์: `revoke all on function … from public, anon, authenticated; grant execute … to service_role;`
   - ฟังก์ชันอ่านที่เป็น `security definer` ต้องเช็กสิทธิ์เองในตัว (`auth.uid()`, `is_bar_member()`, `is_admin()`) แล้ว grant ให้ `authenticated`
   - ตารางใหม่: index บน FK + `enable row level security` + revoke write + **สร้าง policy `admin_read` เอง** (loop ใน `…001600` ทำครั้งเดียวกับตารางที่มีตอนนั้น)
   - `bookings.contact_phone` ไม่ได้ grant ให้ `authenticated` → view แบบ `security_invoker` อ้างคอลัมน์นี้ตรงไม่ได้ (permission denied) ต้องอ่านผ่านฟังก์ชัน security definer (ดู `admin_booking_contact_phone`)
   - ฟังก์ชันเดียวถูกประกาศซ้ำในหลาย migration ได้ — **ไฟล์หลังสุดคือของจริง**: `grep -l "function public.<ชื่อ>(" apps/backend/supabase/migrations/* | tail -1` แล้วอัปเดตตาราง `docs/DATABASE.md` ข้อ 5.0
   - ค่าใหม่ของ enum ต้องอยู่คนละ migration กับที่ใช้ค่านั้น
2. **contracts** — `packages/contracts/src/<domain>.ts`: `export const XBody = z.object({…})` + `export type XBody = z.infer<…>` (ใช้ `z.input` ถ้ามี default/transform) + `export interface XResult` · รหัส error ใหม่ → `<DOMAIN>_ERRORS` (ข้อความไทย) · เทสต์ใน `contracts.test.ts`
3. **API** — `domains/<domain>/<domain>.dto.ts` เพิ่ม `class XDto extends createZodDto(C.XBody)` · endpoint ใน controller ที่ตรงกับคนเรียก (`public` / `me` / `merchant` / `admin`) · `@ApiDoc` ทุกเส้น (บอกชื่อ rpc ที่เรียกใน description) · อ่าน = `db.selectAs/rpcAs(bearerOf(req), …)` · เขียน = `db.rpc('app_*', { p_actor: me.id, … })` · param ใช้ `Id()` / `BarId()` / `BookingId()` จาก `common/params` · view ใหม่ของ Backoffice → `ADMIN_VIEWS` ใน `contracts/backoffice.ts` + `AdminViewRows` ใน `apps/admin/src/services/api/backoffice.ts`
4. **type ของแถว** — `packages/types/src/database.ts` (`Db.*`) + รัน `db:types` หลัง `db:push` · response ที่หน้าเว็บใช้ต้องตรงกับ API (อย่าซ่อน/กรองค่าเงียบๆ ใน mapper)
5. **หน้าเว็บ** — เขียน: ฟังก์ชันใน `services/api/<domain>.ts` · อ่านสด: `fetchX` ใน api + hook ใน `services/queries/<domain>.ts` (key ใน `queries/keys.ts`) · ข้อมูลที่อยู่ใน catalog/overview: mapper ใน `services/mappers/<domain>.ts` · แล้ว re-export ใน `services/data.ts` · Backoffice: `useAdminView` / `useAdminAction` (`method` POST/PATCH/PUT/DELETE · `success` เป็นข้อความหรือฟังก์ชันจากผล API)
6. **logic ที่ทั้งหน้าเว็บและ backend ใช้** (ข้อความเงื่อนไข, เบอร์โทร, ราคา, state machine) → `packages/utils` + เทสต์ (utils ห้าม import contracts — contracts พึ่ง utils)
7. **เอกสาร** — `docs/DATABASE.md` (ข้อ 5.0 + migration + endpoint), `docs/SITEMAP.md` (หน้า), กฎธุรกิจใหม่ใส่หัวข้อด้านบนของไฟล์นี้, การตัดสินใจเชิงโครงสร้าง = ADR ใหม่ใน `docs/adr/`
8. **ทดสอบ** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build` · migration ลองกับ Postgres ในเครื่องก่อน push (`supabase db reset` หรือรันไฟล์ใน DB เปล่า) · เช็กสิทธิ์ด้วย token ของ role จริง (anon / ลูกค้า / ทีมร้าน / แอดมิน aal2)

## หน้าแรก (พื้นหลัง Hero)
- `modules/home/components/skyBackdrop.tsx` + `skyBackdrop.css` · ภาพ `public/images/home/hero-night{,-2560,-1280}.jpg` (16:9 · 3840/2560/1280) · **ไม่ใช้วิดีโอ**
- ภาพกับ SVG (ดาว/ไฟตึก/แสงผิวน้ำ) อยู่ในกล่อง 16:9 เดียวกัน (ขนาดแบบ cover คำนวณด้วย `cqw/cqh` · วางด้วย `--sky-x`) พิกัดใน SVG เป็นระบบ 736×414 → เปลี่ยนภาพแล้วต้องวางตำแหน่งใหม่ · เพิ่ม/ลดขนาดไฟล์ต้องแก้ `SKY_SET` / `SKY_SIZES` ใน `skyBackdrop.tsx` (ไม่ preload ใน `index.html` เพราะไฟล์นั้นใช้ทุกหน้า)
- motion เบามาก ใช้ `transform`/`opacity` เท่านั้น หยุดเมื่อพ้นจอ/สลับแท็บ และต้องเคารพ `prefers-reduced-motion` + โหมดประหยัดเน็ต (ภาพนิ่ง)
- ใต้ Hero (ธีมมืด): `modules/home/components/auroraBackdrop.tsx` aurora มืดแบบเรียบ — ม่านแสงม่วง/ทองจาง ๆ จาก token ธีม (`--purple` `--gold` `--link`) ไม่มีภาพ ไม่มี motion · ห้ามใช้ภาพที่ติดลิขสิทธิ์คนอื่น

## การเชื่อมต่อ API (ADR 0002 — `docs/adr/0002-migrate-direct-db-calls-to-backend-api.md`)
- `apps/frontend` และ `apps/admin` **ห้าม query DB / Storage ตรง** — `supabase` ใช้ได้เฉพาะ `supabase.auth.*` (ESLint บล็อก `supabase.from/rpc/storage`) · Backoffice: ADR 0003 (`/admin/views/:view`, `/admin/dashboard`, `/admin/master/:table`)
- ลำดับชั้น: `Component → services/data.ts → services/queries/<domain>.ts (TanStack) → services/api/<domain>.ts → Rest (@nightout/utils/rest — class กลางใช้ร่วม frontend + admin) → Backend domains/<domain>` · type/body จาก `@nightout/contracts`
- ห้ามสร้าง axios/fetch client ของแต่ละแอปเอง — ตั้งค่า `Rest.configure({ …, errorMessages: ERROR_MESSAGES })` ที่ `main.tsx` แล้ว import `Rest` จาก `@nightout/utils/rest` · รหัส error ใหม่ → `<DOMAIN>_ERRORS` ใน `packages/contracts/src/<domain>.ts`
- อ่านข้อมูลใหม่: endpoint ใน `domains/<domain>` (อ่านในนามผู้เรียกด้วย `selectAs`/`rpcAs` ห้ามใช้ service_role) → `fetchX` ใน `services/api/<domain>.ts` → hook ใน `services/queries/<domain>.ts` · เขียน: ฟังก์ชันใน `services/api/<domain>.ts` ที่เรียก `Rest.post/put/patch/delete<T>()`
- อัปโหลดไฟล์: `services/api/storage.ts` (ขอ URL จาก `POST /storage/upload-url` แล้ว PUT ไฟล์ตรง)
- env: `VITE_API_BASE_URL` (ว่าง = dev `http://localhost:3000/api`, deploy `/api`) · backend ต้องมี `SUPABASE_ANON_KEY` (หรือใช้ `VITE_SUPABASE_ANON_KEY` ที่ root)

## ข้อมูล (Supabase ผ่าน API)
- `apps/frontend`: **ข้อมูลร้านมาจาก Supabase ผ่าน NestJS เท่านั้น** — ต้องมี `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Auth) ใน `.env` ที่ root และเปิด backend (ไม่มี → หน้าแจ้งให้ตั้งค่า, ต่อไม่ได้ → หน้า error + ปุ่มลองใหม่) ห้ามใช้ร้านเดโมเป็น fallback
  - `main.tsx` รอ `loadPublic()` (`src/services/sync.ts` → `GET /public/catalog`) ก่อน render แล้วเอาข้อมูลไปใส่ store ของ `@nightout/mock` → หน้าเว็บยังเรียก `listBars()` / `getBarBySlug()` ได้เหมือนเดิม
  - ร้านเดโมอยู่ใน DB แล้ว (`apps/backend/supabase/seed.sql` สร้างจาก `@nightout/mock` ด้วย `db:seed:gen`) — ห้ามใส่ชื่อร้านจริงใน seed
- ทุกหน้าใช้ข้อมูลจริงแล้ว: `src/services/sync.ts` โหลดจาก API (`/public/catalog`, `/me/overview`) ใส่ store ของ `@nightout/mock` (cache) · หน้า import จาก `@/services/data` (ห้าม import `@nightout/mock` ตรงในหน้า) · การเขียนเรียก `src/services/api/<domain>.ts` → NestJS `domains/<domain>` → `rpc('app_*')` (`docs/DATABASE.md` หัวข้อ 5.2)
- log การเชื่อมต่อออก Console ผ่าน `src/services/log.ts` (ป้าย `NightOut`) — ดูวิธีเช็กใน `docs/SUPABASE.md` หัวข้อ 5
- มัดจำ/โอนเงินให้ร้านยังเป็น DRAFT (ข้อ 10.3) ห้ามเปิดรับเงินจริง
- โครงสร้างตาราง: `docs/DATABASE.md` (spec: `docs/DATABASE_CHANGES.md`) · types: `import { Db } from '@nightout/types'` (`Db.BarCard`, `Db.BarDetail` …)
- backend อ่าน view/RPC ให้หน้าเว็บ (`bar_detail`, `public_reviews`, `booking_detail`, `my_favorites`, `my_reviews`, `my_bar_detail`, `zone_availability` …) ในนามผู้เรียก (RLS) · **เขียนผ่าน NestJS เท่านั้น** (RLS ไม่เปิดให้หน้าบ้านเขียน) · `apps/admin` อ่าน view `admin_*` ผ่าน `GET /admin/views/:view` (ADMIN + MFA)
- แก้ migration แล้วต้องรัน `pnpm --filter @nightout/backend db:types` · migration ใหม่ต้องมี index บน FK + enable RLS + revoke write (ดูไฟล์ `…001500`)
