import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { uploadDepositSlip } from '@/services/api/storage';
import { me, refresh } from '@/services/sync';

/** deposit — ส่งสลิป คืนมัดจำ สมุดมัดจำของร้าน · backend: domains/deposit · สัญญา: contracts deposit.ts */

/** อัปโหลดสลิปเข้า deposit-slips/<user>/... แล้วแจ้งหลังบ้าน */
export async function submitDeposit(bookingId: string, slip: Blob) {
  const path = await uploadDepositSlip(me().id, bookingId, slip);
  await Rest.post(`/bookings/${bookingId}/deposit`, { slip_path: path } satisfies C.SubmitDepositBody);
  await refresh();
}

/** ร้านยืนยันคืนมัดจำลูกค้า → NightOut โอนคืน (ทีมร้านทุกบทบาท) */
export async function refundDeposit(bookingId: string, reason: string) {
  const r = await Rest.post<C.RefundDepositResult>(`/merchant/bookings/${bookingId}/refund`, { reason: reason.trim() } satisfies C.RefundDepositBody);
  await refresh();
  return r;
}

export const fetchDepositLedger = (barId: string) => Rest.get<C.DepositLedgerRow[]>(`/merchant/bars/${barId}/deposit-ledger`);
