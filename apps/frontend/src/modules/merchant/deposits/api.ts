import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าสมุดมัดจำของร้าน · backend: domains/deposit */

export type { DepositLedgerRow } from '@nightout/contracts';

/** GET /merchant/bars/:barId/deposit-ledger (ไม่มี path สลิป) */
export const useBarLedger = (barId: string) =>
  useQuery({ queryKey: ['deposit', 'ledger', barId], queryFn: () => Rest.get<C.DepositLedgerRow[]>(`/merchant/bars/${barId}/deposit-ledger`) });
