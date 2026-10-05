import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { refresh } from '@/services/sync';

/** bar-team — ทีมร้าน: เชิญ นำออก คำเชิญของฉัน · backend: domains/bar-team */

export async function inviteStaff(barId: string, email: string, role: C.BarStaffRole) {
  await Rest.post(`/merchant/bars/${barId}/staff`, { email, role } satisfies C.InviteStaffBody);
}

export async function removeStaff(barId: string, userId: string) {
  await Rest.delete(`/merchant/bars/${barId}/staff/${userId}`);
}

export async function respondInvite(barId: string, accept: boolean) {
  await Rest.post(`/invites/${barId}/respond`, { accept } satisfies C.RespondInviteBody);
  await refresh();
}

export const fetchBarTeam = (barId: string) => Rest.get<C.BarTeamMember[]>(`/merchant/bars/${barId}/team`);
export const fetchMyInvites = () => Rest.get<C.MyInvite[]>('/me/invites');
