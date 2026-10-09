import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าบัตรจองจากลิงก์แชร์ · backend: domains/booking */

export type { ShareCard } from '@nightout/contracts';

/** GET /share-cards/:token — ไม่มีข้อมูลส่วนตัว */
export const useShareCard = (token: string) =>
  useQuery({ queryKey: ['booking', 'share_card', token], queryFn: () => Rest.get<C.ShareCard | null>(`/share-cards/${encodeURIComponent(token)}`) });
