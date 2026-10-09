import type { Db } from '@nightout/types';
import { galleryCoverPath, storagePublicUrl } from '@nightout/utils';

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SOURCE_IMAGE = 15 * 1024 * 1024;

/** URL ถาวรของรูปใน bucket bar-media (public) */
export const mediaUrl = (path: string) =>
  storagePublicUrl(import.meta.env.VITE_SUPABASE_URL ?? '', 'bar-media', path);

/** path ของรูปปก (หนึ่งในแกลเลอรี) ของแถวใน admin_bar_media */
export const coverPathOf = (row: Pick<Db.AdminBarMedia, 'cover_image_url' | 'media'>) =>
  galleryCoverPath(
    row.cover_image_url,
    row.media.map((m) => m.storage_path),
  );

/** ตรวจไฟล์ก่อนอัปโหลด — คืนข้อความผิดพลาด หรือ null ถ้าใช้ได้ */
export function checkImage(file: File): string | null {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type))
    return `${file.name}: ใช้ได้เฉพาะรูป JPG, PNG หรือ WebP`;
  if (file.size > MAX_SOURCE_IMAGE) return `${file.name}: รูปใหญ่เกิน 15MB`;
  return null;
}
