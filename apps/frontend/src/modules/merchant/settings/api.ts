import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าตั้งค่าร้าน (การจอง + บัญชีรับเงิน) · backend: domains/bar */

/** PATCH /merchant/bars/:barId/booking-settings */
export async function updateBookingSettings(barId: string, s: C.BookingSettingsBody) {
  await Rest.patch(`/merchant/bars/${barId}/booking-settings`, s);
}

/** PUT /merchant/bars/:barId/payout-account */
export async function setPayoutAccount(barId: string, a: C.PayoutAccountBody) {
  await Rest.put(`/merchant/bars/${barId}/payout-account`, a);
}
