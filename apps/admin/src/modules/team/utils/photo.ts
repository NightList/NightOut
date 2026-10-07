import { Rest } from '@nightout/utils/rest';
import { requestUploadUrl } from '@/services/api/storage';
import { toWebp, webSrc } from '@/ui/utils/image';

/** อัปโหลดรูปโปรไฟล์ทีมงานเข้า bucket team-photos (public) → คืน URL ถาวรสำหรับ photo_url */
export async function uploadTeamPhoto(file: File): Promise<string> {
  const blob = await toWebp(file);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg');
  const path = `team/${crypto.randomUUID()}.${ext}`;
  const { upload_url, public_url } = await requestUploadUrl('team-photos', path);
  await Rest.upload(upload_url, blob, { 'x-upsert': 'false' });
  if (!public_url) throw new Error('ไม่ได้ URL ของรูปกลับมา');
  return public_url;
}

/** URL สำหรับแสดงรูปทีมงานใน Backoffice (path ใน public/ ของเว็บลูกค้า → ชี้ไปเว็บลูกค้าตอน dev) */
export const photoSrc = webSrc;
