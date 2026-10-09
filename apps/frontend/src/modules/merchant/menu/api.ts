import type * as C from '@nightout/contracts';
import type { MenuItem } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';
import { dataUrlToBlob, uploadBarMedia } from '@/services/api/storage';
import { compressImage } from '@/ui/utils/media';

/** API ของหน้าเมนู · backend: domains/bar */

/** PUT /merchant/bars/:barId/menu — แทนทั้งเมนู (image_path ส่งทุกรายการ: null = ไม่มีรูป · รูปที่ถูกแทน/ลบ backend ลบไฟล์ให้) */
export async function setMenu(barId: string, menu: MenuItem[]) {
  const body: C.MenuBody = {
    items: menu.map((m) => ({
      id: m.id,
      category: m.category,
      name: m.name,
      price: m.price,
      available: m.available,
      image_path: m.imagePath ?? null,
    })),
  };
  await Rest.put(`/merchant/bars/${barId}/menu`, body);
}

/** ย่อรูป (ด้านยาว 800px) แล้วอัปโหลดเข้า bar-media/<bar_id>/menu/ — คืน path ไว้ใส่ imagePath ของรายการ */
export async function uploadMenuPhoto(barId: string, file: File) {
  const blob = await dataUrlToBlob(await compressImage(file, 800, 0.8));
  return uploadBarMedia(barId, 'menu', blob);
}
