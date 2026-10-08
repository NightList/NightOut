import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { uploadSafetyEvidence } from '@/services/api/storage';

/** API ของหน้าความปลอดภัยของร้าน · backend: domains/bar */

/** PUT /merchant/bars/:barId/safety/:key */
export async function setSafety(barId: string, key: string, value: C.SafetyValue) {
  await Rest.put(`/merchant/bars/${barId}/safety/${key}`, { value } satisfies C.SafetyBody);
}

/** อัปโหลดหลักฐาน (รูป/PDF) เข้า bar-verifications แล้ว PUT /merchant/bars/:barId/safety/:key/evidence ให้ทีม NightOut ตรวจ */
export async function uploadSafetyProof(barId: string, key: string, file: Blob) {
  const path = await uploadSafetyEvidence(barId, key, file);
  await Rest.put(`/merchant/bars/${barId}/safety/${key}/evidence`, { path } satisfies C.EvidenceBody);
}
