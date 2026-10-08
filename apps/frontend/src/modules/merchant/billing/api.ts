import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าค่าคอมของร้าน · backend: domains/billing */

export type { BillingEventRow } from '@nightout/contracts';

/** GET /merchant/bars/:barId/billing-events */
export const useBillingEvents = (barId: string) =>
  useQuery({ queryKey: ['billing', 'events', barId], queryFn: () => Rest.get<C.BillingEventRow[]>(`/merchant/bars/${barId}/billing-events`) });
