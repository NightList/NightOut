/**
 * พื้นผิวการ์ดหน้าแรก — ขอบเส้นเดียวคม (hairline) + ไฮไลต์ขอบบนด้านใน 1px · ไม่มีเงาเรือง/backdrop-blur
 * พื้นทึบเกือบเต็มให้ aurora ด้านหลังไม่ซึมเข้าการ์ดจนขอบดูฟุ้ง
 */
export const SURFACE =
  'border border-border bg-card dark:border-white/[0.08] dark:bg-[#14121c]/90 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

/** hover ของการ์ดที่กดได้ — เปลี่ยนแค่สีขอบ (เมาส์เท่านั้น: Tailwind v4 hover อยู่ใน @media (hover: hover)) */
export const SURFACE_HOVER =
  'transition-colors duration-150 ease-out hover:border-purple/50 dark:hover:border-purple/50';
