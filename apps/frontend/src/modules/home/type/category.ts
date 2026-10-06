import type { Icon } from '@phosphor-icons/react';

/** วงกลมหมวดหมู่ในหน้าแรก — ลิงก์ไป /ranking, /search?category= หรือ /search?style= */
export interface HomeCategory {
  key: string;
  title: string;
  to: string;
  icon: Icon;
}
