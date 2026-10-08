import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าตอบรับคำเชิญเข้าทีมร้าน · backend: domains/bar-team */

export type { MyInvite } from '@nightout/contracts';

/** GET /me/invites */
export const useMyInvites = (enabled: boolean) =>
  useQuery({ queryKey: ['bar-team', 'my_invites'], enabled, queryFn: () => Rest.get<C.MyInvite[]>('/me/invites') });

/** POST /invites/:barId/respond */
export async function respondInvite(barId: string, accept: boolean) {
  await Rest.post(`/invites/${barId}/respond`, { accept } satisfies C.RespondInviteBody);
}
