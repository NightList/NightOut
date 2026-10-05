import { useQuery } from '@tanstack/react-query';
import { fetchDepositLedger } from '@/services/api/deposit';
import { depositKeys } from './keys';

export type { DepositLedgerRow } from '@nightout/contracts';

/** สมุดมัดจำของร้าน (ไม่มี path สลิป) */
export const useBarLedger = (barId: string) => useQuery({ queryKey: depositKeys.ledger(barId), queryFn: () => fetchDepositLedger(barId) });
