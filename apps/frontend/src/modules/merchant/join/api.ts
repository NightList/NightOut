import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าสมัครลงร้าน · backend: domains/bar */

/** POST /merchant/join */
export const merchantJoin = (input: C.MerchantJoinBody) => Rest.post<C.MerchantJoinResult>('/merchant/join', input);
