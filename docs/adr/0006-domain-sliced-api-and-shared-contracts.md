# ADR 0006: จัดโค้ด API ตาม "โดเมน" (เรื่องธุรกิจ) + สัญญา API ชุดเดียวใน `packages/contracts`

- **สถานะ:** Proposed (ยังไม่ย้ายโค้ด — ทำทีละเฟสตามข้อ "แผนย้าย")
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
apps/frontend/src/services/api/<domain>.ts  # ฟังก์ชันเรียก Rest ที่ type มาจาก contracts (แทน actions.ts ก้อนเดียว)
apps/frontend/src/services/queries/<domain>.ts  # queryKey factory + useQuery/useMutation ของโดเมน
apps/admin/src/services/api/<domain>.ts     # เหมือนกันฝั่ง Backoffice
apps/backend/supabase/migrations/<ts>_<domain>_<เรื่อง>.sql   # ชื่อไฟล์ขึ้นต้นด้วยโดเมน
```

- **อ่านกับเขียนอยู่โดเมนเดียวกัน** — แยกกันด้วยวิธีเรียก DB (`selectAs`/`rpcAs` = อ่านในนามผู้เรียก · `rpc` + service_role = เขียน) ไม่ใช่ด้วยโฟลเดอร์
- **URL ไม่เปลี่ยน** (หน้าเว็บไม่พัง) · Swagger tag = ชื่อโดเมน
- โดเมนตั้งต้น: `catalog` (ร้าน/ย่าน/รีวิวสาธารณะ/ทีมหน้า about), `booking` (จอง ยกเลิก สถานะ เช็กอิน ย้ายโต๊ะ โซนว่าง), `deposit` (ส่งสลิป ตรวจ ปิดยอด คืนเงิน สมุดมัดจำ), `review`, `bar` (ข้อมูลร้าน เมนู โปร ค่าธรรมเนียม โซน safety ตั้งค่า บัญชีรับเงิน), `bar-team` (เชิญ/ลบพนักงาน), `account` (โปรไฟล์ ผู้ใช้ ชั้นบัญชี แบน), `promotion` (โปรโมทร้าน), `billing`, `site-team` (จัดการทีมงาน /about), `storage`, `system` (health, jobs)
- **contracts คือแหล่งความจริงของ type API** — หน้าเว็บ `Rest.post<Contracts.CreateBookingResult>()` ห้ามเขียน type response เอง · response ใส่ zod ด้วย (ใช้ทำ type + Swagger) แต่ backend ไม่ต้อง parse response ทุกครั้ง
- **รหัส error ประกาศคู่กับโดเมน** (`BOOKING_ERRORS = { ZONE_FULL: '…' }`) แล้ว `ERROR_MESSAGES` รวมจากทุกโดเมน
- **DB:** migration ยังเรียงตามเวลา (แก้ไฟล์เก่าไม่ได้) แต่ต้องรู้ว่า "ตัวล่าสุด" ของฟังก์ชันอยู่ไหน → `docs/DATABASE.md` มีตาราง โดเมน → ฟังก์ชัน → migration ล่าสุด และใช้ `grep -l "function public.<ชื่อ>(" apps/backend/supabase/migrations/* | tail -1` (ทางเลือกระยะยาว: Supabase declarative schemas `supabase/schemas/<domain>.sql` + `supabase db diff` ให้มีไฟล์เดียวต่อโดเมนที่เป็นสถานะปัจจุบัน)

## Considered Options
- **คงตามคนเรียก (สถานะปัจจุบัน)** — ไฟล์น้อยแต่ใหญ่ขึ้นเรื่อยๆ (merchant.controller 260 บรรทัด / 17 endpoint) และเรื่องเดียวกระจาย 6+ ไฟล์
- **Clean/Hexagonal เต็มรูป (repository, use-case class, entity)** — เกินจำเป็น: logic ธุรกิจและธุรกรรมอยู่ใน plpgsql แล้ว ชั้น repository จะเป็นแค่ wrapper ของ `rpc()`
- **tRPC / ts-rest** — ได้ type end-to-end แต่ต้องรื้อ NestJS controller + Swagger ทั้งหมด · `packages/contracts` (zod) ได้ประโยชน์หลักเดียวกันโดยไม่เปลี่ยน stack
- **สร้าง client จาก OpenAPI (orval)** — ใช้ได้ภายหลังเพราะ Swagger มาจาก zod อยู่แล้ว แต่ยังต้องมี contracts ที่ดีก่อน

## แผนย้าย (ทีละเฟส ทุกเฟส build/test ผ่าน และ URL เดิม)
0. **เอกสาร** — แก้ ARCHITECTURE หัวข้อ Backend ให้ตรงของจริง + แผนที่โดเมนใน CLAUDE.md (ทำแล้วพร้อม ADR นี้)
1. **contracts** — สร้าง `packages/contracts` · ย้าย zod จาก `*.dto.ts` ทีละโดเมน (เริ่ม `booking`, `deposit`) · backend `createZodDto(Contracts.X)`
2. **backend** — ย้าย endpoint เข้า `src/domains/<domain>/` ทีละโดเมน · ลบ `modules/query` เมื่อว่าง · ลบ module ที่ไม่มีใครใช้ (`booking.service`, `ranking.service` ตอนนี้ไม่มีคนเรียก)
3. **frontend/admin** — แตก `actions.ts` / `data.ts` / `adminData.ts` เป็น `services/api/<domain>.ts` + `services/queries/<domain>.ts` · queryKey ผ่าน factory (`bookingKeys.detail(id)`) · แยก mapper ใน `sync.ts` ตามโดเมน
4. **DB map** — ตารางโดเมน → ฟังก์ชัน → migration ล่าสุด ใน `docs/DATABASE.md` · migration ใหม่ตั้งชื่อ `<ts>_<domain>_<เรื่อง>.sql`

## Consequences
- งานใหม่ (ทั้งคนและ AI) เริ่มจากชื่อโดเมน → เปิด 4 ที่ตายตัว
- ระหว่างย้าย มีทั้งโครงเก่าและใหม่ — โค้ดใหม่ให้ลงโครงใหม่เลย ของเก่าย้ายเมื่อแตะ
- `packages/contracts` เป็น dependency ใหม่ของ backend + 2 แอป (zod อย่างเดียว)
