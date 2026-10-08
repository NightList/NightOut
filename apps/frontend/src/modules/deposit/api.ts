import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { uploadDepositSlip } from '@/services/api/storage';
import { me } from '@/services/sync';

/** API ของหน้าโอนมัดจำ · backend: domains/deposit */

/** อัปโหลดสลิปเข้า deposit-slips/<user>/... แล้ว POST /bookings/:id/deposit */
export async function submitDeposit(bookingId: string, slip: Blob) {
  const path = await uploadDepositSlip(me().id, bookingId, slip);
  await Rest.post(`/bookings/${bookingId}/deposit`, { slip_path: path } satisfies C.SubmitDepositBody);
}
