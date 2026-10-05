import { Rest } from '@nightout/utils/rest';

/** ย่อรูปฝั่งเบราว์เซอร์ก่อนอัปโหลด — ด้านยาวสุด 800px · webp (รูปจากกล้องหลาย MB เหลือ ~50–150KB) */
async function toWebp(file: File, max = 800, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
  return blob ?? file;
}

/** อัปโหลดรูปโปรไฟล์ทีมงานเข้า bucket team-photos (public) → คืน URL ถาวรสำหรับ photo_url */
export async function uploadTeamPhoto(file: File): Promise<string> {
  const blob = await toWebp(file);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg');
  const path = `team/${crypto.randomUUID()}.${ext}`;
  const { upload_url, public_url } = await Rest.post<{
    upload_url: string;
    public_url: string | null;
  }>('/storage/upload-url', {
    bucket: 'team-photos',
    path,
  });
  await Rest.upload(upload_url, blob, { 'x-upsert': 'false' });
  if (!public_url) throw new Error('ไม่ได้ URL ของรูปกลับมา');
  return public_url;
}

/**
 * URL สำหรับแสดงรูปใน Backoffice
 * photo_url ของทีมตั้งต้นเป็น path ใน public/ ของเว็บลูกค้า (เช่น /images/teams/san.webp)
 * deploy: โดเมนเดียวกัน ใช้ได้เลย · dev: Backoffice อยู่คนละ port → ชี้ไปเว็บลูกค้า (localhost:5173)
 */
export function photoSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/') && import.meta.env.DEV) return `http://localhost:5173${url}`;
  return url;
}
