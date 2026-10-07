import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** site-content — เนื้อหาหน้าแรกที่แอดมินแก้ได้ (Hero + การ์ดหมวด) · backend: domains/site-content */
export const fetchSiteHome = () => Rest.get<C.PublicHomeResult>('/public/home');
