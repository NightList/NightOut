import { useEffect, type RefObject } from 'react';

/**
 * ตั้ง CSS variable บน element = ความยาวเส้นทแยงของมัน (px, ปัดขึ้น) และอัปเดตเมื่อขนาดเปลี่ยน (ResizeObserver)
 * ใช้กับของที่หมุนอยู่หลังกล่อง (แสงวิ่งรอบขอบ) ให้คลุมทุกมุมทั้งกล่องแนวนอนกว้างและกล่องสูงบนจอแคบ
 * ตั้งที่ element ตรง (style.setProperty) — เปลี่ยนแค่ตอน resize ไม่ใช่ทุกเฟรม
 */
export function useDiagonalVar(ref: RefObject<HTMLElement | null>, name: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // วัดทั้งกล่องรวม padding/border (offset*) — contentRect ไม่รวม padding จะได้เส้นทแยงสั้นไปจนมุมโหว่
    const ro = new ResizeObserver(() => {
      el.style.setProperty(name, `${Math.ceil(Math.hypot(el.offsetWidth, el.offsetHeight))}px`);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      el.style.removeProperty(name);
    };
  }, [ref, name]);
}
