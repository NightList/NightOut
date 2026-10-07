import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ลงทะเบียนครั้งเดียว — โหลดเฉพาะในหน้าจัดอันดับ (route lazy) ไม่ถ่วงหน้าอื่น
gsap.registerPlugin(ScrollTrigger, useGSAP);

/** เส้นโค้งเดียวกับ --ease-out ของ skill animate: cubic-bezier(0.23, 1, 0.32, 1) ≈ expo.out ของ GSAP */
export const EASE_OUT = 'expo.out';

/** เงื่อนไขสำหรับ gsap.matchMedia() — reduced motion + จอแคบกว่า Tailwind `sm` (640px) */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const MOTION_REDUCE = '(prefers-reduced-motion: reduce)';
export const NARROW = '(max-width: 639px)';

export { gsap, ScrollTrigger, useGSAP };
