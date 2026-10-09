/** ชนิดรูปที่อัปโหลดเป็นรูปร้าน/รูปเมนูได้ (bucket bar-media) */
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_PHOTO_SOURCE = 15 * 1024 * 1024;

/** ตรวจไฟล์รูปก่อนย่อ/อัปโหลด — คืนข้อความผิดพลาด หรือ null ถ้าใช้ได้ */
export function checkPhoto(file: File): string | null {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return `${file.name}: ใช้ได้เฉพาะรูป JPG, PNG หรือ WebP`;
  if (file.size > MAX_PHOTO_SOURCE) return `${file.name}: รูปใหญ่เกิน 15MB`;
  return null;
}

/** ย่อรูปก่อนเก็บ (ด้านยาวสุด maxSide px, JPEG) — รูปมือถือ 4–12MB เหลือ ~100–200KB */
export function compressImage(file: File, maxSide = 1280, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('อ่านรูปไม่ได้'));
    img.src = URL.createObjectURL(file);
  });
}

/** อ่านความยาว + จับภาพหน้าปกที่วินาทีที่ ~0.5 ของวิดีโอ */
export function probeVideo(file: File): Promise<{ duration: number; poster: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.src = url;
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    };
    v.onseeked = () => {
      const scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(v.videoWidth * scale) || 320;
      c.height = Math.round(v.videoHeight * scale) || 180;
      c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
      const poster = c.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(url);
      resolve({ duration: v.duration, poster });
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('อ่านวิดีโอไม่ได้ (รองรับ MP4 / MOV / WebM)'));
    };
  });
}

export const fmtDuration = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
