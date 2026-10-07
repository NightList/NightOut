import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** storage — URL อัปโหลด / URL ชั่วคราวของไฟล์ใน bucket ส่วนตัว · backend: domains/storage */

/** ขอ URL อย่างเดียว ไม่เขียนข้อมูล → ต่อไม่ติดแล้วลองซ้ำได้ (Rest retryable) */
const RETRYABLE = { retryable: true } as const;

export async function requestUploadUrl(bucket: C.UploadBucket, path: string) {
  return Rest.post<C.UploadUrlResult>('/storage/upload-url', { bucket, path } satisfies C.UploadUrlBody, RETRYABLE);
}

/** URL ชั่วคราวของไฟล์เดียว — null ถ้าไม่มีสิทธิ์/ไม่พบ */
export async function signedUrl(bucket: C.UploadBucket, path: string, seconds = 600) {
  try {
    const { urls } = await Rest.post<C.SignedUrlsResult>('/storage/signed-urls', { bucket, paths: [path], expires_in: seconds } satisfies C.SignedUrlsBody, RETRYABLE);
    return urls[path] ?? null;
  } catch {
    return null;
  }
}
