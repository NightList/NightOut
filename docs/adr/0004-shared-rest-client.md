# ADR 0004: Rest client กลางใน `@nightout/utils/rest` ใช้ร่วมทุกแอปหน้าบ้าน

- **สถานะ:** Accepted
- **วันที่:** 2026-10-03
- **แก้รายละเอียดของ:** [ADR 0002](0002-migrate-direct-db-calls-to-backend-api.md) ข้อ 2 และ [ADR 0003](0003-migrate-admin-direct-db-calls-to-backend-api.md) ข้อ 1 (ที่ให้แต่ละแอปมี `src/services/apiClient.ts` ของตัวเอง)

## Context
หลัง ADR 0002/0003 `apps/frontend` และ `apps/admin` ต่างมี `services/apiClient.ts` ที่โค้ดเกือบเหมือนกัน (axios instance, interceptor, แปลง error, `Rest.*`) ต่างกันแค่ token มาจาก Supabase client คนละตัว, พจนานุกรม error และ Backoffice แปลง 401 เป็น `MFA_REQUIRED` — แก้ทีต้องแก้ 2 ที่ และจะเพี้ยนกันไปเรื่อยๆ

## Decision
- ย้ายเป็น **class `Rest` (static) ที่เดียว** `packages/utils/src/rest.ts` export ผ่าน entry แยก `@nightout/utils/rest`
  - `Rest.configure({ baseURL, getAccessToken, logger, unauthorizedCode, timeout })` — เรียกครั้งเดียวใน `main.tsx` ของแต่ละแอป (ส่วนที่ต่างกันส่งเป็น config)
  - `Rest.get/post/put/patch/delete<T>()` · `Rest.upload(url, file)` (PUT ไฟล์เข้า signed URL) · `Rest.ping()` · `Rest.baseURL`
  - `ApiError`, `ERROR_MESSAGES` (ข้อความไทยชุดเดียวของทุกแอป), `apiBaseUrlFromEnv(import.meta.env)`
- ลบ `apps/*/src/services/apiClient.ts` · `axios` เป็น dependency ของ `@nightout/utils` เท่านั้น
- entry แยก (ไม่ export จาก `@nightout/utils` หลัก) เพื่อให้ backend ที่ใช้ตัวคำนวณราคาไม่ต้องโหลด axios · Vite ของทั้ง 2 แอป alias `@nightout/utils/rest` ไปที่ source

## Consequences
- แก้พฤติกรรม HTTP (timeout, header, log, ข้อความ error) ที่เดียว มีเทสต์ (`packages/utils/src/rest.test.ts`)
- `Rest` เป็น static state ต่อแอป — ต้อง `configure()` ก่อนเรียก ไม่งั้นโยน error ที่บอกวิธีแก้ (เรียกใน `main.tsx` ก่อน render)
- เพิ่ม/แก้ข้อความ error → `ERROR_MESSAGES` ใน package · รหัสที่ซ้ำกันระหว่าง 2 แอปใช้ข้อความกลางชุดเดียว
- ไม่มี breaking change ใน UI (hook / service / ชื่อฟังก์ชันเดิม)
