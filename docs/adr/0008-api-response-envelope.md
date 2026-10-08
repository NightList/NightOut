# ADR 0008: ทุกคำตอบของ API เป็นรูปแบบเดียว `ApiResponse`

- **สถานะ:** Accepted
- **วันที่:** 2026-10-09

## Context
เดิมเส้นที่สำเร็จตอบ data ตรงๆ ส่วน error ตอบรูปแบบของ Nest (`{ statusCode, message, error }`) แล้วหน้าเว็บต้องแปลรหัสเป็นข้อความไทยเอง ผลคือคำตอบมี 2 รูปแบบ และข้อความ error อยู่ฝั่งหน้าเว็บ

## Decision
ทุก endpoint ตอบรูปแบบ `ApiResponse<T>` (`packages/contracts/src/common.ts`)

```jsonc
{ "status": "ok", "status_code": 201, "data": { "id": "…" }, "code": null, "err_msg": null }
{ "status": "no", "status_code": 409, "data": null, "code": "ZONE_FULL", "err_msg": "โซนนี้เต็มแล้ว" }
```

**ตัวกลาง 2 ฝั่ง:**
- **backend:** `ApiResponseInterceptor` ห่อคำตอบที่สำเร็จ และ `ApiExceptionFilter` แปลง error ทุกแบบ (zod, guard, throttler, Supabase, bug) ทั้งสองอยู่ใน `apps/backend/src/common/api-response.ts` และลงทะเบียนครั้งเดียวใน `app.module.ts` ส่วน controller คืน data ตามปกติ
- **หน้าเว็บ:** `Rest` แกะ `data` คืนให้คนเรียก และ throw `ApiError(status_code, code)` เมื่อ `status` ไม่ใช่ `ok` โดย `message` เป็นค่าจาก `err_msg` คนเรียกจึงไม่ต้องเช็ก `status` เอง และ TanStack Query เห็น error จากการ throw ตามปกติ

**กติกา:**
- HTTP status ยังเป็นค่าจริง (400/401/404/409/500) และ `status_code` เป็นค่าเดียวกัน ไม่ตอบ 200 ทุกครั้ง เพื่อให้ log, monitoring และ retry ยังทำงานถูก
- `code` คือรหัสคงที่ไว้ให้โค้ดใช้ตัดสินใจ ส่วน `err_msg` คือข้อความไทยไว้แสดงผู้ใช้ (`errorMessageOf(code)` จาก `ERROR_MESSAGES`)
- validation ใช้ `code` = `VALIDATION_FAILED` และใส่ชื่อ field ไว้ใน `err_msg` · 429 ใช้ `TOO_MANY_REQUESTS` · error ที่ไม่รู้จักใช้ 500 `INTERNAL_ERROR` และ log stack ฝั่ง server

## Consequences
- **ได้:**
  - คำตอบรูปแบบเดียวทุกเส้น
  - ข้อความ error มีที่เดียวคือ backend
  - หน้าเว็บกับ `api.ts` ไม่ต้องแก้
- **เสีย:**
  - คนเรียก API นอก `Rest` (curl, uptime monitor, Swagger) ต้องอ่าน `data`
  - "returns" ใน `@ApiDoc` หมายถึงสิ่งที่อยู่ใน `data`
