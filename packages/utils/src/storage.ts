/**
 * Supabase Storage — URL ถาวรของไฟล์ใน bucket public (team-photos, site-media, bar-media)
 * ใช้ร่วม: backend (`SupabaseService.publicUrl`) · หน้าเว็บ/Backoffice แสดงรูปร้านและรูปเมนูจาก path ใน view
 */
export function storagePublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  const object = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${object}`;
}

/** โฟลเดอร์รูปร้านใน bucket bar-media — `<bar_id>/gallery/…` (ปก + แกลเลอรี) · `<bar_id>/menu/…` (รูปเมนู) */
export type BarMediaFolder = 'gallery' | 'menu';

/** path ใหม่สำหรับอัปโหลดรูปร้าน (ชื่อไฟล์สุ่ม ไม่ทับไฟล์เดิม) — DB ตรวจรูปแบบเดียวกันใน `bar_media_path_ok` */
export function barMediaPath(
  barId: string,
  folder: BarMediaFolder,
  ext: string,
  id: string = crypto.randomUUID(),
): string {
  return `${barId}/${folder}/${id}.${ext.replace(/^\./, '').toLowerCase()}`;
}

/** path ของรูปปกในแกลเลอรี — `cover_image_url` เป็น URL เต็มที่ลงท้ายด้วย `/bar-media/<path>` (โดเมน Storage ของแต่ละแอปอาจเขียนต่างกัน) */
export function galleryCoverPath(
  coverUrl: string | null | undefined,
  paths: readonly string[],
): string | null {
  if (!coverUrl) return null;
  return paths.find((p) => coverUrl.endsWith(`/bar-media/${p}`)) ?? null;
}

/** ลำดับแกลเลอรีที่บันทึก: ปกขึ้นก่อน แล้วตามด้วยรูปอื่นตามลำดับเดิม */
export function coverFirst(paths: readonly string[], cover: string | null): string[] {
  return cover && paths.includes(cover) ? [cover, ...paths.filter((p) => p !== cover)] : [...paths];
}
