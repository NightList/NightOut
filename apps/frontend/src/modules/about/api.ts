import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้า /about · backend: domains/site-team */

export type { PublicTeamMember as SiteTeamMember } from '@nightout/contracts';

/** GET /public/team — เฉพาะคนที่ active เรียงตาม sort_order */
export const useSiteTeam = () =>
  useQuery({ queryKey: ['site-team', 'public'], staleTime: 10 * 60_000, queryFn: () => Rest.get<C.PublicTeamMember[]>('/public/team') });
