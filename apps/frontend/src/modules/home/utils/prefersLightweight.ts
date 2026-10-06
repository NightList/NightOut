/** เน็ตช้า/โหมดประหยัดเน็ต → พื้นหลัง Hero ไม่โหลดวิดีโอ/ไม่เล่นแอนิเมชัน ใช้ภาพนิ่งแทน */
export function prefersLightweight() {
  const c = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''));
}
