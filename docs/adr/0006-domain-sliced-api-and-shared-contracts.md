# ADR 0006: จัดโค้ด API ตาม "โดเมน" (เรื่องธุรกิจ) + สัญญา API ชุดเดียวใน `packages/contracts`

- **สถานะ:** Accepted (ทำครบ 4 เฟสแล้ว 2026-10-06 — URL ทั้ง 74 เส้นคงเดิม)
- **วันที่:** 2026-10-06
- **เกี่ยวข้อง:** ADR 0001–0004 (การเขียน/อ่านผ่าน NestJS, Rest client กลาง)

## Context
ตอนนี้โค้ดแบ่งตาม **คนเรียก** (customer / merchant / admin) และแยก **อ่าน/เขียน** คนละโฟลเดอร์ (`modules/query/*-read.controller.ts`) ทำให้เรื่องเดียวกระจายหลายที่ ตัวอย่าง "การจอง + มัดจำ" ต้องเปิด:

| ชั้น | ไฟล์ที่ต้องเปิด |
|---|---|
| Backend | `customer.controller` (จอง/ยกเลิก/ส่งสลิป) · `merchant.controller` (สถานะ/เช็กอิน/ย้ายโต๊ะ/คืนเงิน) · `admin.controller` (ตรวจสลิป/ปิดยอด) · `me-read` / `merchant-read` / `admin-read` · DTO 3 ไฟล์ |
| DB | `001700_app_actions` (1,100+ บรรทัด) + ไฟล์ที่ประกาศฟังก์ชันเดิมซ้ำทีหลัง (เช่น `app_create_booking` → `20261006000200`, `admin_review_deposit` → `20261006000100`, `booking_deposit_summary` 3 ไฟล์) |
| Frontend | `services/actions.ts` (ทุกการเขียนทุกโดเมน) · `services/data.ts` (hook) · `services/sync.ts` (526 บรรทัด แปลงทุกอย่างลง store) · `packages/mock/models.ts` (type ที่หน้าใช้) |
| Admin | `services/adminData.ts` + หน้า |
| Type | `packages/types/database.ts` (override) · type inline ใน `Rest.post<{ … }>` · zod ใน backend (หน้าเว็บใช้ไม่ได้) |

ผลที่เจอจริง: type ฝั่งหน้าเว็บเพี้ยนจาก API (เช่น `REFUND_PENDING` ถูกซ่อน, `refundBeforeHours` ไม่ถูก map), ต้องเดาว่าฟังก์ชัน DB ตัวล่าสุดอยู่ไฟล์ไหน และ `docs/ARCHITECTURE.md` หัวข้อ Backend เขียนถึงสิ่งที่ไม่มีจริง (Kysely, repository, outbox)

สิ่งที่ **ดีอยู่แล้วและคงไว้:** controller บาง → เรียก `app_*`/`admin_*` ใน DB (ธุรกรรม + ตรวจสิทธิ์ซ้ำใน DB), อ่านในนามผู้เรียกให้ RLS ทำงาน, zod + `@ApiDoc`, snake_case, `Rest` กลาง, รหัส error ตัวใหญ่ + `ERROR_MESSAGES`

## Decision
**1 โดเมน = ชื่อเดียวกันใน 4 ที่** — grep คำเดียวเจอครบ

```
packages/contracts/src/<domain>.ts          # zod ของ body / query / response + รหัส error ของโดเมน (ไม่มี Nest/React)
apps/backend/src/domains/<domain>/
  <domain>.module.ts
  <domain>.public.controller.ts             # แยกไฟล์ตาม "คนเรียก" ภายในโดเมน (guard ต่างกัน) — มีเฉพาะที่ใช้
  <domain>.me.controller.ts                 #   ลูกค้าที่ล็อกอิน
  <domain>.merchant.controller.ts           #   ทีมร้าน
  <domain>.admin.controller.ts              #   Backoffice (SupabaseJwtGuard + AdminGuard)
  <domain>.dto.ts                           # class X extends createZodDto(Contracts.X) — ไม่ประกาศ zod ซ้ำ
  <domain>.service.ts                       # มีเมื่อมี logic มากกว่าเรียก rpc 1 ครั้ง (เช่น สร้างบัญชี Auth + rpc)
  <domain>.test.ts
apps/frontend/src/services/api/<domain>.ts  # ฟังก์ชันเรียก Rest ที่ type มาจาก contracts (แทน actions.ts ก้อนเดียว) · เขียนแล้ว refresh()
apps/frontend/src/services/queries/<domain>.ts  # hook TanStack Query ของโดเมน · queries/keys.ts = queryKey factory
apps/frontend/src/services/mappers/<domain>.ts  # แถวจาก view → model ที่หน้าเว็บใช้ (แยกจาก sync.ts)
apps/frontend/src/services/data.ts          # หน้าต่างเดียวที่หน้า import (re-export ทั้งหมด) — หน้าไม่แก้ import
apps/admin/src/services/api|queries/<domain>.ts   # เหมือนกันฝั่ง Backoffice · adminData.ts เป็นหน้าต่าง
apps/backend/supabase/migrations/<ts>_<domain>_<เรื่อง>.sql   # ชื่อไฟล์ขึ้นต้นด้วยโดเมน · แผนที่ฟังก์ชัน → ไฟล์ล่าสุดใน docs/DATABASE.md ข้อ 5.0
```

- **อ่านกับเขียนอยู่โดเมนเดียวกัน** — แยกกันด้วยวิธีเรียก DB (`selectAs`/`rpcAs` = อ่านในนามผู้เรียก · `rpc` + service_role = เขียน) ไม่ใช่ด้วยโฟลเดอร์
- **URL ไม่เปลี่ยน** (หน้าเว็บไม่พัง) · Swagger tag = ชื่อโดเมน
- โดเมน: `catalog` (ร้าน/ย่าน/รีวิวสาธารณะ/ตั้งค่า/แพ็กเกจ ตอนเปิดเว็บ), `booking` (จอง ยกเลิก สถานะ เช็กอิน ย้ายโต๊ะ โซนว่าง บัตรแชร์), `deposit` (ส่งสลิป ตรวจ ปิดยอด คืนเงิน สมุดมัดจำ), `review`, `bar` (สมัครลงร้าน ข้อมูลร้าน เมนู โปร ค่าธรรมเนียม โซน safety ตั้งค่า บัญชีรับเงิน ความแน่น อนุมัติ), `bar-team` (เชิญ/นำออก/คำเชิญ), `account` (โปรไฟล์ overview แจ้งเตือน ร้านโปรด ลบบัญชี · ผู้ใช้ ชั้นบัญชี แบน), `promotion` (โปรโมทร้าน), `billing`, `site-team` (ทีมงานหน้า /about ทั้งอ่านสาธารณะและจัดการ), `storage`, `pricing`, `backoffice` (การอ่านของหน้าแอดมิน) · `health` / `jobs` อยู่นอก domains (ระบบ)
- **contracts คือแหล่งความจริงของ type API** — หน้าเว็บ `Rest.post<Contracts.CreateBookingResult>()` ห้ามเขียน type response เอง · response ใส่ zod ด้วย (ใช้ทำ type + Swagger) แต่ backend ไม่ต้อง parse response ทุกครั้ง
- **รหัส error ประกาศคู่กับโดเมน** (`BOOKING_ERRORS = { ZONE_FULL: '…' }`) แล้ว `ERROR_MESSAGES` ใน `contracts/errors.ts` รวมจากทุกโดเมน → ส่งให้ `Rest.configure({ errorMessages })` (utils import contracts ไม่ได้เพราะ contracts พึ่ง utils)
- **DB:** migration ยังเรียงตามเวลา (แก้ไฟล์เก่าไม่ได้) แต่ต้องรู้ว่า "ตัวล่าสุด" ของฟังก์ชันอยู่ไหน → `docs/DATABASE.md` มีตาราง โดเมน → ฟังก์ชัน → migration ล่าสุด และใช้ `grep -l "function public.<ชื่อ>(" apps/backend/supabase/migrations/* | tail -1` (ทางเลือกระยะยาว: Supabase declarative schemas `supabase/schemas/<domain>.sql` + `supabase db diff` ให้มีไฟล์เดียวต่อโดเมนที่เป็นสถานะปัจจุบัน)

## Considered Options
- **คงตามคนเรียก (สถานะปัจจุบัน)** — ไฟล์น้อยแต่ใหญ่ขึ้นเรื่อยๆ (merchant.controller 260 บรรทัด / 17 endpoint) และเรื่องเดียวกระจาย 6+ ไฟล์
- **Clean/Hexagonal เต็มรูป (repository, use-case class, entity)** — เกินจำเป็น: logic ธุรกิจและธุรกรรมอยู่ใน plpgsql แล้ว ชั้น repository จะเป็นแค่ wrapper ของ `rpc()`
- **tRPC / ts-rest** — ได้ type end-to-end แต่ต้องรื้อ NestJS controller + Swagger ทั้งหมด · `packages/contracts` (zod) ได้ประโยชน์หลักเดียวกันโดยไม่เปลี่ยน stack
- **สร้าง client จาก OpenAPI (orval)** — ใช้ได้ภายหลังเพราะ Swagger มาจาก zod อยู่แล้ว แต่ยังต้องมี contracts ที่ดีก่อน

## ที่ทำแล้ว (4 เฟส · แต่ละเฟส 1 commit · lint/typecheck/test/build ผ่านทุกเฟส)
1. **contracts** — `packages/contracts` 13 ไฟล์โดเมน + `errors.ts` · `*.dto.ts` ของ backend เหลือ `createZodDto(C.X)` · เทสต์ DTO ย้ายไป `contracts.test.ts`
2. **backend** — `src/domains/<domain>/` 13 โดเมน · ลบ `modules/` ทั้งหมด รวม `booking.service` / `ranking.service` / `notification.service` ที่ไม่มีคนเรียก · route table 74 เส้นเท่าเดิม (เทียบก่อน/หลัง) · Swagger tag = โดเมน
3. **frontend/admin** — `services/api|queries|mappers/<domain>.ts` · `data.ts` / `adminData.ts` เป็นหน้าต่าง re-export (หน้าไม่แก้) · type เข้มขึ้นจับที่หลวมได้ 4 จุด (สถานะที่ร้านสั่งได้, BarCategory, ชนิดลิงก์, settlement ที่เคยซ่อน)
4. **เอกสาร** — DATABASE.md ข้อ 5.0 แผนที่โดเมน → ฟังก์ชัน → migration ล่าสุด · ARCHITECTURE หัวข้อ 3–4 · CLAUDE.md checklist
- ทดสอบกับ Postgres + PostgREST จริง: API scenario (จอง → สลิป → แบน → ปลดแบน → ย้ายโต๊ะ → คืนเงิน) + ทุก endpoint อ่าน + Playwright ทุกหน้าลูกค้า/ร้าน/แอดมิน — ไม่มี request ล้มเหลว

## Consequences
- งานใหม่ (ทั้งคนและ AI) เริ่มจากชื่อโดเมน → เปิด 4 ที่ตายตัว (contracts → backend domains → services/api+queries → migration map)
- `packages/contracts` เป็น dependency ของ backend + 2 แอป (zod อย่างเดียว) · utils ↛ contracts (contracts พึ่ง utils) จึงส่ง `ERROR_MESSAGES` ผ่าน `Rest.configure`
- migration ยังเรียงตามเวลา (แก้ไฟล์เก่าไม่ได้) — ตารางข้อ 5.0 ต้องอัปเดตเมื่อประกาศฟังก์ชันซ้ำในไฟล์ใหม่ · ทางเลือกระยะยาว: Supabase declarative schemas
