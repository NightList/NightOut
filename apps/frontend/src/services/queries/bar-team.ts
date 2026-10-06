import { useQuery } from '@tanstack/react-query';
import { fetchBarTeam, fetchMyInvites } from '@/services/api/bar-team';
import { barTeamKeys } from './keys';

export type { BarTeamMember, MyInvite } from '@nightout/contracts';

export const useBarTeam = (barId: string) => useQuery({ queryKey: barTeamKeys.team(barId), queryFn: () => fetchBarTeam(barId) });
export const useMyInvites = (enabled: boolean) => useQuery({ queryKey: barTeamKeys.myInvites, enabled, queryFn: fetchMyInvites });
