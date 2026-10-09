import type * as C from '@nightout/contracts';
import type { MenuItem } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าเมนู · backend: domains/bar */

/** PUT /merchant/bars/:barId/menu — แทนทั้งเมนู */
export async function setMenu(barId: string, menu: MenuItem[]) {
  const body: C.MenuBody = { items: menu.map((m) => ({ id: m.id, category: m.category, name: m.name, price: m.price, available: m.available })) };
  await Rest.put(`/merchant/bars/${barId}/menu`, body);
}
