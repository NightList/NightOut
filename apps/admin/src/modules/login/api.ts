import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าเข้าสู่ระบบ Backoffice · backend: domains/account */

/** GET /me/profile ด้วย token ที่ระบุ (ตอนเพิ่งล็อกอิน ก่อน Rest รู้จัก token) */
export const fetchMyProfile = (accessToken: string) => Rest.get<C.MyProfile>('/me/profile', { headers: { Authorization: `Bearer ${accessToken}` } });
