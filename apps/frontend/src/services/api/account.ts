import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { refresh, setProfileName } from '@/services/sync';

/** account — โปรไฟล์ ความชอบ แจ้งเตือน ร้านโปรด ลบบัญชี · backend: domains/account */

/** GET /me/profile ด้วย token ที่ระบุ (ตอนโหลด session ก่อน Rest รู้จัก token) */
export const fetchMyProfile = (accessToken: string) => Rest.get<C.MyProfile>('/me/profile', { headers: { Authorization: `Bearer ${accessToken}` } });

export async function updateProfile(patch: C.UpdateProfileBody) {
  await Rest.patch('/me/profile', patch);
  if (patch.display_name) setProfileName(patch.display_name);
  await refresh();
}

/** คืน true = เพิ่มเป็นร้านโปรด */
export async function toggleFavorite(barId: string) {
  const r = await Rest.post<C.ToggleFavoriteResult>(`/me/favorites/${barId}/toggle`);
  await refresh();
  return r.favorite;
}

export async function markAllRead() {
  await Rest.post('/me/notifications/read', {} satisfies C.MarkReadBody);
  await refresh();
}

/** ลบบัญชี (ต้องไม่มีการจองที่ยังไม่จบ) — หลังจากนี้เข้าสู่ระบบไม่ได้ */
export async function deleteAccount() {
  await Rest.post('/me/delete', {});
}
