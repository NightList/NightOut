import type { Icon } from '@phosphor-icons/react';

/** การ์ดหมวดหมู่ในหน้าแรก — ลิงก์ไป /ranking, /search?category= หรือ /search?style= */
export interface HomeCategory {
  key: string;
  title: string;
  /** คำอธิบายสั้นใต้ชื่อหมวดบนการ์ด */
  hint: string;
  to: string;
  icon: Icon;
}
