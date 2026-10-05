import { useQuery } from '@tanstack/react-query';
import { fetchSiteTeam } from '@/services/api/site-team';
import { siteTeamKeys } from './keys';

export type { PublicTeamMember as SiteTeamMember } from '@nightout/contracts';

/** ทีมงานหน้า /about (view public_team — เฉพาะคนที่ active เรียงตาม sort_order) */
export const useSiteTeam = () => useQuery({ queryKey: siteTeamKeys.public, staleTime: 10 * 60_000, queryFn: fetchSiteTeam });
