import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { currentProfile, setProfileName } from '@/services/sync';

/** API ของหน้า onboarding · backend: domains/account */

/** PATCH /me/profile — ตั้งชื่อใน session ก่อนส่ง (Rest โหลด store ใหม่ด้วยชื่อนี้) · บันทึกไม่สำเร็จ = คืนชื่อเดิม */
export async function updateProfile(patch: C.UpdateProfileBody) {
  const prevName = currentProfile()?.displayName;
  if (patch.display_name) setProfileName(patch.display_name);
  try {
    await Rest.patch('/me/profile', patch);
  } catch (e) {
    if (patch.display_name && prevName !== undefined) setProfileName(prevName);
    throw e;
  }
}
