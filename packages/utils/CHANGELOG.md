# CHANGELOG — @nightout/utils

## 2026-10-09 — Rest: แกะ ApiResponse ให้
- backend ตอบ `{ status, status_code, data, code, err_msg }` ทุกเส้น → `Rest.get/post/…` คืน `data` ให้เลย (หน้าเว็บไม่ต้องเช็ก `status`) · `status: 'no'` (แม้ HTTP 2xx) หรือ HTTP error → `ApiError(status_code, code)` ข้อความ = `err_msg` · ไม่มี err_msg = ใช้ `errorMessages` เหมือนเดิม · `unauthorizedCode` ยังชนะบน 401
- `ApiError` รับข้อความตัวที่ 3 ได้ · คำตอบแบบเก่า (ไม่ห่อ) ยังใช้ได้
- ไฟล์: `src/rest.ts` · เทสต์ `src/rest.test.ts`

## 2026-10-08 — Rest: afterWrite
- `RestConfig.afterWrite` — เรียกหลัง POST/PUT/PATCH/DELETE ที่สำเร็จ และรอให้เสร็จก่อนคืนผล (frontend ใช้โหลด store ใหม่ คนเรียกไม่ต้อง `refresh()` เอง) · error ใน afterWrite แค่ log ไม่ทำให้การเขียนล้ม · ไม่ตั้ง = เหมือนเดิม (admin)
- ไฟล์: `src/rest.ts` · เทสต์ `src/rest.test.ts`

## 2026-10-08 — ลองซ้ำนานขึ้นเมื่อต่อ API ไม่ติด (backend รีสตาร์ตตอน dev)
- `Rest` ลองซ้ำสูงสุด 3 ครั้ง หน่วง 0.5 / 1 / 2 วิ (`RETRY_DELAYS_MS` · รวม ~3.5 วิ) เมื่อ `ERR_NETWORK` — เดิม 1 ครั้ง 300ms ไม่พอให้ NestJS ที่ `node --watch` รีสตาร์ตบูตเสร็จ (เกิดบ่อยตอน contracts/utils build ใหม่)
- ลองซ้ำอัตโนมัติ: GET / HEAD / **PUT / DELETE** (idempotent — เดิมแค่ GET/HEAD) + request ที่ตั้ง `retryable` · POST / PATCH ยังไม่ลองซ้ำ กันบันทึกซ้ำ
- log บอกรอบ (`ลองใหม่ครั้งที่ n/3`) และเวลารวมทุกรอบ (คง `t0` เดิมไว้)
- เทสต์: ลองซ้ำจนผ่าน · ครบรอบแล้วยอมแพ้ · POST/PATCH ไม่ลองซ้ำ ยกเว้น `retryable`
- ไฟล์: `src/rest.ts`, `src/rest.test.ts`

## 2026-10-07 — กัน "ติดต่อ API ไม่ได้" หลังทิ้งแท็บไว้นานแล้วกลับมา
- `Rest` ลองส่งซ้ำ 1 ครั้ง (หน่วง 300ms) เมื่อต่อไม่ติด (`ERR_NETWORK`) เฉพาะ GET/HEAD และ request ที่ส่ง `{ retryable: true }` — POST ที่เขียนข้อมูลไม่ลองซ้ำ กันบันทึกซ้ำ
- เพิ่ม type `RestRequestConfig` (= `AxiosRequestConfig` + `retryable`) ให้ `Rest.get/post/put/patch/delete`
- log ตอนต่อไม่ติดใส่ `err.code` (ERR_NETWORK / ECONNABORTED / ERR_CANCELED) และเวลาที่ใช้ ไล่สาเหตุได้
- ที่ใช้คู่กัน: `apps/admin` และ `apps/frontend` `services/api/storage.ts` ติด `retryable` ให้ `/storage/upload-url` และ `/storage/signed-urls` (ขอ URL อย่างเดียว ส่งซ้ำได้) · `apps/backend/src/main.ts` ขยาย `keepAliveTimeout` เป็น 65 วิ (เดิม 5 วิ) ไม่ให้เบราว์เซอร์หยิบ connection ที่ server ปิดไปแล้วมาใช้
- ไฟล์: `src/rest.ts`
