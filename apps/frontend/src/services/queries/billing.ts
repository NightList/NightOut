import { useQuery } from '@tanstack/react-query';
import { fetchBillingEvents } from '@/services/api/billing';
import { billingKeys } from './keys';

export type { BillingEventRow } from '@nightout/contracts';

export const useBillingEvents = (barId: string) => useQuery({ queryKey: billingKeys.events(barId), queryFn: () => fetchBillingEvents(barId) });
