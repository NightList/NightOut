# CHANGELOG — @nightout/utils

## 2026-10-07 — กัน "ติดต่อ API ไม่ได้" หลังทิ้งแท็บไว้นานแล้วกลับมา
- `Rest` ลองส่งซ้ำ 1 ครั้ง (หน่วง 300ms) เมื่อต่อไม่ติด (`ERR_NETWORK`) เฉพาะ GET/HEAD และ request ที่ส่ง `{ retryable: true }` — POST ที่เขียนข้อมูลไม่ลองซ้ำ กันบันทึกซ้ำ
- เพิ่ม type `RestRequestConfig` (= `AxiosRequestConfig` + `retryable`) ให้ `Rest.get/post/put/patch/delete`
- log ตอนต่อไม่ติดใส่ `err.code` (ERR_NETWORK / ECONNABORTED / ERR_CANCELED) และเวลาที่ใช้ ไล่สาเหตุได้
- ที่ใช้คู่กัน: `apps/admin` และ `apps/frontend` `services/api/storage.ts` ติด `retryable` ให้ `/storage/upload-url` และ `/storage/signed-urls` (ขอ URL อย่างเดียว ส่งซ้ำได้) · `apps/backend/src/main.ts` ขยาย `keepAliveTimeout` เป็น 65 วิ (เดิม 5 วิ) ไม่ให้เบราว์เซอร์หยิบ connection ที่ server ปิดไปแล้วมาใช้
- ไฟล์: `src/rest.ts`
