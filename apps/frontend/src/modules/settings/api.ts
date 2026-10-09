import { Rest } from '@nightout/utils/rest';

/** API ของหน้าตั้งค่าบัญชี · backend: domains/account */

/** POST /me/delete — ลบบัญชี (ต้องไม่มีการจองที่ยังไม่จบ) หลังจากนี้เข้าสู่ระบบไม่ได้ */
export async function deleteAccount() {
  await Rest.post('/me/delete', {});
}
