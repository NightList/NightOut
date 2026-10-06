import './auroraBackdrop.css';

/**
 * พื้นหลังใต้ Hero ของหน้าแรก (เฉพาะธีมมืด) — aurora มืดแบบเรียบ ตามสีธีม Midnight Gold
 * พื้น --background + ม่านแสงม่วง/ทองจาง ๆ 3 ผืน · ไม่มีภาพ ไม่มี motion (ให้ Hero เป็นจุดเด่นที่เดียว)
 * วางใน container ที่ relative + isolate (ดู page.tsx)
 */
export function AuroraBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="aurora pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden dark:block"
    >
      <div className="aurora__veil aurora__veil--purple" />
      <div className="aurora__veil aurora__veil--gold" />
      <div className="aurora__veil aurora__veil--violet" />
    </div>
  );
}
