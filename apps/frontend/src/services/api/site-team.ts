import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** site-team — ทีมงาน NightOut หน้า /about · backend: domains/site-team */
export const fetchSiteTeam = () => Rest.get<C.PublicTeamMember[]>('/public/team');
