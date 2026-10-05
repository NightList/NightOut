import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** billing — ค่าคอมของร้าน · backend: domains/billing */
export const fetchBillingEvents = (barId: string) => Rest.get<C.BillingEventRow[]>(`/merchant/bars/${barId}/billing-events`);
