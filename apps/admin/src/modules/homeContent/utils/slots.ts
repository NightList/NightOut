/** ตำแหน่งของแต่ละช่องบนกริด bento หน้าแรก (สำหรับบอกแอดมินว่าการ์ดนี้อยู่ตรงไหน) */
export const SLOT_LABELS: Record<string, string> = {
  popular: 'การ์ดใหญ่ซ้ายบน',
  pub: 'แถวบน ช่อง 3',
  food: 'แถวบน ช่อง 4',
  live: 'แถวกลาง ช่อง 3',
  rooftop: 'แถวกลาง ช่อง 4',
  chill: 'แถวล่าง ช่อง 1',
  outdoor: 'แถวล่าง ช่อง 2',
  party: 'แถวล่าง กว้าง 2 ช่อง',
};

/** ขนาดบนกริดตัวอย่างใน Backoffice — ตรงกับ SPAN ใน apps/frontend/.../categoryGrid.tsx */
export const SLOT_SPAN: Record<string, string> = {
  popular: 'col-span-2 row-span-2',
  party: 'col-span-2',
};
