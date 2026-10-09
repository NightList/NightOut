import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { dataUrlToBlob, uploadBarMedia } from '@/services/api/storage';
import { compressImage } from '@/ui/utils/media';

/** API ของหน้าข้อมูลร้าน · backend: domains/bar */

/** PATCH /merchant/bars/:barId/info */
export async function updateBarInfo(barId: string, info: C.BarInfoBody) {
  await Rest.patch(`/merchant/bars/${barId}/info`, info);
}

/** PUT /merchant/bars/:barId/media — แกลเลอรีทั้งชุดตามลำดับ + รูปปก (ต้องอยู่ในแกลเลอรี) */
export async function setBarMedia(barId: string, body: C.BarMediaBody) {
  return Rest.put<C.BarMediaResult>(`/merchant/bars/${barId}/media`, body);
}

/** ย่อรูป (ด้านยาว 1920px) แล้วอัปโหลดเข้า bar-media/<bar_id>/gallery/ — คืน path ไว้ส่งให้ setBarMedia */
export async function uploadGalleryPhoto(barId: string, file: File) {
  const blob = await dataUrlToBlob(await compressImage(file, 1920, 0.82));
  return uploadBarMedia(barId, 'gallery', blob);
}
