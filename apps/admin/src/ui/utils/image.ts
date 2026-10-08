/** ย่อรูปฝั่งเบราว์เซอร์ก่อนอัปโหลด — ด้านยาวสุด `max` px · webp (รูปจากกล้องหลาย MB เหลือไม่กี่ร้อย KB) */
export async function toWebp(file: File, max = 800, quality = 0.85): Promise<Blob> {
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

/**
 * URL สำหรับแสดงรูปใน Backoffice
 * รูปตั้งต้นหลายอย่างเป็น path ใน public/ ของเว็บลูกค้า (เช่น /images/teams/san.webp)
 * deploy: โดเมนเดียวกัน ใช้ได้เลย · dev: Backoffice อยู่คนละ port → ชี้ไปเว็บลูกค้า (localhost:5173)
 */
export function webSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/') && import.meta.env.DEV) return `http://localhost:5173${url}`;
  return url;
}
