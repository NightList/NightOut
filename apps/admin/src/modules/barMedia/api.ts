import type * as C from '@nightout/contracts';
import { barMediaPath, type BarMediaFolder } from '@nightout/utils';
import { Rest } from '@nightout/utils/rest';
import { useAdminView, type AdminActionInput } from '@/services/adminData';
import { requestUploadUrl } from '@/services/api/storage';
import { toWebp } from '@/ui/utils/image';

/** API ของหน้ารูปร้าน · backend: domains/backoffice (อ่าน admin_bar_media) · domains/bar (bar.admin.controller.ts) */

/** GET /admin/views/admin_bar_media เรียงตามชื่อร้าน */
export const useBarMedia = () =>
  useAdminView('admin_bar_media', { order: { column: 'name', ascending: true } });

/** PUT /admin/bars/:id/media — แกลเลอรีทั้งชุด + รูปปก (ส่งให้ useAdminAction().mutate พร้อม success) */
export const barMediaAction = (barId: string, body: C.BarMediaBody): AdminActionInput => ({
  method: 'PUT',
  path: `bars/${barId}/media`,
  body,
});

/** PUT /admin/menu-items/:id/image — ตั้ง/ลบรูปเมนู 1 รายการ */
export const menuItemImageAction = (
  itemId: string,
  body: C.MenuItemImageBody,
): AdminActionInput => ({
  method: 'PUT',
  path: `menu-items/${itemId}/image`,
  body,
});

/** ย่อเป็น webp แล้วอัปโหลดเข้า bar-media/<bar_id>/<folder>/ (policy ให้แอดมิน + MFA เขียนได้) → คืน path */
export async function uploadBarImage(
  barId: string,
  folder: BarMediaFolder,
  file: File,
): Promise<string> {
  const blob = await toWebp(file, folder === 'gallery' ? 1920 : 800, 0.82);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg');
  const path = barMediaPath(barId, folder, ext);
  const { upload_url } = await requestUploadUrl('bar-media', path);
  await Rest.upload(upload_url, blob, { 'x-upsert': 'false' });
  return path;
}
