import type { ReviewMediaItem, SignedUrlsResult, UploadBucket, UploadUrlResult } from '@nightout/contracts';
import type { ReviewMedia } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';
import { log } from '@/services/log';
import { getBlob } from '@/services/mediaStore';

/**
 * storage — อัปโหลดไฟล์ตาม policy ของแต่ละ bucket (โฟลเดอร์แรก = เจ้าของ) · backend: domains/storage
 *   deposit-slips/<user_id>/...   review-media/<user_id>/<review_id>/...   promo-slips/<bar_id>/...
 * 1) ขอ URL อัปโหลดจาก API (POST /storage/upload-url — Storage policy ตรวจสิทธิ์ในนามผู้ใช้)
 * 2) PUT ไฟล์ตรงเข้า URL นั้น (ไฟล์ใหญ่อย่างวิดีโอรีวิวไม่ต้องผ่าน API) · NestJS รับแค่ path แล้วตรวจซ้ำใน DB
 */
const ext = (f: Blob) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' })[f.type] ?? 'bin';

export type { UploadBucket };

/** ขอ URL อย่างเดียว ไม่เขียนข้อมูล → ต่อไม่ติดแล้วลองซ้ำได้ (Rest retryable) */
const RETRYABLE = { retryable: true } as const;

async function upload(bucket: UploadBucket, path: string, file: Blob): Promise<string> {
  const { upload_url } = await Rest.post<UploadUrlResult>('/storage/upload-url', { bucket, path }, RETRYABLE);
  try {
    // URL มี token ในตัว — Rest.upload ไม่แนบ baseURL / Bearer ของ API
    await Rest.upload(upload_url, file, { 'x-upsert': 'false' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error(`อัปโหลดไฟล์ไม่สำเร็จ ${bucket}/${path}`, msg);
    throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${msg}`, { cause: e });
  }
  log.info(`อัปโหลดไฟล์ ${bucket}/${path} (${Math.round(file.size / 1024)} KB)`);
  return path;
}

/** URL ชั่วคราวของไฟล์หลายไฟล์ใน bucket เดียว (ขอครั้งละ ≤ 500) — คืน path → URL เฉพาะไฟล์ที่มีสิทธิ์ */
export async function signedUrls(bucket: UploadBucket, paths: string[], seconds = 6 * 3600): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 500) {
    const { urls } = await Rest.post<SignedUrlsResult>('/storage/signed-urls', {
      bucket,
      paths: paths.slice(i, i + 500),
      expires_in: seconds,
    }, RETRYABLE);
    for (const [p, u] of Object.entries(urls)) out.set(p, u);
  }
  return out;
}

export const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

export function uploadDepositSlip(userId: string, bookingId: string, file: Blob) {
  return upload('deposit-slips', `${userId}/${bookingId}-${Date.now()}.${ext(file)}`, file);
}

export function uploadPromoSlip(barId: string, file: Blob) {
  return upload('promo-slips', `${barId}/${Date.now()}.${ext(file)}`, file);
}

export function uploadSafetyEvidence(barId: string, key: string, file: Blob) {
  return upload('bar-verifications', `${barId}/safety-${key.toLowerCase()}-${Date.now()}.${ext(file)}`, file);
}

/** อัปโหลดรูป/วิดีโอจากตัวเลือกรีวิว (รูป = data URL ที่ย่อแล้ว · วิดีโอ = ไฟล์ใน IndexedDB) */
export async function uploadReviewMedia(userId: string, reviewId: string, media: ReviewMedia[]) {
  const out: ReviewMediaItem[] = [];
  for (const [i, m] of media.entries()) {
    const base = `${userId}/${reviewId}/${i + 1}`;
    if (m.type === 'image') {
      if (!m.src) continue;
      const blob = await dataUrlToBlob(m.src);
      out.push({ path: await upload('review-media', `${base}.${ext(blob)}`, blob), kind: 'IMAGE', size_bytes: blob.size });
    } else {
      const blob = m.blobKey ? await getBlob(m.blobKey) : null;
      if (!blob) continue;
      const path = await upload('review-media', `${base}.${ext(blob)}`, blob);
      const thumb = m.poster ? await upload('review-media', `${base}-poster.jpg`, await dataUrlToBlob(m.poster)) : undefined;
      out.push({ path, kind: 'VIDEO', thumb_path: thumb, duration_sec: m.duration ? Math.round(m.duration) : undefined, size_bytes: blob.size });
    }
  }
  return out;
}

/** URL ชั่วคราวของไฟล์ส่วนตัว (เช่นสลิปของฉัน) */
export async function signedUrl(bucket: UploadBucket, path: string, seconds = 600) {
  try {
    return (await signedUrls(bucket, [path], seconds)).get(path) ?? null;
  } catch {
    return null;
  }
}
