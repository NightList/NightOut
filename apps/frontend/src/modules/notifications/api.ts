import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าแจ้งเตือน · backend: domains/account */

/** POST /me/notifications/read — อ่านทั้งหมด */
export async function markAllRead() {
  await Rest.post('/me/notifications/read', {} satisfies C.MarkReadBody);
}
