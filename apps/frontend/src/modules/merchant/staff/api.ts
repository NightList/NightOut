import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าทีมร้าน (/merchant/staff) · backend: domains/bar-team */

export type { BarTeamMember } from '@nightout/contracts';

/** GET /merchant/bars/:barId/team */
export const useBarTeam = (barId: string) =>
  useQuery({ queryKey: ['bar-team', 'team', barId], queryFn: () => Rest.get<C.BarTeamMember[]>(`/merchant/bars/${barId}/team`) });

/** POST /merchant/bars/:barId/staff */
export async function inviteStaff(barId: string, email: string, role: C.BarStaffRole) {
  await Rest.post(`/merchant/bars/${barId}/staff`, { email, role } satisfies C.InviteStaffBody);
}

/** DELETE /merchant/bars/:barId/staff/:userId */
export async function removeStaff(barId: string, userId: string) {
  await Rest.delete(`/merchant/bars/${barId}/staff/${userId}`);
}
