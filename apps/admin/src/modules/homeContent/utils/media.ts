import { Rest } from '@nightout/utils/rest';
import { requestUploadUrl } from '@/services/api/storage';
import { toWebp } from '@/ui/utils/image';

export const MAX_SOURCE_IMAGE = 15 * 1024 * 1024;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * อัปโหลดภาพหน้าแรกเข้า bucket site-media (public) → คืน URL ถาวร
 * ย่อเป็น webp ก่อน: Hero ด้านยาว 2560px · การ์ดหมวด 1280px (bucket รับไม่เกิน 5MB)
 */
export async function uploadSiteImage(file: File, kind: 'hero' | 'category'): Promise<string> {
  const blob = await toWebp(file, kind === 'hero' ? 2560 : 1280, 0.82);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg');
  const path = `home/${kind}/${crypto.randomUUID()}.${ext}`;
  const { upload_url, public_url } = await requestUploadUrl('site-media', path);
  await Rest.upload(upload_url, blob, { 'x-upsert': 'false' });
  if (!public_url) throw new Error('ไม่ได้ URL ของรูปกลับมา');
  return public_url;
}

/** ตรวจไฟล์ก่อนอัปโหลด — คืนข้อความผิดพลาด หรือ null ถ้าใช้ได้ */
export function checkImage(file: File): string | null {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return 'ใช้ได้เฉพาะรูป JPG, PNG หรือ WebP';
  if (file.size > MAX_SOURCE_IMAGE) return 'รูปใหญ่เกิน 15MB';
  return null;
}
